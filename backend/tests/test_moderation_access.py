"""Who may read the queue and act on it.

Story 9. A queue an ordinary user can read is a list of what has not been checked yet,
which is exactly what somebody gaming the review wants to know — and every action on it
changes what buyers see.
"""

import uuid

import pytest

from tests.test_listing_lifecycle import COMPLETE, _create

READ_ROUTES = ["/api/v1/moderation/queue", "/api/v1/moderation/counts", "/api/v1/moderation/complaints"]


@pytest.fixture
def published_with_complaint(client, seller, moderator, signed_in, catalogue, attach_photo):
    brand_id, model_id = catalogue
    listing_id = _create(client, seller)
    client.patch(
        f"/api/v1/sale_car/{listing_id}",
        headers=seller,
        json=dict(COMPLETE, brand_id=brand_id, model_id=model_id),
    )
    attach_photo(listing_id, seller, count=3)
    client.post(f"/api/v1/sale_car/{listing_id}/submit", headers=seller)
    client.post(f"/api/v1/sale_car/{listing_id}/approve", headers=moderator)

    complaint = client.post(
        f"/api/v1/sale_car/{listing_id}/complaints",
        headers=signed_in(),
        json={"reason": "bait_price"},
    )
    assert complaint.status_code == 201, complaint.text
    return listing_id, complaint.json()["complaint_id"]


@pytest.mark.parametrize("path", READ_ROUTES)
def test_should_refuse_the_queue_to_an_ordinary_user(client, seller, path):
    response = client.get(path, headers=seller)

    assert response.status_code == 403, response.text
    assert response.json()["code"] == "PERMISSION_DENIED"


@pytest.mark.parametrize("path", READ_ROUTES)
def test_should_refuse_the_queue_to_a_reader_who_has_not_signed_in(client, path):
    assert client.get(path).status_code == 401


def test_should_refuse_moderator_actions_to_an_ordinary_user(
    client, seller, signed_in, moderator, published_with_complaint
):
    listing_id, complaint_id = published_with_complaint
    stranger = signed_in()

    taken_down = client.post(
        f"/api/v1/moderation/listings/{listing_id}/unpublish",
        headers=stranger,
        json={"label": "bait_price"},
    )
    dismissed = client.post(
        f"/api/v1/moderation/complaints/{complaint_id}/dismiss", headers=stranger
    )

    assert taken_down.status_code == 403, taken_down.text
    assert dismissed.status_code == 403, dismissed.text
    assert client.get(f"/api/v1/sale_car/{listing_id}").json()["status"] == "published"


def test_should_refuse_rejection_to_an_ordinary_user(client, seller, signed_in, catalogue, attach_photo):
    brand_id, model_id = catalogue
    listing_id = _create(client, seller)
    client.patch(
        f"/api/v1/sale_car/{listing_id}",
        headers=seller,
        json=dict(COMPLETE, brand_id=brand_id, model_id=model_id),
    )
    attach_photo(listing_id, seller, count=3)
    client.post(f"/api/v1/sale_car/{listing_id}/submit", headers=seller)

    response = client.post(
        f"/api/v1/sale_car/{listing_id}/reject",
        headers=signed_in(),
        json={"label": "bait_price"},
    )

    assert response.status_code == 403, response.text


def test_should_not_tell_the_seller_who_complained(client, seller, published_with_complaint):
    listing_id, _ = published_with_complaint

    listing = client.get(f"/api/v1/sale_car/{listing_id}", headers=seller).json()

    assert "complaints" not in listing
    assert "complained" not in str(listing)
