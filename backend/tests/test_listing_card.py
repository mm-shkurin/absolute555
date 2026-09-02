"""One listing as the person in front of it may see it.

Story 8. The card is the same payload for everyone except the phone number, which is the
seller's personal number: a field carrying it to every reader is one pass of a scraper
away from every number on the platform, and the button on the screen would be decoration.
"""

import uuid

import pytest

from tests.test_listing_lifecycle import COMPLETE, _create

PHONE = "+79995550101"


@pytest.fixture
def published(client, seller, moderator, catalogue, attach_photo):
    brand_id, model_id = catalogue
    listing_id = _create(client, seller)
    body = dict(COMPLETE, brand_id=brand_id, model_id=model_id, phone_number=PHONE)
    assert client.patch(f"/api/v1/sale_car/{listing_id}", headers=seller, json=body).status_code == 200
    attach_photo(listing_id, seller, count=3)
    assert client.post(f"/api/v1/sale_car/{listing_id}/submit", headers=seller).status_code == 200
    assert client.post(f"/api/v1/sale_car/{listing_id}/approve", headers=moderator).status_code == 200
    return listing_id


def _card(client, listing_id, headers=None):
    response = client.get(f"/api/v1/sale_car/{listing_id}", headers=headers or {})
    assert response.status_code == 200, response.text
    return response.json()


def _reveal(client, listing_id, headers=None):
    return client.post(f"/api/v1/sale_car/{listing_id}/reveal-phone", headers=headers or {})


def test_should_open_a_published_listing_to_a_reader_who_has_not_signed_in(client, published):
    card = _card(client, published)

    assert card["status"] == "published"
    assert card["brand"] and card["year"] and card["price"]
    assert card["photos"]


def test_should_keep_the_phone_number_out_of_the_card(client, published, signed_in):
    assert _card(client, published)["phone_number"] is None
    assert _card(client, published, signed_in())["phone_number"] is None


def test_should_give_the_phone_number_when_it_is_asked_for(client, published, signed_in):
    response = _reveal(client, published, signed_in())

    assert response.status_code == 200, response.text
    assert response.json()["phone_number"] == PHONE


def test_should_refuse_to_reveal_a_number_to_a_reader_who_has_not_signed_in(client, published):
    assert _reveal(client, published).status_code == 401


def test_should_show_the_owner_their_own_number_without_asking(client, published, seller):
    assert _card(client, published, seller)["phone_number"] == PHONE


def test_should_show_a_moderator_the_number_without_asking(client, published, moderator):
    assert _card(client, published, moderator)["phone_number"] == PHONE


def test_should_name_the_seller_on_the_card(client, published, seller):
    card = _card(client, published)

    assert card["seller"]["user_id"]
    assert "phone_number" not in card["seller"]


def test_should_not_reveal_a_number_for_a_listing_nobody_may_see(client, seller, signed_in):
    draft = _create(client, seller)
    client.patch(f"/api/v1/sale_car/{draft}", headers=seller, json={"phone_number": PHONE})

    response = _reveal(client, draft, signed_in())

    assert response.status_code == 404, response.text
    assert response.json()["code"] == "LISTING_NOT_FOUND"


def test_should_answer_a_listing_that_does_not_exist_the_same_way(client, signed_in):
    response = _reveal(client, str(uuid.uuid4()), signed_in())

    assert response.status_code == 404, response.text
    assert response.json()["code"] == "LISTING_NOT_FOUND"


def test_should_keep_a_sold_listing_readable_but_out_of_the_feed(client, published, seller):
    assert client.post(f"/api/v1/sale_car/{published}/sold", headers=seller).status_code == 200

    assert _card(client, published)["status"] == "sold"
    feed = client.get("/api/v1/sale_car/list", params={"size": 60}).json()
    assert published not in [card["sale_car_id"] for card in feed["items"]]
