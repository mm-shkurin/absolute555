"""What a rating test needs before it can assert anything: a closed deal.

A review has exactly one way in — an accepted offer — so every test here has to sell a
car first, over the same HTTP the buyer and the seller use.
"""

import uuid

import jwt
import pytest

from tests.conftest import run_sql
from tests.test_listing_lifecycle import COMPLETE, _create


def id_of(headers) -> str:
    return jwt.decode(
        headers["Authorization"].removeprefix("Bearer "), options={"verify_signature": False}
    )["id"]


def verify(headers):
    """Turn a guest login into an ordinary user: a guest neither bargains nor reviews."""
    run_sql("UPDATE users SET is_guest = false WHERE id = :id", {"id": uuid.UUID(id_of(headers))})
    return headers


@pytest.fixture
def publish(client, moderator, catalogue, attach_photo):
    brand_id, model_id = catalogue

    def _publish(owner):
        listing_id = _create(client, owner)
        body = dict(COMPLETE, brand_id=brand_id, model_id=model_id)
        assert client.patch(f"/api/v1/sale_car/{listing_id}", headers=owner, json=body).status_code == 200
        attach_photo(listing_id, owner, count=3)
        client.post(f"/api/v1/sale_car/{listing_id}/submit", headers=owner)
        assert client.post(f"/api/v1/sale_car/{listing_id}/approve", headers=moderator).status_code == 200
        return listing_id

    return _publish


@pytest.fixture
def offered(client, publish):
    """A listing, a buyer and their pending offer on it."""

    def _offer(owner, buyer, price: float = 900000.0):
        listing_id = publish(owner)
        made = client.post(
            "/api/v1/offer/", headers=buyer, json={"sale_car_id": listing_id, "price": price}
        )
        assert made.status_code == 201, made.text
        return listing_id, made.json()["offer_id"]

    return _offer


@pytest.fixture
def closed_deal(client, offered):
    """A sale that happened: the seller accepted, so a review may follow."""

    def _close(owner, buyer, price: float = 900000.0):
        listing_id, offer_id = offered(owner, buyer, price)
        answered = client.patch(
            f"/api/v1/offer/{offer_id}/status", headers=owner, json={"status": "accepted"}
        )
        assert answered.status_code == 200, answered.text
        return listing_id, offer_id

    return _close


def rate(client, headers, offer_id, rating=5, text=None):
    body = {"rating": rating}
    if text is not None:
        body["text"] = text
    return client.post(f"/api/v1/offer/{offer_id}/review", headers=headers, json=body)


def profile(client, seller_id):
    response = client.get(f"/api/v1/seller/{seller_id}")
    assert response.status_code == 200, response.text
    return response.json()


def age_review(review_id: str, hours: int) -> None:
    """Move a review back in time, so the edit window can be tested without waiting."""
    run_sql(
        "UPDATE reviews SET created_at = created_at - make_interval(hours => :hours)"
        " WHERE review_id = :id",
        {"hours": hours, "id": uuid.UUID(review_id)},
    )
