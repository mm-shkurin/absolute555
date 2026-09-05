"""Профиль поставщика, по HTTP.

История 16. Профиль — витрина импортного канала, поэтому он проходит ту же модерацию,
что и объявление: опубликованный без проверки, он ничем не отличается от объявления,
обходящего очередь.
"""

import uuid

import jwt
import pytest

from tests.conftest import run_sql

COMPLETE = {
    "company_name": "Ветер с востока",
    "countries": ["Корея", "Япония"],
    "brands": ["Kia", "Toyota"],
    "delivery_days_min": 30,
    "delivery_days_max": 60,
    "terms": "Предоплата 30%, растаможка включена",
}


def _id_of(headers) -> str:
    return jwt.decode(
        headers["Authorization"].removeprefix("Bearer "), options={"verify_signature": False}
    )["id"]


@pytest.fixture
def importer(signed_in):
    """Пользователь с ролью importer: роль выдаёт модератор заявкой из истории 13."""
    headers = signed_in()
    run_sql(
        "UPDATE users SET role = 'importer', is_guest = false WHERE id = :id",
        {"id": uuid.UUID(_id_of(headers))},
    )
    return headers


def fill(client, headers, **fields):
    return client.put("/api/v1/supplier/me", headers=headers, json={**COMPLETE, **fields})


def send_to_queue(client, headers):
    filled = fill(client, headers)
    assert filled.status_code == 200, filled.text
    return client.post("/api/v1/supplier/me/submit", headers=headers)


def decide(client, moderator, headers, verdict, **body):
    return client.post(
        f"/api/v1/moderation/suppliers/{_id_of(headers)}/{verdict}", headers=moderator, json=body or None
    )


def test_should_open_an_empty_profile_for_a_new_importer(client, importer):
    mine = client.get("/api/v1/supplier/me", headers=importer)

    assert mine.status_code == 200, mine.text
    assert mine.json()["status"] == "draft"
    assert mine.json()["countries"] == []


def test_should_keep_what_the_supplier_filled_in(client, importer):
    filled = fill(client, importer)

    assert filled.status_code == 200, filled.text
    assert filled.json()["company_name"] == COMPLETE["company_name"]
    assert filled.json()["countries"] == ["Корея", "Япония"]


def test_should_refuse_an_incomplete_profile_at_the_queue(client, importer):
    fill(client, importer, company_name=None, countries=[])

    refused = client.post("/api/v1/supplier/me/submit", headers=importer)

    assert refused.status_code == 422, refused.text
    assert refused.json()["code"] == "PROFILE_INCOMPLETE"
    assert "company_name" in refused.json()["details"]["missing_fields"]


def test_should_show_a_published_profile_to_anyone(client, importer, moderator):
    send_to_queue(client, importer)
    assert decide(client, moderator, importer, "approve").status_code == 200

    seen = client.get(f"/api/v1/supplier/{_id_of(importer)}")

    assert seen.status_code == 200, seen.text
    assert seen.json()["status"] == "published"
    assert seen.json()["delivery_days_max"] == 60


def test_should_hide_a_profile_that_is_still_waiting(client, importer):
    send_to_queue(client, importer)

    assert client.get(f"/api/v1/supplier/{_id_of(importer)}").status_code == 404


def test_should_hand_the_moderator_what_is_waiting(client, importer, moderator):
    send_to_queue(client, importer)

    waiting = client.get("/api/v1/moderation/suppliers", headers=moderator)

    assert waiting.status_code == 200, waiting.text
    assert _id_of(importer) in {item["user_id"] for item in waiting.json()["items"]}


def test_should_refuse_a_rejection_without_a_reason(client, importer, moderator):
    send_to_queue(client, importer)

    refused = decide(client, moderator, importer, "reject", reason="   ")

    assert refused.status_code == 422, refused.text


def test_should_return_a_rejected_profile_to_a_draft_on_edit(client, importer, moderator):
    send_to_queue(client, importer)
    decide(client, moderator, importer, "reject", reason="Условия описаны непонятно")

    corrected = fill(client, importer, terms="Предоплата 20%, растаможка включена")

    assert corrected.json()["status"] == "draft"
    assert corrected.json()["reject_reason"] is None


def test_should_freeze_a_profile_while_it_waits(client, importer):
    send_to_queue(client, importer)

    frozen = fill(client, importer, terms="Другие условия")

    assert frozen.status_code == 409, frozen.text
    assert frozen.json()["code"] == "PROFILE_FROZEN"


def test_should_refuse_a_user_without_the_role(client, seller):
    assert client.get("/api/v1/supplier/me", headers=seller).status_code == 403


class TestStorefronts:
    """Лента витрин: то, ради чего вкладка «Поставщики» и существует.

    До этой ручки сервер умел отдать витрину одного поставщика по идентификатору и
    очередь модератору, а списка не было вовсе: одобренный поставщик не появлялся нигде,
    и экран показывал ноль при тринадцати опубликованных профилях.
    """

    def test_should_show_a_published_storefront_to_anyone(self, client, importer, moderator):
        assert send_to_queue(client, importer).status_code == 200
        approved = decide(client, moderator, importer, "approve")
        assert approved.status_code == 200, approved.text

        response = client.get("/api/v1/supplier")

        assert response.status_code == 200, response.text
        assert _id_of(importer) in [one["user_id"] for one in response.json()["items"]]

    def test_should_keep_an_unapproved_storefront_out_of_the_list(self, client, importer):
        """Черновик и отправленный на проверку — работа над витриной, а не витрина."""
        assert send_to_queue(client, importer).status_code == 200

        listed = client.get("/api/v1/supplier").json()["items"]

        assert _id_of(importer) not in [one["user_id"] for one in listed]

    def test_should_answer_a_page_with_its_size_and_total(self, client):
        response = client.get("/api/v1/supplier?page=1&size=5")

        body = response.json()
        assert response.status_code == 200, response.text
        assert body["page"] == 1 and body["size"] == 5
        assert len(body["items"]) <= 5
