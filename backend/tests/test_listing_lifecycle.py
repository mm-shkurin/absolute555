"""A listing from an empty draft to a sale, over HTTP only.

Story 4, Tier 1. The subject is the transition matrix: six statuses, four seller
actions and two moderator ones. Sixteen of the twenty-four cells are refusals, and a
refusal is only ever visible in a test — in the code it looks the same whether it was
written or forgotten.

These run against the compose stack: guest login yields a real account and every
assertion goes over the API.
"""

import pytest

COMPLETE = {
    "price": 4020000.0,
    "milleage": 180000.0,
    "phone_number": "+79990000000",
    "year": 2012,
}


def _create(client, headers) -> str:
    response = client.post("/api/v1/sale_car", headers=headers)
    assert response.status_code == 201, response.text
    return response.json()["sale_car_id"]


def _fill(client, headers, listing_id, brand_id, model_id, attach_photo, count=3):
    body = dict(COMPLETE, brand_id=brand_id, model_id=model_id)
    response = client.patch(f"/api/v1/sale_car/{listing_id}", headers=headers, json=body)
    assert response.status_code == 200, response.text
    attach_photo(listing_id, headers, count=count)


def _status(client, headers, listing_id) -> str:
    response = client.get(f"/api/v1/sale_car/{listing_id}", headers=headers)
    assert response.status_code == 200, response.text
    return response.json()["status"]


def _publish(client, seller, moderator, listing_id, brand_id, model_id, attach_photo):
    _fill(client, seller, listing_id, brand_id, model_id, attach_photo)
    assert client.post(f"/api/v1/sale_car/{listing_id}/submit", headers=seller).status_code == 200
    approve = client.post(f"/api/v1/sale_car/{listing_id}/approve", headers=moderator)
    assert approve.status_code == 200, approve.text


def test_should_create_an_empty_draft(client, seller, catalogue):
    listing_id = _create(client, seller)

    listing = client.get(f"/api/v1/sale_car/{listing_id}", headers=seller).json()
    assert listing["status"] == "draft"
    assert listing["price"] is None
    assert listing["phone_number"] is None

    mine = client.get("/api/v1/sale_car/user", headers=seller).json()
    assert listing_id in [car["sale_car_id"] for car in mine]


def test_should_keep_a_draft_between_two_visits(client, seller, catalogue):
    listing_id = _create(client, seller)

    client.patch(f"/api/v1/sale_car/{listing_id}", headers=seller, json={"price": 990000.0})
    client.patch(
        f"/api/v1/sale_car/{listing_id}",
        headers=seller,
        json={"milleage": 120000.0, "phone_number": "+79991112233"},
    )

    listing = client.get(f"/api/v1/sale_car/{listing_id}", headers=seller).json()
    assert listing["price"] == 990000.0
    assert listing["milleage"] == 120000.0
    assert listing["phone_number"] == "+79991112233"
    assert listing["status"] == "draft"


def test_should_send_a_complete_draft_for_review(client, seller, catalogue, attach_photo):
    listing_id = _create(client, seller)
    _fill(client, seller, listing_id, *catalogue, attach_photo)

    response = client.post(f"/api/v1/sale_car/{listing_id}/submit", headers=seller)

    assert response.status_code == 200, response.text
    assert response.json()["status"] == "moderation"


def test_should_name_every_missing_field_when_a_draft_is_incomplete(client, seller, catalogue):
    listing_id = _create(client, seller)
    client.patch(
        f"/api/v1/sale_car/{listing_id}",
        headers=seller,
        json={"price": 990000.0, "milleage": 120000.0},
    )

    response = client.post(f"/api/v1/sale_car/{listing_id}/submit", headers=seller)

    assert response.status_code == 422, response.text
    missing = set(response.json()["details"]["missing_fields"])
    # Make and model are not in here: story 6 took them out of the gate so that a make
    # the catalogue does not know cannot block a sale.
    assert missing == {"phone_number", "year", "photos"}
    assert _status(client, seller, listing_id) == "draft"


def test_should_withdraw_a_published_listing(client, seller, moderator, catalogue, attach_photo):
    listing_id = _create(client, seller)
    _publish(client, seller, moderator, listing_id, *catalogue, attach_photo)

    response = client.post(f"/api/v1/sale_car/{listing_id}/withdraw", headers=seller)

    assert response.status_code == 200, response.text
    assert response.json()["status"] == "withdrawn"


def test_should_mark_a_published_listing_sold(client, seller, moderator, catalogue, attach_photo):
    listing_id = _create(client, seller)
    _publish(client, seller, moderator, listing_id, *catalogue, attach_photo)

    response = client.post(f"/api/v1/sale_car/{listing_id}/sold", headers=seller)

    assert response.status_code == 200, response.text
    assert response.json()["status"] == "sold"


def test_should_return_a_withdrawn_listing_through_review(client, seller, moderator, catalogue, attach_photo):
    listing_id = _create(client, seller)
    _publish(client, seller, moderator, listing_id, *catalogue, attach_photo)
    client.post(f"/api/v1/sale_car/{listing_id}/withdraw", headers=seller)

    response = client.post(f"/api/v1/sale_car/{listing_id}/republish", headers=seller)

    assert response.status_code == 200, response.text
    assert response.json()["status"] == "moderation"

    # The feed answers a page and a count since story 7, not a bare array.
    feed = client.get("/api/v1/sale_car/list").json()
    assert listing_id not in [car["sale_car_id"] for car in feed["items"]]


def test_should_refuse_a_transition_the_current_status_does_not_allow(client, seller, catalogue):
    listing_id = _create(client, seller)

    response = client.post(f"/api/v1/sale_car/{listing_id}/sold", headers=seller)

    assert response.status_code == 409, response.text
    detail = response.json()["details"]
    assert detail["current_status"] == "draft"
    assert detail["allowed"] == ["moderation"]
    assert _status(client, seller, listing_id) == "draft"


def test_should_read_own_listings_one_basket_at_a_time(client, seller, moderator, catalogue, attach_photo):
    draft_id = _create(client, seller)
    published_id = _create(client, seller)
    _publish(client, seller, moderator, published_id, *catalogue, attach_photo)

    published = client.get("/api/v1/sale_car/user?status=published", headers=seller).json()
    ids = [car["sale_car_id"] for car in published]

    assert published_id in ids
    assert draft_id not in ids
