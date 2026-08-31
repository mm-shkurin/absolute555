"""The moderation queue, over HTTP only.

Story 9. Order is the whole of what makes a queue a queue: by any other one, the listing
sent in the morning waits longer than the one sent at night. And a rejection carries a
label from a fixed five, because the free text tells one seller what to fix while only
the label can say what is turned back most often.
"""

import pytest

from tests.test_listing_lifecycle import COMPLETE, _create

PLATE = {"label": "plate_or_face_visible", "comment": "the plate is readable"}


@pytest.fixture
def waiting(client, seller, catalogue, attach_photo):
    """A listing filled in and sent for review."""
    brand_id, model_id = catalogue

    def _send():
        listing_id = _create(client, seller)
        body = dict(COMPLETE, brand_id=brand_id, model_id=model_id)
        assert client.patch(f"/api/v1/sale_car/{listing_id}", headers=seller, json=body).status_code == 200
        attach_photo(listing_id, seller, count=3)
        assert client.post(f"/api/v1/sale_car/{listing_id}/submit", headers=seller).status_code == 200
        return listing_id

    return _send


def _queue(client, moderator, **params):
    response = client.get("/api/v1/moderation/queue", headers=moderator, params=params)
    assert response.status_code == 200, response.text
    return response.json()


def _ids(page):
    return [row["sale_car_id"] for row in page["items"]]


def test_should_hold_what_is_waiting_oldest_first(client, moderator, waiting):
    first, second, third = waiting(), waiting(), waiting()

    page = _queue(client, moderator, size=60)

    ids = _ids(page)
    assert {first, second, third} <= set(ids)
    assert ids.index(first) < ids.index(second) < ids.index(third)
    assert page["total"] >= 3


def test_should_hold_nothing_that_is_not_waiting(client, seller, moderator, waiting):
    draft = _create(client, seller)
    published = waiting()
    assert client.post(f"/api/v1/sale_car/{published}/approve", headers=moderator).status_code == 200

    ids = _ids(_queue(client, moderator, size=60))

    assert draft not in ids
    assert published not in ids


def test_should_carry_a_label_the_seller_can_act_on(client, seller, moderator, waiting):
    listing_id = waiting()

    turned_back = client.post(
        f"/api/v1/sale_car/{listing_id}/reject",
        headers=moderator,
        json={"label": "photos_of_another_car", "comment": "three different sets of wheels"},
    )

    assert turned_back.status_code == 200, turned_back.text
    listing = client.get(f"/api/v1/sale_car/{listing_id}", headers=seller).json()
    assert listing["status"] == "rejected"
    assert listing["reject_label"] == "photos_of_another_car"
    assert "wheels" in listing["reject_reason"]


def test_should_refuse_a_rejection_with_no_label(client, seller, moderator, waiting):
    listing_id = waiting()

    response = client.post(
        f"/api/v1/sale_car/{listing_id}/reject",
        headers=moderator,
        json={"comment": "something is wrong with it"},
    )

    assert response.status_code == 422, response.text
    assert client.get(f"/api/v1/sale_car/{listing_id}", headers=seller).json()["status"] == "moderation"


def test_should_refuse_a_label_the_moderator_invented(client, seller, moderator, waiting):
    listing_id = waiting()

    response = client.post(
        f"/api/v1/sale_car/{listing_id}/reject",
        headers=moderator,
        json={"label": "i_do_not_like_it"},
    )

    assert response.status_code == 422, response.text
    assert client.get(f"/api/v1/sale_car/{listing_id}", headers=seller).json()["status"] == "moderation"


def test_should_take_a_corrected_listing_back_into_the_queue(client, seller, moderator, waiting):
    listing_id = waiting()
    client.post(f"/api/v1/sale_car/{listing_id}/reject", headers=moderator, json=PLATE)

    assert client.post(f"/api/v1/sale_car/{listing_id}/revise", headers=seller).status_code == 200
    again = client.post(f"/api/v1/sale_car/{listing_id}/submit", headers=seller)

    assert again.status_code == 200, again.text
    assert listing_id in _ids(_queue(client, moderator, size=60))
    listing = client.get(f"/api/v1/sale_car/{listing_id}", headers=seller).json()
    assert listing["reject_reason"] is None


def test_should_count_what_the_tabs_say_they_count(client, moderator, waiting):
    before = client.get("/api/v1/moderation/counts", headers=moderator).json()
    listing_id = waiting()

    after_sending = client.get("/api/v1/moderation/counts", headers=moderator).json()
    assert after_sending["waiting"] == before["waiting"] + 1

    client.post(f"/api/v1/sale_car/{listing_id}/reject", headers=moderator, json=PLATE)

    after_deciding = client.get("/api/v1/moderation/counts", headers=moderator).json()
    assert after_deciding["waiting"] == before["waiting"]
    assert after_deciding["handled_today"] == before["handled_today"] + 1


def test_should_hold_a_decision_in_the_tab_of_the_moderator_who_made_it(
    client, moderator, signed_in, waiting
):
    listing_id = waiting()
    client.post(f"/api/v1/sale_car/{listing_id}/reject", headers=moderator, json=PLATE)

    mine = _queue(client, moderator, tab="handled_today", size=60)

    assert listing_id in _ids(mine)
