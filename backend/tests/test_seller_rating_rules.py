"""The rules around a review: the day it may be corrected, and who may read what.

Story 12, tier 2. The edit window is the one rule here with a clock in it: a review is a
correction for a day and settled after that, so a rating cannot be traded away later.
"""

import uuid

import pytest


from tests.seller_rating_fixtures import (  # noqa: F401 -- fixtures used by name
    age_review,
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


def test_should_let_the_author_correct_a_review_within_a_day(client, review):
    owner, buyer, written = review

    corrected = client.patch(
        f"/api/v1/review/{written['review_id']}", headers=buyer, json={"rating": 5}
    )

    assert corrected.status_code == 200, corrected.text
    assert corrected.json()["rating"] == 5
    assert profile(client, id_of(owner))["rating"] == 5.0


def test_should_settle_a_review_after_a_day(client, review):
    _, buyer, written = review
    age_review(written["review_id"], hours=48)

    late = client.patch(f"/api/v1/review/{written['review_id']}", headers=buyer, json={"rating": 1})

    assert late.status_code == 409, late.text
    read = client.get(f"/api/v1/seller/{written['seller_id']}/reviews").json()
    assert read["items"][0]["rating"] == 3


def test_should_let_only_the_author_correct_a_review(client, review, signed_in):
    _, _, written = review
    stranger = verify(signed_in())

    refused = client.patch(
        f"/api/v1/review/{written['review_id']}", headers=stranger, json={"rating": 1}
    )

    assert refused.status_code == 404, refused.text


@pytest.mark.parametrize("body", [{"rating": 0}, {"rating": 6}, {"text": "без оценки"}])
def test_should_refuse_a_rating_outside_one_to_five(client, parties, closed_deal, body):
    owner, buyer = parties
    _, offer_id = closed_deal(owner, buyer)

    refused = client.post(f"/api/v1/offer/{offer_id}/review", headers=buyer, json=body)

    assert refused.status_code == 422, refused.text
    assert profile(client, id_of(owner))["reviews_count"] == 0


def test_should_accept_a_rating_without_words(client, parties, closed_deal):
    owner, buyer = parties
    _, offer_id = closed_deal(owner, buyer)

    written = rate(client, buyer, offer_id, rating=5)

    assert written.status_code == 201, written.text
    assert written.json()["text"] is None


def test_should_count_deals_rather_than_reviews(client, seller, signed_in, closed_deal):
    owner = verify(seller)
    for index in range(3):
        buyer = verify(signed_in())
        _, offer_id = closed_deal(owner, buyer)
        if index == 0:
            assert rate(client, buyer, offer_id, rating=5).status_code == 201

    read = profile(client, id_of(owner))

    assert read["deals_count"] == 3
    assert read["reviews_count"] == 1


def test_should_list_the_newest_review_first(client, seller, signed_in, closed_deal):
    owner = verify(seller)
    written = []
    for given in (2, 4):
        buyer = verify(signed_in())
        _, offer_id = closed_deal(owner, buyer)
        response = rate(client, buyer, offer_id, rating=given, text=f"оценка {given}")
        assert response.status_code == 201, response.text
        written.append(response.json())
    age_review(written[0]["review_id"], hours=5)

    read = client.get(f"/api/v1/seller/{id_of(owner)}/reviews")

    assert read.status_code == 200, read.text
    items = read.json()["items"]
    assert items[0]["review_id"] == written[1]["review_id"]
    assert items[0]["author"]["user_id"] is not None


def test_should_show_only_published_listings_on_a_profile(client, seller, publish):
    owner = verify(seller)
    from tests.test_listing_lifecycle import _create

    published = publish(owner)
    draft = _create(client, owner)

    read = client.get(f"/api/v1/seller/{id_of(owner)}/listings")

    assert read.status_code == 200, read.text
    shown = [one["sale_car_id"] for one in read.json()["items"]]
    assert shown == [published]
    assert draft not in shown


def test_should_report_a_profile_of_nobody_as_not_found(client):
    read = client.get(f"/api/v1/seller/{uuid.uuid4()}")

    assert read.status_code == 404, read.text
