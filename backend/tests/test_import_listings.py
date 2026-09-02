"""Объявления под привоз.

История 17. Та же таблица и та же лента, что у машин в наличии: покупатель ищет машину, а
не канал поставки. Разница в том, чего у привозной машины ещё нет — её самой: VIN и СТС
требовать не с чего, зато страна, срок и цена под ключ обязательны.
"""

import uuid

import jwt
import pytest

from tests.conftest import run_sql
from tests.test_listing_lifecycle import COMPLETE

IMPORT_FIELDS = {
    "import_country": "Корея",
    "delivery_days": 45,
    "turnkey_price": 2450000.0,
    "price": 2300000.0,
    "phone_number": "+79130000000",
}


def _id_of(headers) -> str:
    return jwt.decode(
        headers["Authorization"].removeprefix("Bearer "), options={"verify_signature": False}
    )["id"]


@pytest.fixture
def importer(signed_in):
    headers = signed_in()
    run_sql(
        "UPDATE users SET role = 'importer', is_guest = false WHERE id = :id",
        {"id": uuid.UUID(_id_of(headers))},
    )
    return headers


def create_import(client, headers):
    return client.post("/api/v1/sale_car", headers=headers, json={"listing_kind": "import"})


def test_should_let_an_importer_open_an_import_draft(client, importer):
    created = create_import(client, importer)

    assert created.status_code == 201, created.text
    assert created.json()["listing_kind"] == "import"


def test_should_refuse_an_import_draft_to_an_ordinary_seller(client, seller):
    refused = create_import(client, seller)

    assert refused.status_code == 403, refused.text
    assert refused.json()["code"] == "NOT_AN_IMPORTER"


def test_should_default_to_a_car_in_stock(client, seller):
    created = client.post("/api/v1/sale_car", headers=seller, json={})

    assert created.json()["listing_kind"] == "stock"


def test_should_keep_the_terms_of_the_delivery(client, importer):
    listing_id = create_import(client, importer).json()["sale_car_id"]

    filled = client.patch(
        f"/api/v1/sale_car/{listing_id}", headers=importer, json=IMPORT_FIELDS
    )

    assert filled.status_code == 200, filled.text
    assert filled.json()["import_country"] == "Корея"
    assert filled.json()["delivery_days"] == 45
    assert filled.json()["turnkey_price"] == 2450000.0


def test_should_ask_an_import_listing_for_what_it_owes(client, importer, attach_photo):
    listing_id = create_import(client, importer).json()["sale_car_id"]
    client.patch(f"/api/v1/sale_car/{listing_id}", headers=importer, json={"price": 100.0})
    attach_photo(listing_id, importer, count=3)

    refused = client.post(f"/api/v1/sale_car/{listing_id}/submit", headers=importer)

    assert refused.status_code == 422, refused.text
    missing = refused.json()["details"]["missing_fields"]
    assert {"import_country", "delivery_days", "turnkey_price"} <= set(missing)


def test_should_publish_an_import_listing_without_a_vin(client, importer, attach_photo, moderator):
    listing_id = create_import(client, importer).json()["sale_car_id"]
    client.patch(f"/api/v1/sale_car/{listing_id}", headers=importer, json=IMPORT_FIELDS)
    attach_photo(listing_id, importer, count=3)

    assert client.post(f"/api/v1/sale_car/{listing_id}/submit", headers=importer).status_code == 200
    approved = client.post(f"/api/v1/sale_car/{listing_id}/approve", headers=moderator)

    assert approved.status_code == 200, approved.text
    assert client.get(f"/api/v1/sale_car/{listing_id}").json()["vin"] is None


def test_should_filter_the_feed_by_channel(client, importer, attach_photo, moderator, seller, catalogue):
    brand_id, model_id = catalogue
    imported = create_import(client, importer).json()["sale_car_id"]
    client.patch(f"/api/v1/sale_car/{imported}", headers=importer, json=IMPORT_FIELDS)
    attach_photo(imported, importer, count=3)
    client.post(f"/api/v1/sale_car/{imported}/submit", headers=importer)
    client.post(f"/api/v1/sale_car/{imported}/approve", headers=moderator)

    stock = client.post("/api/v1/sale_car", headers=seller, json={}).json()["sale_car_id"]
    client.patch(
        f"/api/v1/sale_car/{stock}",
        headers=seller,
        json=dict(COMPLETE, brand_id=brand_id, model_id=model_id),
    )
    attach_photo(stock, seller, count=3)
    client.post(f"/api/v1/sale_car/{stock}/submit", headers=seller)
    client.post(f"/api/v1/sale_car/{stock}/approve", headers=moderator)

    imports = client.get("/api/v1/sale_car/list", params={"kind": "import"})

    assert imports.status_code == 200, imports.text
    shown = {card["sale_car_id"] for card in imports.json()["items"]}
    assert imported in shown and stock not in shown
    card = next(one for one in imports.json()["items"] if one["sale_car_id"] == imported)
    assert card["import_country"] == "Корея"
    assert card["delivery_days"] == 45
