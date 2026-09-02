"""Заявки покупателя и отклики поставщиков.

История 18. Спрос без машины: у заявки нет ни VIN, ни фотографий, ни продавца. Отклик
привязан к паре «заявка и поставщик» — повторный правит первый, а не встаёт вторым,
иначе покупатель видел бы одного поставщика дважды с двумя ценами.
"""

import uuid

import jwt
import pytest

from tests.conftest import run_sql


def _id_of(headers) -> str:
    return jwt.decode(
        headers["Authorization"].removeprefix("Bearer "), options={"verify_signature": False}
    )["id"]


def _verify(headers):
    run_sql("UPDATE users SET is_guest = false WHERE id = :id", {"id": uuid.UUID(_id_of(headers))})
    return headers


@pytest.fixture
def buyer(signed_in):
    return _verify(signed_in())


@pytest.fixture
def importer(signed_in):
    headers = signed_in()
    run_sql(
        "UPDATE users SET role = 'importer', is_guest = false WHERE id = :id",
        {"id": uuid.UUID(_id_of(headers))},
    )
    return headers


def ask(client, headers, **fields):
    body = {"comment": "Ищу праворульную, до 2 млн", **fields}
    return client.post("/api/v1/request", headers=headers, json=body)


def respond(client, headers, request_id, price=1900000.0, delivery_days=40):
    return client.put(
        f"/api/v1/request/{request_id}/response",
        headers=headers,
        json={"price": price, "delivery_days": delivery_days},
    )


def test_should_open_a_request(client, buyer, catalogue):
    brand_id, model_id = catalogue

    opened = ask(client, buyer, brand_id=brand_id, model_id=model_id, budget_max=2000000.0)

    assert opened.status_code == 201, opened.text
    assert opened.json()["status"] == "open"
    assert opened.json()["brand"]
    assert opened.json()["responses_count"] == 0


def test_should_cap_the_open_requests_of_one_buyer(client, buyer):
    for _ in range(3):
        assert ask(client, buyer).status_code == 201

    refused = ask(client, buyer)

    assert refused.status_code == 409, refused.text
    assert refused.json()["code"] == "REQUEST_LIMIT_REACHED"
    assert refused.json()["details"]["limit"] == 3


def test_should_free_a_slot_when_a_request_closes(client, buyer):
    first = ask(client, buyer).json()["request_id"]
    ask(client, buyer)
    ask(client, buyer)

    closed = client.post(f"/api/v1/request/{first}/close", headers=buyer)

    assert closed.status_code == 200, closed.text
    assert closed.json()["status"] == "closed"
    assert ask(client, buyer).status_code == 201


def test_should_show_open_requests_to_a_supplier(client, buyer, importer):
    request_id = ask(client, buyer).json()["request_id"]

    feed = client.get("/api/v1/request", headers=importer)

    assert feed.status_code == 200, feed.text
    assert request_id in {one["request_id"] for one in feed.json()["items"]}


def test_should_refuse_the_demand_feed_to_a_buyer(client, buyer):
    assert client.get("/api/v1/request", headers=buyer).status_code == 403


def test_should_record_one_response_per_supplier(client, buyer, importer):
    request_id = ask(client, buyer).json()["request_id"]
    first = respond(client, importer, request_id, price=1900000.0)
    assert first.status_code == 200, first.text

    corrected = respond(client, importer, request_id, price=1850000.0, delivery_days=35)

    assert corrected.json()["response_id"] == first.json()["response_id"]
    assert corrected.json()["price"] == 1850000.0
    assert client.get(f"/api/v1/request/{request_id}/responses", headers=buyer).json().__len__() == 1


def test_should_show_the_buyer_every_response(client, buyer, importer, signed_in):
    request_id = ask(client, buyer).json()["request_id"]
    other = signed_in()
    run_sql(
        "UPDATE users SET role = 'importer', is_guest = false WHERE id = :id",
        {"id": uuid.UUID(_id_of(other))},
    )
    respond(client, importer, request_id, price=1900000.0)
    respond(client, other, request_id, price=2000000.0)

    seen = client.get(f"/api/v1/request/{request_id}/responses", headers=buyer)

    assert seen.status_code == 200, seen.text
    assert {one["price"] for one in seen.json()} == {1900000.0, 2000000.0}


def test_should_show_a_supplier_only_their_own_response(client, buyer, importer, signed_in):
    request_id = ask(client, buyer).json()["request_id"]
    other = signed_in()
    run_sql(
        "UPDATE users SET role = 'importer', is_guest = false WHERE id = :id",
        {"id": uuid.UUID(_id_of(other))},
    )
    respond(client, importer, request_id, price=1900000.0)
    respond(client, other, request_id, price=2000000.0)

    mine = client.get(f"/api/v1/request/{request_id}/responses", headers=importer)

    assert [one["price"] for one in mine.json()] == [1900000.0]


def test_should_hide_the_responses_from_a_stranger(client, buyer, signed_in):
    request_id = ask(client, buyer).json()["request_id"]

    stranger = _verify(signed_in())

    assert client.get(f"/api/v1/request/{request_id}/responses", headers=stranger).status_code == 404


def test_should_refuse_a_response_to_a_closed_request(client, buyer, importer):
    request_id = ask(client, buyer).json()["request_id"]
    client.post(f"/api/v1/request/{request_id}/close", headers=buyer)

    refused = respond(client, importer, request_id)

    assert refused.status_code == 409, refused.text
    assert refused.json()["code"] == "REQUEST_CLOSED"


def test_should_not_close_somebody_elses_request(client, buyer, signed_in):
    request_id = ask(client, buyer).json()["request_id"]
    stranger = _verify(signed_in())

    assert client.post(f"/api/v1/request/{request_id}/close", headers=stranger).status_code == 404


def test_should_count_the_responses_on_the_buyers_own_list(client, buyer, importer):
    request_id = ask(client, buyer).json()["request_id"]
    respond(client, importer, request_id)

    mine = client.get("/api/v1/request/my", headers=buyer)

    row = next(one for one in mine.json() if one["request_id"] == request_id)
    assert row["responses_count"] == 1
