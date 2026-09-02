"""The rating a seller earns, over HTTP.

Story 12. A review follows a closed deal and nothing else: the accepted offer is both the
right to write one and the guarantee that only one is written. Somebody else's offer and
an offer that does not exist get the same answer — a refusal would confirm that a car was
sold to whoever walks identifiers.
"""

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


def test_should_record_a_review_after_an_accepted_offer(client, parties, closed_deal):
    owner, buyer = parties
    _, offer_id = closed_deal(owner, buyer)

    written = rate(client, buyer, offer_id, rating=4, text="Машина как в объявлении")

    assert written.status_code == 201, written.text
    body = written.json()
    assert body["rating"] == 4
    assert body["text"] == "Машина как в объявлении"
    assert body["offer_id"] == offer_id
    assert body["seller_id"] == id_of(owner)


def test_should_refuse_a_review_without_a_deal(client, parties, offered):
    owner, buyer = parties
    _, offer_id = offered(owner, buyer)

    refused = rate(client, buyer, offer_id)

    assert refused.status_code == 409, refused.text
    assert profile(client, id_of(owner))["reviews_count"] == 0


def test_should_hide_somebody_elses_offer(client, parties, closed_deal, signed_in):
    owner, buyer = parties
    _, offer_id = closed_deal(owner, buyer)

    stranger = verify(signed_in())

    assert rate(client, stranger, offer_id).status_code == 404


def test_should_allow_one_review_per_deal(client, parties, closed_deal):
    owner, buyer = parties
    _, offer_id = closed_deal(owner, buyer)
    first = rate(client, buyer, offer_id, rating=5)
    assert first.status_code == 201, first.text

    second = rate(client, buyer, offer_id, rating=1)

    assert second.status_code == 409, second.text
    assert second.json()["details"]["review_id"] == first.json()["review_id"]


def test_should_average_the_ratings_a_seller_was_given(client, seller, signed_in, closed_deal):
    owner = verify(seller)
    for given in (5, 3):
        buyer = verify(signed_in())
        _, offer_id = closed_deal(owner, buyer)
        assert rate(client, buyer, offer_id, rating=given).status_code == 201

    read = profile(client, id_of(owner))

    assert read["rating"] == 4.0
    assert read["reviews_count"] == 2


def test_should_leave_an_unrated_seller_without_a_rating(client, seller):
    owner = verify(seller)

    read = profile(client, id_of(owner))

    assert read["rating"] is None
    assert read["reviews_count"] == 0


def test_should_carry_the_rating_on_the_listing_card(client, parties, closed_deal, publish):
    owner, buyer = parties
    _, offer_id = closed_deal(owner, buyer)
    assert rate(client, buyer, offer_id, rating=5).status_code == 201

    another = publish(owner)
    card = client.get(f"/api/v1/sale_car/{another}")

    assert card.status_code == 200, card.text
    block = card.json()["seller"]
    assert block["rating"] == 5.0
    assert block["reviews_count"] == 1
    assert block["deals_count"] == 1


def test_should_carry_the_rating_in_the_moderation_queue(
    client, parties, closed_deal, moderator, catalogue, attach_photo
):
    from tests.test_listing_lifecycle import COMPLETE, _create

    owner, buyer = parties
    _, offer_id = closed_deal(owner, buyer)
    assert rate(client, buyer, offer_id, rating=5).status_code == 201

    brand_id, model_id = catalogue
    waiting = _create(client, owner)
    client.patch(
        f"/api/v1/sale_car/{waiting}", headers=owner, json=dict(COMPLETE, brand_id=brand_id, model_id=model_id)
    )
    attach_photo(waiting, owner, count=3)
    assert client.post(f"/api/v1/sale_car/{waiting}/submit", headers=owner).status_code == 200

    row = _queue_row(client, moderator, waiting)

    assert row["seller"]["rating"] == 5.0


def _queue_row(client, moderator, listing_id):
    """The row for one listing, wherever the queue's paging put it.

    The suite submits many listings, and this one is the newest: page one of a queue
    ordered by how long a listing has waited is precisely where it is not.
    """
    page = 1
    while page <= 20:
        answer = client.get(
            "/api/v1/moderation/queue", headers=moderator, params={"page": page, "size": 60}
        )
        assert answer.status_code == 200, answer.text
        body = answer.json()
        for row in body["items"]:
            if row["sale_car_id"] == listing_id:
                return row
        if page * 60 >= body["total"]:
            break
        page += 1
    raise AssertionError(f"listing {listing_id} is not in the queue")


def _my_offers(client, headers):
    response = client.get("/api/v1/offer/my", headers=headers)
    assert response.status_code == 200, response.text
    return {one["offer_id"]: one for one in response.json()}


def test_should_say_which_offers_may_be_reviewed(client, parties, closed_deal, offered, signed_in):
    owner, buyer = parties
    _, done = closed_deal(owner, buyer)
    other_seller = verify(signed_in())
    _, waiting = offered(other_seller, buyer)

    mine = _my_offers(client, buyer)

    assert mine[done]["can_review"] is True
    assert mine[waiting]["can_review"] is False


def test_should_name_the_review_already_written(client, parties, closed_deal):
    owner, buyer = parties
    _, offer_id = closed_deal(owner, buyer)
    written = rate(client, buyer, offer_id, rating=4)

    mine = _my_offers(client, buyer)

    assert mine[offer_id]["review_id"] == written.json()["review_id"]
    assert mine[offer_id]["can_review"] is False


def test_should_open_the_profile_to_a_visitor_who_has_not_signed_in(
    client, parties, closed_deal, publish
):
    owner, buyer = parties
    _, offer_id = closed_deal(owner, buyer)
    assert rate(client, buyer, offer_id, rating=5).status_code == 201
    publish(owner)

    read = client.get(f"/api/v1/seller/{id_of(owner)}")

    assert read.status_code == 200, read.text
    body = read.json()
    assert body["rating"] == 5.0
    assert body["deals_count"] == 1
    assert body["listings_count"] == 1
