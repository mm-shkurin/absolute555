"""«Показать номер»: телефон отдаётся по нажатию и только вошедшему.

Поле в карточке отдало бы все номера площадки одному проходу скрапера, и кнопка стала бы
украшением. Поэтому проверяется не только успех, но и одинаковость отказов: черновик и
объявление без номера отвечают одним и тем же 404, иначе перебор идентификаторов
рассказывал бы, какие объявления существуют.
"""

import uuid

from tests.conftest import run_sql

PHONE = "+79995553311"

COMPLETE = {"price": 1200000.0, "milleage": 90000.0, "phone_number": PHONE, "year": 2014}


def _create(client, headers) -> str:
    response = client.post("/api/v1/sale_car", headers=headers)
    assert response.status_code == 201, response.text
    return response.json()["sale_car_id"]


def _publish(client, seller, moderator, catalogue, attach_photo, **fields) -> str:
    brand_id, model_id = catalogue
    listing_id = _create(client, seller)
    body = dict(COMPLETE, brand_id=brand_id, model_id=model_id, **fields)
    filled = client.patch(f"/api/v1/sale_car/{listing_id}", headers=seller, json=body)
    assert filled.status_code == 200, filled.text
    attach_photo(listing_id, seller, count=3)
    assert client.post(f"/api/v1/sale_car/{listing_id}/submit", headers=seller).status_code == 200
    approved = client.post(f"/api/v1/sale_car/{listing_id}/approve", headers=moderator)
    assert approved.status_code == 200, approved.text
    return listing_id


def test_should_give_the_number_to_a_signed_in_caller(
    client, seller, moderator, catalogue, attach_photo, signed_in
):
    listing_id = _publish(client, seller, moderator, catalogue, attach_photo)

    revealed = client.post(f"/api/v1/sale_car/{listing_id}/reveal-phone", headers=signed_in())

    assert revealed.status_code == 200, revealed.text
    assert revealed.json()["phone_number"] == PHONE


def test_should_refuse_an_anonymous_caller(
    client, seller, moderator, catalogue, attach_photo
):
    listing_id = _publish(client, seller, moderator, catalogue, attach_photo)

    revealed = client.post(f"/api/v1/sale_car/{listing_id}/reveal-phone")

    assert revealed.status_code == 401, revealed.text


def test_should_answer_404_for_a_draft(client, seller, signed_in):
    listing_id = _create(client, seller)
    client.patch(f"/api/v1/sale_car/{listing_id}", headers=seller, json={"phone_number": PHONE})

    revealed = client.post(f"/api/v1/sale_car/{listing_id}/reveal-phone", headers=signed_in())

    assert revealed.status_code == 404, revealed.text
    assert revealed.json()["code"] == "LISTING_NOT_FOUND"


def test_should_answer_404_when_the_listing_carries_no_number(
    client, seller, moderator, catalogue, attach_photo, signed_in
):
    listing_id = _publish(client, seller, moderator, catalogue, attach_photo)
    # Номер снимается прямо в базе: опубликованное объявление заморожено, и через API
    # до этой ветки не дойти. Ветка всё равно защитная — строка без номера может
    # приехать из импорта или пережить смену правил заполнения.
    run_sql(
        "UPDATE sale_cars SET phone_number = NULL WHERE sale_car_id = :id",
        {"id": uuid.UUID(listing_id)},
    )

    revealed = client.post(f"/api/v1/sale_car/{listing_id}/reveal-phone", headers=signed_in())

    assert revealed.status_code == 404, revealed.text
    assert revealed.json()["code"] == "LISTING_NOT_FOUND"


def test_should_answer_404_for_an_identifier_that_names_nothing(client, signed_in):
    revealed = client.post(
        "/api/v1/sale_car/00000000-0000-0000-0000-000000000000/reveal-phone",
        headers=signed_in(),
    )

    assert revealed.status_code == 404, revealed.text
