"""Complaints about a published listing, and what a moderator does with them.

Story 9. Nothing here is automatic: a count of complaints is a reason for a person to
look, never a decision. A threshold that hid a listing by itself would be a threshold
competitors learn to reach.
"""

import uuid

import pytest

from tests.test_listing_lifecycle import COMPLETE, _create

BAIT = {"reason": "bait_price", "text": "the price in the chat is half a million higher"}
TAKE_DOWN = {"label": "bait_price", "comment": "the price is not the price"}


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


def _complain(client, headers, listing_id, body=None):
    return client.post(
        f"/api/v1/sale_car/{listing_id}/complaints", headers=headers, json=body or BAIT
    )


def _open_complaints(client, moderator, listing_id):
    page = client.get("/api/v1/moderation/complaints", headers=moderator, params={"size": 60})
    assert page.status_code == 200, page.text
    for group in page.json()["items"]:
        if group["sale_car_id"] == listing_id:
            return group["complaints"]
    return []


def test_should_record_a_complaint_against_a_published_listing(client, signed_in, published):
    listing_id = published()

    response = _complain(client, signed_in(), listing_id)

    assert response.status_code == 201, response.text
    assert response.json()["status"] == "open"
    assert response.json()["reason"] == "bait_price"


def test_should_take_one_complaint_per_person_per_listing(client, signed_in, moderator, published):
    listing_id = published()
    reader = signed_in()
    assert _complain(client, reader, listing_id).status_code == 201

    again = _complain(client, reader, listing_id)

    assert again.status_code == 409, again.text
    assert again.json()["code"] == "ALREADY_COMPLAINED"
    assert len(_open_complaints(client, moderator, listing_id)) == 1


def test_should_refuse_a_seller_complaining_about_their_own_listing(client, seller, published):
    response = _complain(client, seller, published())

    assert response.status_code == 409, response.text
    assert response.json()["code"] == "COMPLAINT_ON_OWN_LISTING"


def test_should_refuse_a_complaint_about_a_listing_nobody_can_see(client, seller, signed_in):
    draft = _create(client, seller)

    response = _complain(client, signed_in(), draft)

    assert response.status_code == 404, response.text


def test_should_refuse_a_complaint_from_a_reader_who_has_not_signed_in(client, published):
    assert _complain(client, {}, published()).status_code == 401


def test_should_gather_complaints_under_the_listing_they_are_about(
    client, signed_in, moderator, published
):
    listing_id = published()
    _complain(client, signed_in(), listing_id)
    _complain(client, signed_in(), listing_id, {"reason": "photos_of_another_car", "text": "wheels differ"})

    complaints = _open_complaints(client, moderator, listing_id)

    assert len(complaints) == 2
    assert {complaint["reason"] for complaint in complaints} == {"bait_price", "photos_of_another_car"}
    assert all(complaint["author"]["user_id"] for complaint in complaints)


def test_should_settle_every_complaint_when_a_listing_is_taken_down(
    client, seller, signed_in, moderator, published
):
    listing_id = published()
    _complain(client, signed_in(), listing_id)
    _complain(client, signed_in(), listing_id)

    response = client.post(
        f"/api/v1/moderation/listings/{listing_id}/unpublish", headers=moderator, json=TAKE_DOWN
    )

    assert response.status_code == 200, response.text
    listing = client.get(f"/api/v1/sale_car/{listing_id}", headers=seller).json()
    assert listing["status"] == "rejected"
    assert listing["reject_label"] == "bait_price"
    assert _open_complaints(client, moderator, listing_id) == []
    feed = client.get("/api/v1/sale_car/list", params={"size": 60}).json()
    assert listing_id not in [card["sale_car_id"] for card in feed["items"]]


def test_should_close_a_complaint_the_moderator_disagrees_with(
    client, signed_in, moderator, published
):
    listing_id = published()
    complaint_id = _complain(client, signed_in(), listing_id).json()["complaint_id"]

    dismissed = client.post(
        f"/api/v1/moderation/complaints/{complaint_id}/dismiss", headers=moderator
    )

    assert dismissed.status_code == 200, dismissed.text
    assert dismissed.json()["status"] == "handled"
    assert _open_complaints(client, moderator, listing_id) == []
    assert client.get(f"/api/v1/sale_car/{listing_id}").json()["status"] == "published"


def test_should_settle_a_complaint_once(client, signed_in, moderator, published):
    complaint_id = _complain(client, signed_in(), published()).json()["complaint_id"]
    client.post(f"/api/v1/moderation/complaints/{complaint_id}/dismiss", headers=moderator)

    again = client.post(f"/api/v1/moderation/complaints/{complaint_id}/dismiss", headers=moderator)

    assert again.status_code == 409, again.text
    assert again.json()["code"] == "COMPLAINT_ALREADY_HANDLED"


def test_should_take_nothing_down_by_the_number_of_complaints_alone(
    client, signed_in, moderator, published
):
    listing_id = published()
    for _ in range(5):
        assert _complain(client, signed_in(), listing_id).status_code == 201

    assert client.get(f"/api/v1/sale_car/{listing_id}").json()["status"] == "published"
    feed = client.get("/api/v1/sale_car/list", params={"size": 60}).json()
    assert listing_id in [card["sale_car_id"] for card in feed["items"]]


def test_should_refuse_to_take_down_a_listing_that_is_not_published(client, moderator, seller, catalogue, attach_photo):
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
        f"/api/v1/moderation/listings/{listing_id}/unpublish", headers=moderator, json=TAKE_DOWN
    )

    assert response.status_code == 409, response.text


def test_should_show_a_complained_listing_in_its_own_tab(client, signed_in, moderator, published):
    complained = published()
    quiet = published()
    _complain(client, signed_in(), complained)

    page = client.get(
        "/api/v1/moderation/queue", headers=moderator, params={"tab": "complained", "size": 60}
    ).json()

    rows = {row["sale_car_id"]: row for row in page["items"]}
    assert complained in rows
    assert quiet not in rows
    assert rows[complained]["open_complaints"] == 1


def test_should_report_a_complaint_that_does_not_exist(client, moderator):
    response = client.post(
        f"/api/v1/moderation/complaints/{uuid.uuid4()}/dismiss", headers=moderator
    )

    assert response.status_code == 404, response.text
