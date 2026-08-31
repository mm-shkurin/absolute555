"""What a guest account may and may not do, and what deleting a listing takes with it.

A guest is a real user row created from a device id, so every one of these is a check on
the caller rather than on the thing they reach for — which is exactly the kind of rule
that disappears when a dependency is dropped from a signature.
"""

import uuid

import jwt

from tests.conftest import run_sql
from tests.test_listing_lifecycle import COMPLETE, _create


def _id_of(headers):
    return jwt.decode(
        headers["Authorization"].removeprefix("Bearer "), options={"verify_signature": False}
    )["id"]


def _verify(headers):
    run_sql("UPDATE users SET is_guest = false WHERE id = :id", {"id": uuid.UUID(_id_of(headers))})
    return headers


def test_should_let_a_guest_hold_several_drafts(client, seller):
    first = _create(client, seller)
    second = _create(client, seller)

    mine = client.get("/api/v1/sale_car/user", headers=seller)

    assert mine.status_code == 200, mine.text
    assert {first, second} <= {listing["sale_car_id"] for listing in mine.json()}


def test_should_refuse_a_guest_the_document_of_their_own_listing(client, seller):
    listing_id = _create(client, seller)

    # The scan endpoint is open to a guest; the offer routes are not. Both hang off the
    # same account, so the split is worth stating.
    assert client.get(f"/api/v1/offer/car/{listing_id}", headers=seller).status_code == 403
    assert client.get("/api/v1/offer/my", headers=seller).status_code == 200


def test_should_open_the_offer_routes_once_the_account_is_verified(client, seller):
    listing_id = _create(client, seller)
    _verify(seller)

    response = client.get(f"/api/v1/offer/car/{listing_id}", headers=seller)

    assert response.status_code == 200, response.text
    assert response.json() == []


def test_should_delete_a_listing_only_for_its_owner(client, seller, signed_in):
    listing_id = _create(client, seller)
    stranger = signed_in()

    refused = client.delete(f"/api/v1/sale_car/{listing_id}", headers=stranger)
    assert refused.status_code == 403, refused.text
    assert client.get(f"/api/v1/sale_car/{listing_id}", headers=seller).status_code == 200

    removed = client.delete(f"/api/v1/sale_car/{listing_id}", headers=seller)
    assert removed.status_code == 204, removed.text
    assert client.get(f"/api/v1/sale_car/{listing_id}", headers=seller).status_code == 404


def test_should_report_deleting_a_listing_that_is_not_there(client, seller):
    response = client.delete(f"/api/v1/sale_car/{uuid.uuid4()}", headers=seller)

    assert response.status_code == 404, response.text
    assert response.json()["code"] == "LISTING_NOT_FOUND"


def test_should_refuse_an_empty_edit(client, seller):
    listing_id = _create(client, seller)

    response = client.patch(f"/api/v1/sale_car/{listing_id}", headers=seller, json={})

    assert response.status_code == 422, response.text
    assert response.json()["code"] == "EMPTY_PATCH"


def test_should_refuse_a_field_the_contract_does_not_carry(client, seller):
    listing_id = _create(client, seller)

    response = client.patch(
        f"/api/v1/sale_car/{listing_id}", headers=seller, json=dict(COMPLETE, status="published")
    )

    assert response.status_code == 422, response.text
    assert client.get(f"/api/v1/sale_car/{listing_id}", headers=seller).json()["status"] == "draft"
