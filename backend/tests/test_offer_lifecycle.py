"""What happens to an offer after it is made.

Story 10. Six statuses because six different things happen: the buyer took it back,
nobody answered in time, or somebody else bought the car. A single "rejected" would tell
a buyer they were turned down when nobody turned them down.
"""

import pytest

from tests.conftest import verify_account as _verify
from tests.test_listing_lifecycle import COMPLETE, _create


@pytest.fixture
def published(client, seller, moderator, catalogue, attach_photo):
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
    return _verify(signed_in())


def _offer(client, headers, listing_id, price=1000000.0):
    return client.post(
        "/api/v1/offer/", headers=headers, json={"sale_car_id": listing_id, "price": price}
    )


def _made(client, headers, listing_id, price=1000000.0):
    response = _offer(client, headers, listing_id, price)
    assert response.status_code == 201, response.text
    return response.json()["offer_id"]


def _status_of(client, headers, offer_id):
    response = client.get(f"/api/v1/offer/{offer_id}", headers=headers)
    assert response.status_code == 200, response.text
    return response.json()["status"]


def _my(client, headers, side):
    response = client.get("/api/v1/offer/my", headers=headers, params={"side": side})
    assert response.status_code == 200, response.text
    return [offer["offer_id"] for offer in response.json()]


def test_should_separate_what_was_sent_from_what_was_received(client, seller, published, buyer):
    _verify(seller)
    offer_id = _made(client, buyer, published())

    assert offer_id in _my(client, buyer, "sent")
    assert offer_id not in _my(client, buyer, "received")
    assert offer_id in _my(client, seller, "received")
    assert offer_id not in _my(client, seller, "sent")


def test_should_let_a_buyer_take_back_an_unanswered_offer(client, seller, published, buyer):
    _verify(seller)
    offer_id = _made(client, buyer, published())

    withdrawn = client.post(f"/api/v1/offer/{offer_id}/withdraw", headers=buyer)

    assert withdrawn.status_code == 200, withdrawn.text
    assert withdrawn.json()["status"] == "withdrawn"
    assert _status_of(client, seller, offer_id) == "withdrawn"


def test_should_let_a_buyer_bargain_again_after_withdrawing(client, published, buyer):
    listing_id = published()
    offer_id = _made(client, buyer, listing_id, price=900000.0)
    client.post(f"/api/v1/offer/{offer_id}/withdraw", headers=buyer)

    again = _offer(client, buyer, listing_id, price=950000.0)

    assert again.status_code == 201, again.text
    assert again.json()["status"] == "pending"


def test_should_let_nobody_but_the_buyer_withdraw(client, seller, published, buyer):
    _verify(seller)
    offer_id = _made(client, buyer, published())

    response = client.post(f"/api/v1/offer/{offer_id}/withdraw", headers=seller)

    assert response.status_code == 403, response.text
    assert _status_of(client, buyer, offer_id) == "pending"


def test_should_refuse_to_withdraw_a_settled_offer(client, seller, published, buyer):
    _verify(seller)
    offer_id = _made(client, buyer, published())
    client.patch(f"/api/v1/offer/{offer_id}/status", headers=seller, json={"status": "rejected"})

    response = client.post(f"/api/v1/offer/{offer_id}/withdraw", headers=buyer)

    assert response.status_code == 409, response.text
    assert _status_of(client, buyer, offer_id) == "rejected"


def test_should_sell_the_car_and_close_the_other_offers(client, seller, published, signed_in):
    _verify(seller)
    listing_id = published()
    first, second, third = (
        _made(client, _verify(signed_in()), listing_id, price) for price in (900000.0, 950000.0, 1000000.0)
    )

    accepted = client.patch(
        f"/api/v1/offer/{second}/status", headers=seller, json={"status": "accepted"}
    )

    assert accepted.status_code == 200, accepted.text
    assert accepted.json()["status"] == "accepted"
    assert _status_of(client, seller, first) == "car_sold"
    assert _status_of(client, seller, third) == "car_sold"
    assert client.get(f"/api/v1/sale_car/{listing_id}").json()["status"] == "sold"


def test_should_take_a_sold_car_out_of_the_feed(client, seller, published, buyer):
    _verify(seller)
    listing_id = published()
    offer_id = _made(client, buyer, listing_id)

    client.patch(f"/api/v1/offer/{offer_id}/status", headers=seller, json={"status": "accepted"})

    feed = client.get("/api/v1/sale_car/list", params={"size": 60}).json()
    assert listing_id not in [card["sale_car_id"] for card in feed["items"]]
    assert client.get(f"/api/v1/sale_car/{listing_id}").json()["status"] == "sold"


def test_should_leave_the_other_offers_alone_when_one_is_rejected(
    client, seller, published, signed_in
):
    _verify(seller)
    listing_id = published()
    first = _made(client, _verify(signed_in()), listing_id, price=900000.0)
    second = _made(client, _verify(signed_in()), listing_id, price=950000.0)

    client.patch(f"/api/v1/offer/{first}/status", headers=seller, json={"status": "rejected"})

    assert _status_of(client, seller, first) == "rejected"
    assert _status_of(client, seller, second) == "pending"
    assert client.get(f"/api/v1/sale_car/{listing_id}").json()["status"] == "published"


def test_should_refuse_a_bid_on_a_listing_that_is_not_published(client, seller, buyer, catalogue):
    brand_id, model_id = catalogue
    draft = _create(client, seller)
    client.patch(
        f"/api/v1/sale_car/{draft}",
        headers=seller,
        json=dict(COMPLETE, brand_id=brand_id, model_id=model_id),
    )

    response = _offer(client, buyer, draft)

    assert response.status_code == 404, response.text


def test_should_refuse_a_bid_on_a_car_already_sold(client, seller, published, buyer, signed_in):
    _verify(seller)
    listing_id = published()
    offer_id = _made(client, buyer, listing_id)
    client.patch(f"/api/v1/offer/{offer_id}/status", headers=seller, json={"status": "accepted"})

    late = _offer(client, _verify(signed_in()), listing_id)

    assert late.status_code == 404, late.text
