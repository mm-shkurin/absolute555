"""Кто решил по объявлению, по HTTP.

История 22, Tier 1. Колонки решения писались с истории 9 и наружу не отдавались; здесь
— то, кому и в каком объёме они видны. Правило одно и оно про людей: момент решения
видит владелец, имя решившего — только модератор.
"""

from tests.test_listing_lifecycle import COMPLETE, _create


def _listing(client, headers, listing_id):
    response = client.get(f"/api/v1/sale_car/{listing_id}", headers=headers)
    assert response.status_code == 200, response.text
    return response.json()


def _published(client, seller, catalogue, attach_photo, moderator):
    """Объявление, по которому модератор уже принял решение."""
    brand_id, model_id = catalogue
    listing_id = _create(client, seller)
    filled = client.patch(
        f"/api/v1/sale_car/{listing_id}",
        headers=seller,
        json=dict(COMPLETE, brand_id=brand_id, model_id=model_id),
    )
    assert filled.status_code == 200, filled.text
    attach_photo(listing_id, seller, count=3)
    assert client.post(f"/api/v1/sale_car/{listing_id}/submit", headers=seller).status_code == 200
    approved = client.post(f"/api/v1/sale_car/{listing_id}/approve", headers=moderator)
    assert approved.status_code == 200, approved.text
    return listing_id


def test_should_tell_the_seller_when_it_was_decided_and_not_by_whom(
    client, seller, catalogue, attach_photo, moderator
):
    listing_id = _published(client, seller, catalogue, attach_photo, moderator)

    moderation = _listing(client, seller, listing_id)["moderation"]

    assert moderation["decided_at"], "владельцу не показали, когда решили"
    assert moderation["decided_by"] is None


def test_should_name_the_moderator_who_decided_to_another_moderator(
    client, seller, catalogue, attach_photo, moderator
):
    listing_id = _published(client, seller, catalogue, attach_photo, moderator)

    moderation = _listing(client, moderator, listing_id)["moderation"]

    assert moderation["decided_at"]
    assert moderation["decided_by"]["user_id"]
    assert "name" in moderation["decided_by"]


def test_should_answer_an_empty_block_for_a_listing_nobody_decided(client, seller):
    listing_id = _create(client, seller)

    moderation = _listing(client, seller, listing_id)["moderation"]

    assert moderation == {"decided_at": None, "decided_by": None}


def test_should_keep_a_rejection_reason_next_to_the_decision(
    client, seller, catalogue, attach_photo, moderator
):
    brand_id, model_id = catalogue
    listing_id = _create(client, seller)
    client.patch(
        f"/api/v1/sale_car/{listing_id}",
        headers=seller,
        json=dict(COMPLETE, brand_id=brand_id, model_id=model_id),
    )
    attach_photo(listing_id, seller, count=3)
    client.post(f"/api/v1/sale_car/{listing_id}/submit", headers=seller)

    rejected = client.post(
        f"/api/v1/sale_car/{listing_id}/reject",
        headers=moderator,
        json={"label": "too_few_photos", "comment": "переснимите салон"},
    )
    assert rejected.status_code == 200, rejected.text

    listing = _listing(client, seller, listing_id)
    assert listing["moderation"]["decided_at"]
    assert listing["moderation"]["decided_by"] is None
    assert listing["reject_label"] == "too_few_photos"


def test_should_say_nothing_about_moderation_in_the_public_feed(
    client, seller, catalogue, attach_photo, moderator
):
    """Покупателю знак проверки — сам факт публикации, а не имя решившего."""
    _published(client, seller, catalogue, attach_photo, moderator)

    feed = client.get("/api/v1/sale_car/list")

    assert feed.status_code == 200, feed.text
    for card in feed.json()["items"]:
        assert "moderation" not in card
