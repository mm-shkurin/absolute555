"""Who may write a review, and what a public profile is allowed to say.

Story 12, tier 2. The profile is open to a visitor who has not signed in, which makes
what it does *not* carry a rule of its own: the phone number stays behind the reveal on
the card.
"""

import uuid

import pytest

from tests.conftest import run_sql
from tests.seller_rating_fixtures import (  # noqa: F401 -- fixtures used by name
    closed_deal,
    id_of,
    offered,
    profile,
    publish,
    rate,
    verify,
)


@pytest.fixture
def parties(seller, signed_in):
    return verify(seller), verify(signed_in())


@pytest.fixture
def review(client, parties, closed_deal):
    owner, buyer = parties
    _, offer_id = closed_deal(owner, buyer)
    written = rate(client, buyer, offer_id, rating=3, text="Сойдёт")
    assert written.status_code == 201, written.text
    return owner, buyer, written.json()


def test_should_refuse_a_review_from_a_guest(client, signed_in, parties, closed_deal):
    owner, buyer = parties
    _, offer_id = closed_deal(owner, buyer)
    guest = signed_in()

    refused = rate(client, guest, offer_id)

    assert refused.status_code in (403, 404), refused.text


def test_should_refuse_the_writing_routes_without_credentials(client, review):
    _, _, written = review

    created = client.post(f"/api/v1/offer/{written['offer_id']}/review", json={"rating": 5})
    corrected = client.patch(f"/api/v1/review/{written['review_id']}", json={"rating": 5})

    assert created.status_code == 401, created.text
    assert corrected.status_code == 401, corrected.text


def test_should_not_leak_the_phone_number_through_a_profile(client, seller, publish):
    owner = verify(seller)
    publish(owner)

    read = client.get(f"/api/v1/seller/{id_of(owner)}")
    listings = client.get(f"/api/v1/seller/{id_of(owner)}/listings")

    assert "phone_number" not in read.text
    assert "phone_number" not in listings.text


def test_should_ignore_a_seller_named_in_the_body(client, parties, closed_deal, signed_in):
    owner, buyer = parties
    _, offer_id = closed_deal(owner, buyer)
    outsider = verify(signed_in())

    written = client.post(
        f"/api/v1/offer/{offer_id}/review",
        headers=buyer,
        json={"rating": 5, "seller_id": id_of(outsider)},
    )

    assert written.status_code == 201, written.text
    assert written.json()["seller_id"] == id_of(owner)
    assert profile(client, id_of(outsider))["reviews_count"] == 0


def test_should_keep_one_review_per_offer_in_storage(client, review):
    _, buyer, written = review

    with pytest.raises(Exception):
        run_sql(
            "INSERT INTO reviews (review_id, offer_id, seller_id, author_id, rating)"
            " VALUES (:review_id, :offer_id, :seller_id, :author_id, 1)",
            {
                "review_id": uuid.uuid4(),
                "offer_id": uuid.UUID(written["offer_id"]),
                "seller_id": uuid.UUID(written["seller_id"]),
                "author_id": uuid.UUID(id_of(buyer)),
            },
        )
