"""Offers on a listing, over HTTP only.

The rules are all refusals: a seller cannot bid on their own car, a buyer cannot hold two
live bids on one car, only the seller settles a bid, and a settled bid stays settled.
Every one of them is invisible in the code — a missing branch and a written one look
alike — so they only exist here.
"""

import uuid

import jwt
import pytest

from tests.conftest import run_sql
from tests.test_listing_lifecycle import COMPLETE, _create


def _offer(client, headers, listing_id, price=1000000.0):
    return client.post(
        "/api/v1/offer/", headers=headers, json={"sale_car_id": listing_id, "price": price}
    )


def _verify(headers):
    """Turn a guest account into an ordinary one.

    A guest may bid but may not read the bids on their own listing (`forbid_guest`), and
    this project has no endpoint that verifies an account -- story 13 builds it. Setup
    reaches for the row, exactly as the moderator fixture does; every assertion still
    goes over HTTP.
    """
    user_id = jwt.decode(headers["Authorization"].removeprefix("Bearer "), options={"verify_signature": False})["id"]
    run_sql("UPDATE users SET is_guest = false WHERE id = :id", {"id": uuid.UUID(user_id)})
    return headers


def _settle(client, headers, offer_id, decision):
    return client.patch(
        f"/api/v1/offer/{offer_id}/status", headers=headers, json={"status": decision}
    )


@pytest.fixture
def published(client, seller, moderator, catalogue, attach_photo):
    """A listing buyers can actually bargain over.

    Story 10 narrowed offers to published listings, so the fixture drives the real path:
    fill in, send for review, publish.
    """
    brand_id, model_id = catalogue

    def _publish():
        listing_id = _create(client, seller)
        body = dict(COMPLETE, brand_id=brand_id, model_id=model_id)
        assert client.patch(f"/api/v1/sale_car/{listing_id}", headers=seller, json=body).status_code == 200
        attach_photo(listing_id, seller, count=3)
        client.post(f"/api/v1/sale_car/{listing_id}/submit", headers=seller)
        assert client.post(f"/api/v1/sale_car/{listing_id}/approve", headers=moderator).status_code == 200
        return listing_id

    return _publish


@pytest.fixture
def buyer(signed_in):
    """A signed-in person who is not a guest: a guest does not bargain (story 10)."""
    return _verify(signed_in())


@pytest.fixture
def listing_with_offer(client, published, buyer):
    listing_id = published()
    response = _offer(client, buyer, listing_id)
    assert response.status_code == 201, response.text
    return listing_id, buyer, response.json()["offer_id"]


def test_should_record_a_bid_as_pending(client, listing_with_offer):
    _, buyer, offer_id = listing_with_offer

    mine = client.get("/api/v1/offer/my", headers=buyer)

    assert mine.status_code == 200, mine.text
    assert [offer["offer_id"] for offer in mine.json()] == [offer_id]
    assert mine.json()[0]["status"] == "pending"


def test_should_refuse_a_bid_on_your_own_listing(client, seller, published):
    listing_id = published()
    _verify(seller)

    response = _offer(client, seller, listing_id)

    assert response.status_code == 409, response.text
    assert response.json()["code"] == "OFFER_ON_OWN_CAR"


def test_should_refuse_a_second_live_bid_from_the_same_buyer(client, listing_with_offer):
    listing_id, buyer, _ = listing_with_offer

    response = _offer(client, buyer, listing_id, price=1200000.0)

    assert response.status_code == 409, response.text
    assert response.json()["code"] == "DUPLICATE_PENDING_OFFER"


def test_should_refuse_a_bid_on_a_listing_that_does_not_exist(client, buyer):
    response = _offer(client, buyer, str(uuid.uuid4()))

    assert response.status_code == 404, response.text
    assert response.json()["code"] == "LISTING_NOT_FOUND"


def test_should_refuse_a_bid_of_nothing(client, published, buyer):
    response = _offer(client, buyer, published(), price=0)

    assert response.status_code == 422, response.text


def test_should_let_the_seller_settle_a_bid_and_only_once(client, seller, listing_with_offer):
    _, _, offer_id = listing_with_offer

    accepted = _settle(client, seller, offer_id, "accepted")

    assert accepted.status_code == 200, accepted.text
    assert accepted.json()["status"] == "accepted"

    again = _settle(client, seller, offer_id, "rejected")
    assert again.status_code == 409, again.text
    assert again.json()["code"] == "OFFER_ALREADY_SETTLED"


def test_should_refuse_to_let_the_buyer_settle_their_own_bid(client, listing_with_offer):
    _, buyer, offer_id = listing_with_offer

    response = _settle(client, buyer, offer_id, "accepted")

    assert response.status_code == 403, response.text
    assert response.json()["code"] == "NOT_CAR_OWNER"


def test_should_hide_the_bids_on_a_listing_from_everyone_but_its_seller(
    client, seller, signed_in, listing_with_offer
):
    listing_id, bidder, offer_id = listing_with_offer
    _verify(seller)

    assert client.get(f"/api/v1/offer/car/{listing_id}", headers=seller).status_code == 200
    stranger = signed_in()
    refused = client.get(f"/api/v1/offer/car/{listing_id}", headers=stranger)
    assert refused.status_code == 403, refused.text
    assert client.get(f"/api/v1/offer/{offer_id}", headers=stranger).status_code == 403
    assert client.get(f"/api/v1/offer/{offer_id}", headers=bidder).status_code == 200


def test_should_refuse_a_guest_the_bids_on_their_own_listing(client, seller, listing_with_offer):
    listing_id, _, _ = listing_with_offer

    response = client.get(f"/api/v1/offer/car/{listing_id}", headers=seller)

    assert response.status_code == 403, response.text
    assert response.json()["code"] == "GUEST_FORBIDDEN"


def test_should_refuse_a_bid_from_a_guest(client, published, signed_in):
    response = _offer(client, signed_in(), published())

    assert response.status_code == 403, response.text
    assert response.json()["code"] == "GUEST_FORBIDDEN"


def test_should_report_an_identifier_that_is_not_one_as_such(client, seller):
    response = client.get("/api/v1/offer/not-a-uuid", headers=seller)

    assert response.status_code == 422, response.text
    assert response.json()["code"] == "MALFORMED_IDENTIFIER"


def test_should_refuse_every_offer_route_to_an_unauthenticated_caller(client, published):
    listing_id = published()

    assert _offer(client, {}, listing_id).status_code == 401
    assert client.get("/api/v1/offer/my").status_code == 401
    assert client.get(f"/api/v1/offer/car/{listing_id}").status_code == 401
