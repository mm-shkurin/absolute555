"""What the feed must never hand out, and the indexes it leans on.

Stories 7 and 8. A feed is a bulk read by definition: whatever it leaks, it leaks about
every listing at once and to anyone who can spell a URL.
"""

import pytest
from sqlalchemy import text

from tests.conftest import test_session
from tests.test_listing_lifecycle import COMPLETE, _create

pytestmark = pytest.mark.asyncio

INDEXED = [
    "ix_sale_cars_feed_brand_model",
    "ix_sale_cars_feed_year",
    "ix_sale_cars_feed_price",
    "ix_sale_cars_feed_mileage",
    "ix_sale_cars_feed_published",
]


def _feed(client, **params):
    response = client.get("/api/v1/sale_car/list", params=params)
    assert response.status_code == 200, response.text
    return response.json()


def test_should_never_carry_a_phone_number_in_the_feed(client, seller, moderator, catalogue, attach_photo):
    brand_id, model_id = catalogue
    listing_id = _create(client, seller)
    client.patch(
        f"/api/v1/sale_car/{listing_id}",
        headers=seller,
        json=dict(COMPLETE, brand_id=brand_id, model_id=model_id, phone_number="+79995550202"),
    )
    attach_photo(listing_id, seller, count=3)
    client.post(f"/api/v1/sale_car/{listing_id}/submit", headers=seller)
    client.post(f"/api/v1/sale_car/{listing_id}/approve", headers=moderator)

    for params in ({}, {"brand_id": brand_id}, {"sort": "price_desc", "size": 60}):
        for card in _feed(client, **params)["items"]:
            assert "phone_number" not in card
            assert "+7999555" not in str(card)


def test_should_keep_an_unpublished_listing_out_of_every_filtered_view(
    client, seller, signed_in, catalogue
):
    brand_id, model_id = catalogue
    draft = _create(client, seller)
    client.patch(
        f"/api/v1/sale_car/{draft}",
        headers=seller,
        json=dict(COMPLETE, brand_id=brand_id, model_id=model_id),
    )

    stranger = signed_in()
    page = client.get(
        "/api/v1/sale_car/list",
        params={"brand_id": brand_id, "model_id": model_id, "size": 60},
        headers=stranger,
    ).json()

    assert draft not in [card["sale_car_id"] for card in page["items"]]


@pytest.mark.parametrize(
    "hostile",
    ["автомат'; DROP TABLE sale_cars; --", "' OR 1=1 --", "%"],
)
def test_should_treat_a_filter_value_as_data(client, hostile):
    response = client.get("/api/v1/sale_car/list", params={"transmission": hostile})

    assert response.status_code == 200, response.text
    assert response.json()["items"] == []
    assert client.get("/api/v1/sale_car/list").status_code == 200, "the table is gone"


async def test_should_index_every_column_the_feed_filters_on():
    try:
        async with test_session()() as db:
            found = await db.execute(
                text("SELECT indexname FROM pg_indexes WHERE tablename = 'sale_cars'")
            )
            present = {row[0] for row in found}
    except Exception as exc:  # noqa: BLE001 - no database says nothing about the indexes
        pytest.skip(f"no database: {exc}")

    assert set(INDEXED) <= present, f"missing: {sorted(set(INDEXED) - present)}"
