"""Every failure leaves in one envelope.

A client branches on `code`; `message` is for a human and `details` carries whatever the
particular refusal knows. The point of these tests is that the shape holds for all four
sources of failure -- a custom error, an HTTPException raised by FastAPI's own routing,
a request that fails validation, and a permission dependency.
"""

import pytest

ENVELOPE = {"error", "message", "code", "details"}


def _assert_envelope(response):
    body = response.json()
    assert set(body) == ENVELOPE, body
    assert body["error"] is True
    assert isinstance(body["message"], str) and body["message"]
    assert isinstance(body["code"], str) and body["code"]
    assert isinstance(body["details"], dict)
    return body


def test_should_answer_a_missing_listing_in_the_envelope(client, seller):
    response = client.get(
        "/api/v1/sale_car/00000000-0000-4000-8000-000000000000", headers=seller
    )

    assert response.status_code == 404
    assert _assert_envelope(response)["code"] == "LISTING_NOT_FOUND"


def test_should_answer_an_anonymous_caller_in_the_envelope(client):
    response = client.get("/api/v1/sale_car/user")

    assert response.status_code == 401
    assert _assert_envelope(response)["code"] in ("UNAUTHENTICATED", "CREDENTIALS_INVALID")


def test_should_name_the_permission_a_caller_lacks(client, seller, catalogue, attach_photo):
    from tests.test_listing_lifecycle import _create, _fill

    listing_id = _create(client, seller)
    _fill(client, seller, listing_id, *catalogue, attach_photo)
    client.post(f"/api/v1/sale_car/{listing_id}/submit", headers=seller)

    response = client.post(f"/api/v1/sale_car/{listing_id}/approve", headers=seller)

    assert response.status_code == 403
    body = _assert_envelope(response)
    assert body["code"] == "PERMISSION_DENIED"
    assert body["details"]["required"] == "edit_any_sale_car"


def test_should_report_a_bad_request_body_field_by_field(client, seller):
    from tests.test_listing_lifecycle import _create

    listing_id = _create(client, seller)

    response = client.patch(
        f"/api/v1/sale_car/{listing_id}", headers=seller, json={"price": "not a number"}
    )

    assert response.status_code == 422
    body = _assert_envelope(response)
    assert body["code"] == "VALIDATION_ERROR"
    assert body["details"]["errors"][0]["field"] == "price"


def test_should_carry_a_refusals_own_fields_in_details(client, seller):
    from tests.test_listing_lifecycle import _create

    listing_id = _create(client, seller)

    response = client.post(f"/api/v1/sale_car/{listing_id}/sold", headers=seller)

    assert response.status_code == 409
    body = _assert_envelope(response)
    assert body["code"] == "TRANSITION_NOT_ALLOWED"
    assert body["details"] == {"current_status": "draft", "allowed": ["moderation"]}


def test_should_answer_an_unknown_path_in_the_envelope(client):
    # Raised by the router, not by any handler of ours: the envelope has to survive it.
    response = client.get("/api/v1/no-such-thing")

    assert response.status_code == 404
    assert _assert_envelope(response)["code"] == "NOT_FOUND"
