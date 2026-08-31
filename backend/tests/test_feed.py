"""The feed, over HTTP only.

Story 7. The feed is the one read path this project has at volume, and everything that
makes it usable — the count on the button, the filters narrowing together, an order that
does not shuffle between pages — is invisible in the query that implements it.

Listings are published through the real path (fill, submit, approve), so every one of
these is also a check that publication puts a car in front of buyers.
"""

import uuid

import pytest

from tests.test_listing_lifecycle import COMPLETE, _create, _publish


@pytest.fixture
def publish(client, seller, moderator, catalogue, attach_photo):
    """Publish a listing and hand back its identifier."""
    brand_id, model_id = catalogue

    def _publish_one(**fields):
        listing_id = _create(client, seller)
        body = dict(COMPLETE, brand_id=brand_id, model_id=model_id, **fields)
        assert client.patch(
            f"/api/v1/sale_car/{listing_id}", headers=seller, json=body
        ).status_code == 200
        attach_photo(listing_id, seller, count=3)
        assert client.post(f"/api/v1/sale_car/{listing_id}/submit", headers=seller).status_code == 200
        assert client.post(
            f"/api/v1/sale_car/{listing_id}/approve", headers=moderator
        ).status_code == 200
        return listing_id

    return _publish_one


def _feed(client, **params):
    response = client.get("/api/v1/sale_car/list", params=params)
    assert response.status_code == 200, response.text
    return response.json()


def _ids(page):
    return [card["sale_car_id"] for card in page["items"]]


def test_should_answer_with_a_page_and_a_count(client, publish):
    listing_id = publish()

    page = _feed(client, size=5)

    assert listing_id in _ids(page)
    assert page["total"] >= 1
    assert page["page"] == 1 and page["size"] == 5
    assert len(page["items"]) <= 5


def test_should_carry_only_what_the_card_shows(client, publish):
    listing_id = publish(description="a long description nobody reads in a list")

    card = next(card for card in _feed(client)["items"] if card["sale_car_id"] == listing_id)

    assert card["brand"] and card["model"] and card["price"]
    assert card["preview_photo_url"]
    assert "description" not in card
    assert "phone_number" not in card


def test_should_show_only_published_listings(client, seller, publish):
    published = publish()
    draft = _create(client, seller)

    ids = _ids(_feed(client, size=60))

    assert published in ids
    assert draft not in ids


def test_should_narrow_by_make_and_then_by_model(client, publish, catalogue):
    brand_id, model_id = catalogue
    listing_id = publish()

    by_make = _feed(client, brand_id=brand_id, size=60)
    by_model = _feed(client, brand_id=brand_id, model_id=model_id, size=60)

    assert listing_id in _ids(by_make)
    assert listing_id in _ids(by_model)
    assert by_make["total"] >= by_model["total"]

    other = _feed(client, brand_id=str(uuid.uuid4()))
    assert other["total"] == 0 and other["items"] == []


def test_should_apply_every_filter_at_once(client, publish):
    wanted = publish(year=2016, price=1500000.0, milleage=90000.0, transmission="автомат")
    publish(year=2016, price=4500000.0, milleage=90000.0, transmission="автомат")

    page = _feed(client, year_from=2016, year_to=2016, price_to=2000000.0, size=60)

    assert wanted in _ids(page)
    assert all(card["year"] == 2016 and card["price"] <= 2000000.0 for card in page["items"])
    assert page["total"] == len(page["items"])


def test_should_include_both_ends_of_a_range(client, publish):
    older = publish(year=2010)
    newer = publish(year=2015)

    ids = _ids(_feed(client, year_from=2010, year_to=2015, size=60))

    assert older in ids and newer in ids


def test_should_take_several_gearboxes_at_once(client, publish):
    automatic = publish(transmission="автомат")
    manual = publish(transmission="механика")
    variator = publish(transmission="вариатор")

    ids = _ids(_feed(client, transmission=["автомат", "механика"], size=60))

    assert automatic in ids and manual in ids
    assert variator not in ids


def test_should_sort_by_price_in_both_directions_and_by_newness_by_default(client, publish):
    publish(price=900000.0)
    publish(price=3300000.0)
    newest = publish(price=1700000.0)

    ascending = [card["price"] for card in _feed(client, sort="price_asc", size=60)["items"]]
    descending = [card["price"] for card in _feed(client, sort="price_desc", size=60)["items"]]

    assert ascending == sorted(ascending)
    assert descending == sorted(descending, reverse=True)
    assert _ids(_feed(client, size=60))[0] == newest


def test_should_hand_out_each_listing_once_while_paging(client, publish):
    for _ in range(5):
        publish(price=2000000.0)

    seen = []
    for page in range(1, 4):
        seen += _ids(_feed(client, sort="price_asc", size=2, page=page))

    assert len(seen) == len(set(seen)), "a listing came back on two pages"


def test_should_answer_a_page_past_the_end_with_nothing(client, publish):
    publish()

    page = _feed(client, page=500)

    assert page["items"] == []
    assert page["total"] >= 1


def test_should_report_nothing_found_honestly(client, publish):
    publish(price=2000000.0)

    page = _feed(client, price_to=1.0)

    assert page["items"] == [] and page["total"] == 0


def test_should_refuse_a_model_without_its_make(client, catalogue):
    _, model_id = catalogue

    response = client.get("/api/v1/sale_car/list", params={"model_id": model_id})

    assert response.status_code == 422, response.text


@pytest.mark.parametrize(
    "backwards",
    [
        {"year_from": 2020, "year_to": 2010},
        {"price_from": 3000000, "price_to": 1000000},
        {"mileage_from": 200000, "mileage_to": 1000},
    ],
)
def test_should_refuse_a_range_given_backwards(client, backwards):
    response = client.get("/api/v1/sale_car/list", params=backwards)

    assert response.status_code == 422, response.text


def test_should_bound_the_size_of_a_page(client):
    assert client.get("/api/v1/sale_car/list", params={"size": 1000}).status_code == 422
    assert client.get("/api/v1/sale_car/list", params={"page": 0}).status_code == 422


def test_should_refuse_a_filter_the_contract_does_not_carry(client):
    response = client.get("/api/v1/sale_car/list", params={"has_thickness_map": "true"})

    assert response.status_code == 422, response.text
