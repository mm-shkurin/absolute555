"""Attaching a registration scan to a draft, over HTTP only.

Story 6, Tier 1. The reading itself runs on the queue and is not exercised here — what
these hold is the seller-facing half: the scan attaches to a draft rather than creating a
listing, the outcome is a field that survives a reload, and a make the catalogue has
never heard of does not stop the sale.
"""

import pytest

from app.tasks.decode_vin import failed_at
from tests.conftest import make_image
from tests.test_listing_lifecycle import COMPLETE, _create


def _attach(client, headers, listing_id, body=None, mime="image/jpeg"):
    payload = body if body is not None else make_image()
    return client.post(
        f"/api/v1/sale_car/{listing_id}/sts",
        headers=headers,
        files={"file": ("sts.jpg", payload, mime)},
    )


def _listing(client, headers, listing_id):
    response = client.get(f"/api/v1/sale_car/{listing_id}", headers=headers)
    assert response.status_code == 200, response.text
    return response.json()


def test_should_accept_a_scan_onto_a_draft_and_start_reading_it(client, seller):
    listing_id = _create(client, seller)

    response = _attach(client, seller, listing_id)

    assert response.status_code == 202, response.text
    assert response.json()["sale_car_id"] == listing_id
    assert response.json()["autofill"]["state"] == "pending"


def test_should_start_a_fresh_reading_when_a_second_scan_arrives(client, seller):
    listing_id = _create(client, seller)
    _attach(client, seller, listing_id)
    first_link = client.get(f"/api/v1/sale_car/{listing_id}/sts", headers=seller)
    assert first_link.status_code == 200, first_link.text

    response = _attach(client, seller, listing_id, body=make_image(60, 40))

    assert response.status_code == 202, response.text
    assert response.json()["autofill"]["state"] == "pending"
    second_link = client.get(f"/api/v1/sale_car/{listing_id}/sts", headers=seller)
    assert second_link.json()["url"] != first_link.json()["url"]


def test_should_hand_the_reading_a_job_of_its_own(client, seller):
    listing_id = _create(client, seller)

    _attach(client, seller, listing_id)

    assert _listing(client, seller, listing_id)["task_id"]


def test_should_report_the_outcome_on_a_fresh_connection(client, seller):
    listing_id = _create(client, seller)
    _attach(client, seller, listing_id)

    listing = _listing(client, seller, listing_id)

    assert listing["autofill"]["state"] == "pending"
    assert listing["autofill"]["brand_source"] is None
    assert listing["autofill"]["model_source"] is None


def test_should_report_nothing_read_before_a_scan_arrives(client, seller):
    listing = _listing(client, seller, _create(client, seller))

    assert listing["autofill"]["state"] == "none"


def test_should_mark_a_make_the_seller_picked_as_theirs(client, seller, catalogue):
    brand_id, model_id = catalogue
    listing_id = _create(client, seller)

    response = client.patch(
        f"/api/v1/sale_car/{listing_id}",
        headers=seller,
        json={"brand_id": brand_id, "model_id": model_id},
    )

    assert response.status_code == 200, response.text
    autofill = _listing(client, seller, listing_id)["autofill"]
    assert autofill["brand_source"] == "seller"
    assert autofill["model_source"] == "seller"


def test_should_send_a_listing_for_review_without_a_catalogue_make(client, seller, attach_photo):
    listing_id = _create(client, seller)
    filled = client.patch(
        f"/api/v1/sale_car/{listing_id}",
        headers=seller,
        json=dict(COMPLETE, mark_raw="ТАГАЗ", model_raw="TAGER"),
    )
    assert filled.status_code == 200, filled.text
    attach_photo(listing_id, seller, count=3)

    response = client.post(f"/api/v1/sale_car/{listing_id}/submit", headers=seller)

    assert response.status_code == 200, response.text
    listing = _listing(client, seller, listing_id)
    assert listing["status"] == "moderation"
    assert listing["mark_raw"] == "ТАГАЗ"


def test_should_refuse_a_scan_on_a_listing_under_review(
    client, seller, catalogue, attach_photo
):
    brand_id, model_id = catalogue
    listing_id = _create(client, seller)
    client.patch(
        f"/api/v1/sale_car/{listing_id}",
        headers=seller,
        json=dict(COMPLETE, brand_id=brand_id, model_id=model_id),
    )
    attach_photo(listing_id, seller, count=3)
    assert client.post(f"/api/v1/sale_car/{listing_id}/submit", headers=seller).status_code == 200

    response = _attach(client, seller, listing_id)

    assert response.status_code == 409, response.text
    assert response.json()["code"] == "LISTING_FROZEN"


def test_should_hide_someone_elses_listing_from_a_stranger(client, seller, signed_in):
    listing_id = _create(client, seller)
    stranger = signed_in()

    response = _attach(client, stranger, listing_id)

    assert response.status_code == 404, response.text
    assert _listing(client, seller, listing_id)["autofill"]["state"] == "none"


def test_should_refuse_a_scan_from_an_unauthenticated_caller(client, seller):
    listing_id = _create(client, seller)

    response = _attach(client, {}, listing_id)

    assert response.status_code == 401, response.text


def test_should_refuse_a_recognition_outcome_sent_by_a_client(client, seller):
    listing_id = _create(client, seller)
    _attach(client, seller, listing_id)

    for payload in ({"autofill_state": "done"}, {"task_status": "DecodeSuccess"}):
        response = client.patch(
            f"/api/v1/sale_car/{listing_id}", headers=seller, json=payload
        )
        assert response.status_code == 422, response.text

    assert _listing(client, seller, listing_id)["autofill"]["state"] == "pending"


@pytest.mark.parametrize(
    "error,expected",
    [
        ("ocr_failed", "OcrFailed"),
        ("file_bytes is required", "OcrFailed"),
        ("gigachat_connection_error", "DecodeFailed"),
        ("invalid response", "DecodeFailed"),
    ],
)
def test_should_tell_an_unreadable_photograph_from_an_undecodable_one(error, expected):
    assert failed_at(error) == expected
