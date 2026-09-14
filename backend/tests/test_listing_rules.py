"""The rules that guard the lifecycle rather than describe it.

Story 4, Tier 2: the draft limit, the frozen listing under review, the correction of a
rejected listing, the mistaken sale, and two hazards -- a price that must survive a round
trip and a submit sent twice. Racing actions are in test_listing_race.py.
"""

from app.features.listing.models.sale_car import MAX_DRAFTS_PER_USER
from tests.test_listing_lifecycle import _create, _fill, _publish, _status


def test_should_refuse_more_drafts_than_the_limit(client, seller):
    for _ in range(MAX_DRAFTS_PER_USER):
        _create(client, seller)

    response = client.post("/api/v1/sale_car", headers=seller)

    assert response.status_code == 409, response.text
    assert response.json()["details"]["limit"] == MAX_DRAFTS_PER_USER


def test_should_refuse_a_status_sent_as_an_ordinary_field(client, seller):
    listing_id = _create(client, seller)

    response = client.patch(
        f"/api/v1/sale_car/{listing_id}", headers=seller, json={"status": "published"}
    )

    assert response.status_code == 422, response.text
    assert _status(client, seller, listing_id) == "draft"


def test_should_freeze_a_listing_under_review(client, seller, catalogue, attach_photo):
    listing_id = _create(client, seller)
    _fill(client, seller, listing_id, *catalogue, attach_photo)
    client.post(f"/api/v1/sale_car/{listing_id}/submit", headers=seller)

    response = client.patch(
        f"/api/v1/sale_car/{listing_id}", headers=seller, json={"price": 1.0}
    )

    assert response.status_code == 409, response.text
    assert response.json()["details"]["current_status"] == "moderation"
    listing = client.get(f"/api/v1/sale_car/{listing_id}", headers=seller).json()
    assert listing["price"] == 4020000.0


def test_should_correct_a_rejected_listing_and_send_it_again(
    client, seller, moderator, catalogue, attach_photo
):
    listing_id = _create(client, seller)
    _fill(client, seller, listing_id, *catalogue, attach_photo)
    client.post(f"/api/v1/sale_car/{listing_id}/submit", headers=seller)
    client.post(
        f"/api/v1/sale_car/{listing_id}/reject",
        headers=moderator,
        json={"label": "plate_or_face_visible", "comment": "a licence plate is readable on three of the photos"},
    )

    rejected = client.get(f"/api/v1/sale_car/{listing_id}", headers=seller).json()
    assert rejected["status"] == "rejected"
    assert "licence plate" in rejected["reject_reason"]

    revised = client.post(f"/api/v1/sale_car/{listing_id}/revise", headers=seller)
    assert revised.status_code == 200, revised.text
    assert client.get(f"/api/v1/sale_car/{listing_id}", headers=seller).json()["reject_reason"] is None

    again = client.post(f"/api/v1/sale_car/{listing_id}/submit", headers=seller)
    assert again.json()["status"] == "moderation"


def test_should_refuse_a_rejection_with_no_label(
    client, seller, moderator, catalogue, attach_photo
):
    listing_id = _create(client, seller)
    _fill(client, seller, listing_id, *catalogue, attach_photo)
    client.post(f"/api/v1/sale_car/{listing_id}/submit", headers=seller)

    response = client.post(
        f"/api/v1/sale_car/{listing_id}/reject", headers=moderator, json={"comment": "   "}
    )

    assert response.status_code == 422, response.text
    assert _status(client, seller, listing_id) == "moderation"


def test_should_withdraw_a_listing_marked_sold_by_mistake(
    client, seller, moderator, catalogue, attach_photo
):
    listing_id = _create(client, seller)
    _publish(client, seller, moderator, listing_id, *catalogue, attach_photo)
    client.post(f"/api/v1/sale_car/{listing_id}/sold", headers=seller)

    response = client.post(f"/api/v1/sale_car/{listing_id}/withdraw", headers=seller)

    assert response.status_code == 200, response.text
    assert response.json()["status"] == "withdrawn"
    # The feed answers a page and a count since story 7, not a bare array.
    feed = client.get("/api/v1/sale_car/list").json()
    assert listing_id not in [car["sale_car_id"] for car in feed["items"]]


def test_should_return_a_price_exactly_as_it_was_saved(client, seller):
    listing_id = _create(client, seller)

    client.patch(f"/api/v1/sale_car/{listing_id}", headers=seller, json={"price": 4020000.5})

    listing = client.get(f"/api/v1/sale_car/{listing_id}", headers=seller).json()
    assert listing["price"] == 4020000.5


def test_should_enter_review_once_when_a_draft_is_sent_twice(
    client, seller, catalogue, attach_photo
):
    listing_id = _create(client, seller)
    _fill(client, seller, listing_id, *catalogue, attach_photo)

    first = client.post(f"/api/v1/sale_car/{listing_id}/submit", headers=seller)
    second = client.post(f"/api/v1/sale_car/{listing_id}/submit", headers=seller)

    assert first.json()["status"] == "moderation"
    assert second.status_code == 409, second.text
    assert second.json()["details"]["current_status"] == "moderation"
    assert _status(client, seller, listing_id) == "moderation"


def test_should_record_when_a_listing_was_published(
    client, seller, moderator, catalogue, attach_photo
):
    listing_id = _create(client, seller)
    _publish(client, seller, moderator, listing_id, *catalogue, attach_photo)

    listing = client.get(f"/api/v1/sale_car/{listing_id}").json()

    assert listing["status"] == "published"
    assert listing["published_at"] is not None


class TestVisibilitySettings:
    """Что продавец открывает покупателю.

    Правка 19 от 2026-09-06: блок «Настройки объявления» был нарисованным макетом —
    переключатели ничего не переключали, потому что колонок под них не существовало.
    """

    def test_should_open_a_new_listing_with_phone_and_chat_on(self, client, seller):
        listing_id = _create(client, seller)

        listing = client.get(f"/api/v1/sale_car/{listing_id}", headers=seller).json()

        assert listing["phone_visible"] is True
        assert listing["chat_allowed"] is True
        # Торг закрыт: до этой настройки чужие предложения видел только владелец, и
        # открытая по умолчанию она показала бы их задним числом.
        assert listing["offers_visible"] is False

    def test_should_keep_what_the_seller_decided(self, client, seller):
        listing_id = _create(client, seller)

        saved = client.patch(
            f"/api/v1/sale_car/{listing_id}",
            headers=seller,
            json={"chat_allowed": False, "offers_visible": True},
        )

        assert saved.status_code == 200, saved.text
        assert saved.json()["chat_allowed"] is False
        assert saved.json()["offers_visible"] is True
        assert saved.json()["phone_visible"] is True

    def test_should_close_the_chat_on_a_listing_under_review(
        self, client, seller, catalogue, attach_photo
    ):
        """Заморозка держит текст, а не видимость: продавец опубликованного объявления
        должен уметь закрыть телефон или переписку, не снимая его с публикации."""
        listing_id = _create(client, seller)
        _fill(client, seller, listing_id, *catalogue, attach_photo)
        client.post(f"/api/v1/sale_car/{listing_id}/submit", headers=seller)

        saved = client.patch(
            f"/api/v1/sale_car/{listing_id}", headers=seller, json={"chat_allowed": False}
        )

        assert saved.status_code == 200, saved.text
        assert saved.json()["chat_allowed"] is False
        frozen = client.patch(
            f"/api/v1/sale_car/{listing_id}", headers=seller, json={"price": 1.0}
        )
        assert frozen.status_code == 409, frozen.text
