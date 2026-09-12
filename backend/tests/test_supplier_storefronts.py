"""Лента витрин поставщиков и решения модератора по ней.

Витрина — публичная страница: прятать её от того, кто выбирает, кому доверить привоз,
значит прятать сам выбор. Поэтому лента открыта гостю, а в ленте — только одобренные:
черновик и отклонённый профиль это работа над витриной, а не витрина.
"""

import uuid

import pytest

from tests.conftest import run_sql
from tests.test_supplier_profile import COMPLETE, _id_of, decide, send_to_queue


@pytest.fixture
def importer(signed_in):
    headers = signed_in()
    run_sql(
        "UPDATE users SET role = 'importer', is_guest = false WHERE id = :id",
        {"id": uuid.UUID(_id_of(headers))},
    )
    return headers


def _published(client, importer, moderator) -> str:
    assert send_to_queue(client, importer).status_code == 200
    approved = decide(client, moderator, importer, "approve")
    assert approved.status_code == 200, approved.text
    return _id_of(importer)


def test_should_show_the_feed_to_a_guest(client, importer, moderator):
    user_id = _published(client, importer, moderator)

    feed = client.get("/api/v1/supplier", params={"size": 60})

    assert feed.status_code == 200, feed.text
    assert user_id in [one["user_id"] for one in feed.json()["items"]]


def test_should_page_the_feed_honestly(client, importer, moderator):
    _published(client, importer, moderator)

    page = client.get("/api/v1/supplier", params={"page": 1, "size": 1})

    assert page.status_code == 200, page.text
    body = page.json()
    assert len(body["items"]) <= 1
    assert body["page"] == 1 and body["size"] == 1
    assert body["total"] >= len(body["items"])


def test_should_refuse_a_page_outside_its_bounds(client):
    for params in ({"page": 0}, {"size": 0}, {"size": 61}):
        answer = client.get("/api/v1/supplier", params=params)
        assert answer.status_code == 422, answer.text


def test_should_keep_a_profile_that_waits_out_of_the_feed(client, importer):
    assert send_to_queue(client, importer).status_code == 200

    feed = client.get("/api/v1/supplier", params={"size": 60})

    assert _id_of(importer) not in [one["user_id"] for one in feed.json()["items"]]


def test_should_keep_a_rejected_profile_out_of_the_feed(client, importer, moderator):
    assert send_to_queue(client, importer).status_code == 200
    rejected = decide(client, moderator, importer, "reject", reason="фотографии чужой площадки")
    assert rejected.status_code == 200, rejected.text

    feed = client.get("/api/v1/supplier", params={"size": 60})

    assert _id_of(importer) not in [one["user_id"] for one in feed.json()["items"]]
    assert client.get(f"/api/v1/supplier/{_id_of(importer)}").status_code == 404


def test_should_refuse_to_approve_a_profile_nobody_submitted(client, importer, moderator):
    filled = client.put("/api/v1/supplier/me", headers=importer, json=COMPLETE)
    assert filled.status_code == 200, filled.text

    approved = decide(client, moderator, importer, "approve")

    assert approved.status_code in (400, 404, 409, 422), approved.text
    assert client.get(f"/api/v1/supplier/{_id_of(importer)}").status_code == 404


def test_should_refuse_a_decision_to_an_ordinary_user(client, importer, seller):
    assert send_to_queue(client, importer).status_code == 200

    queue = client.get("/api/v1/moderation/suppliers", headers=seller)
    approved = client.post(
        f"/api/v1/moderation/suppliers/{_id_of(importer)}/approve", headers=seller
    )

    assert queue.status_code == 403, queue.text
    assert approved.status_code == 403, approved.text


def test_should_answer_404_for_a_storefront_of_nobody(client):
    absent = client.get(f"/api/v1/supplier/{uuid.uuid4()}")

    assert absent.status_code == 404, absent.text
