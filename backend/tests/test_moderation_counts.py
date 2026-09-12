"""Счётчики вкладок модератора и снятие с публикации.

Счётчик — не украшение: по нему модератор решает, за какую вкладку сесть. Число, которое
не меняется от поданного объявления, врёт молча, и увидеть это можно только замером до и
после.
"""

from tests.test_listing_lifecycle import COMPLETE, _create

TABS = ("waiting", "complained", "handled_today")


def _counts(client, moderator) -> dict:
    response = client.get("/api/v1/moderation/counts", headers=moderator)
    assert response.status_code == 200, response.text
    return response.json()


def _submitted(client, seller, catalogue, attach_photo) -> str:
    brand_id, model_id = catalogue
    listing_id = _create(client, seller)
    body = dict(COMPLETE, brand_id=brand_id, model_id=model_id)
    assert client.patch(f"/api/v1/sale_car/{listing_id}", headers=seller, json=body).status_code == 200
    attach_photo(listing_id, seller, count=3)
    assert client.post(f"/api/v1/sale_car/{listing_id}/submit", headers=seller).status_code == 200
    return listing_id


def test_should_answer_with_a_number_per_tab(client, moderator):
    counts = _counts(client, moderator)

    assert set(counts) == set(TABS)
    assert all(counts[tab] >= 0 for tab in TABS)


def test_should_grow_the_waiting_tab_by_the_listing_just_sent(
    client, seller, moderator, catalogue, attach_photo
):
    before = _counts(client, moderator)["waiting"]

    _submitted(client, seller, catalogue, attach_photo)

    assert _counts(client, moderator)["waiting"] == before + 1


def test_should_move_a_decided_listing_out_of_waiting(
    client, seller, moderator, catalogue, attach_photo
):
    listing_id = _submitted(client, seller, catalogue, attach_photo)
    waiting = _counts(client, moderator)["waiting"]

    assert client.post(f"/api/v1/sale_car/{listing_id}/approve", headers=moderator).status_code == 200

    after = _counts(client, moderator)
    assert after["waiting"] == waiting - 1
    assert after["handled_today"] >= 1


def test_should_show_a_decided_listing_on_the_today_tab(
    client, seller, moderator, catalogue, attach_photo
):
    listing_id = _submitted(client, seller, catalogue, attach_photo)
    client.post(f"/api/v1/sale_car/{listing_id}/approve", headers=moderator)

    queue = client.get(
        "/api/v1/moderation/queue", headers=moderator, params={"tab": "handled_today", "size": 60}
    )

    assert queue.status_code == 200, queue.text
    assert listing_id in [item["sale_car_id"] for item in queue.json()["items"]]


def test_should_refuse_a_tab_and_a_page_size_it_does_not_serve(client, moderator):
    unknown = client.get("/api/v1/moderation/queue", headers=moderator, params={"tab": "whatever"})
    oversized = client.get("/api/v1/moderation/queue", headers=moderator, params={"size": 61})

    assert unknown.status_code == 422, unknown.text
    assert oversized.status_code == 422, oversized.text


def test_should_refuse_the_counts_to_an_ordinary_user(client, seller):
    refused = client.get("/api/v1/moderation/counts", headers=seller)

    assert refused.status_code == 403, refused.text


def test_should_take_a_published_listing_down_with_a_reason(
    client, seller, moderator, catalogue, attach_photo
):
    listing_id = _submitted(client, seller, catalogue, attach_photo)
    assert client.post(f"/api/v1/sale_car/{listing_id}/approve", headers=moderator).status_code == 200

    taken = client.post(
        f"/api/v1/moderation/listings/{listing_id}/unpublish",
        headers=moderator,
        json={"label": "bait_price", "comment": "Цена не соответствует рынку"},
    )

    assert taken.status_code == 200, taken.text
    assert taken.json()["status"] != "active"


def test_should_refuse_to_take_a_listing_down_without_a_label(
    client, seller, moderator, catalogue, attach_photo
):
    listing_id = _submitted(client, seller, catalogue, attach_photo)
    client.post(f"/api/v1/sale_car/{listing_id}/approve", headers=moderator)

    taken = client.post(
        f"/api/v1/moderation/listings/{listing_id}/unpublish",
        headers=moderator,
        json={"comment": "просто так"},
    )

    assert taken.status_code == 422, taken.text
