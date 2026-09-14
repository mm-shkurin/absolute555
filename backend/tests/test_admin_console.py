"""Консоль: люди, роли, блокировки и журнал.

Блокировка проверяется на живом токене, а не на новом входе. Правило, которое действует
только для тех, кто ещё не вошёл, — это не закрытая дверь, а закрытая калитка рядом с
открытыми воротами: у нарушителя токен уже на руках.

Граница между manager и admin проходит по власти над ролями. Модератор видит людей и
закрывает доступ — иначе разбор жалобы ничем не заканчивается; роли и журнал остаются
у admin, чтобы ручка разбора не становилась дорогой наверх (правило истории 13).
"""


import pytest

from tests.conftest import user_id_of as _id_of
from tests.helpers import grant_role as _as
from tests.test_complaints import published  # noqa: F401 — фикстура публикации истории 9


@pytest.fixture
def admin(signed_in):
    return _as(signed_in(), "admin")


def _block(client, headers, user_id, reason="объявления с чужими фотографиями"):
    return client.post(
        f"/api/v1/role/users/{user_id}/block", json={"reason": reason}, headers=headers
    )


def _unblock(client, headers, user_id, reason="разобрались, ошибка"):
    return client.post(
        f"/api/v1/role/users/{user_id}/unblock", json={"reason": reason}, headers=headers
    )


def test_should_close_the_door_and_say_why(client, admin, seller):
    """api-01. Токен на руках перестаёт открывать, и отказ называет блокировку."""
    seller_id = _id_of(seller)

    blocked = _block(client, admin, seller_id)

    assert blocked.status_code == 200, blocked.text
    assert blocked.json()["is_blocked"] is True
    refused = client.get("/api/v1/user/profile", headers=seller)
    assert refused.status_code == 403, refused.text
    assert refused.json()["code"] == "USER_BLOCKED"


def test_should_give_the_door_back(client, admin, seller):
    """api-02."""
    seller_id = _id_of(seller)
    _block(client, admin, seller_id)

    returned = _unblock(client, admin, seller_id)

    assert returned.status_code == 200, returned.text
    assert returned.json()["is_blocked"] is False
    assert client.get("/api/v1/user/profile", headers=seller).status_code == 200


def test_should_record_who_closed_the_door_and_why(client, admin, seller):
    """api-08. Причина живёт в базе, а не в логе контейнера: перезапуск её не стирает."""
    seller_id = _id_of(seller)
    _block(client, admin, seller_id, reason="накрутка отзывов")

    journal = client.get(f"/api/v1/role/users/{seller_id}/audit", headers=admin)

    assert journal.status_code == 200, journal.text
    newest = journal.json()[0]
    assert newest["action"] == "blocked"
    assert newest["reason"] == "накрутка отзывов"
    assert newest["actor_id"] == _id_of(admin)


def test_should_record_a_role_change_with_its_reason(client, admin, signed_in):
    """api-09. Причина смены роли принималась и терялась; теперь она в журнале."""
    person = signed_in()
    person_id = _id_of(person)

    changed = client.put(
        f"/api/v1/role/users/{person_id}/role",
        json={"new_role": "manager", "reason": "берёт очередь модерации"},
        headers=admin,
    )
    assert changed.status_code == 200, changed.text

    journal = client.get(f"/api/v1/role/users/{person_id}/audit", headers=admin).json()
    assert journal[0]["action"] == "role_changed"
    assert journal[0]["reason"] == "берёт очередь модерации"


def test_should_hand_out_the_people_one_page_at_a_time(client, admin):
    """api-10. Прежняя форма читала всю таблицу ради одного экрана."""
    page = client.get("/api/v1/role/users?page=1&page_size=2", headers=admin)

    assert page.status_code == 200, page.text
    body = page.json()
    assert len(body["items"]) <= 2
    assert body["total"] >= len(body["items"])
    assert body["page"] == 1


def test_should_refuse_the_console_to_an_ordinary_user(client, seller, signed_in):
    """sec-01."""
    victim_id = _id_of(signed_in())

    assert client.get("/api/v1/role/users", headers=seller).status_code == 403
    assert client.get(f"/api/v1/role/users/{victim_id}", headers=seller).status_code == 403
    assert client.get(f"/api/v1/role/users/{victim_id}/audit", headers=seller).status_code == 403
    assert _block(client, seller, victim_id).status_code == 403


def test_should_not_let_a_moderator_close_the_door_on_their_own_level(
    client, moderator, signed_in
):
    """sec-03. Власть над равным — тот же тихий путь наверх, что закрыла история 13."""
    peer_id = _id_of(_as(signed_in(), "manager"))
    chief_id = _id_of(_as(signed_in(), "admin"))

    assert _block(client, moderator, peer_id).status_code == 403
    assert _block(client, moderator, chief_id).status_code == 403


def test_should_let_a_moderator_see_people_but_not_roles(client, moderator, signed_in):
    """sec-02. Модератору нужны список и карточка; роли и журнал — нет."""
    person_id = _id_of(signed_in())

    assert client.get("/api/v1/role/users", headers=moderator).status_code == 200
    assert client.get(f"/api/v1/role/users/{person_id}", headers=moderator).status_code == 200
    assert client.get(f"/api/v1/role/users/{person_id}/audit", headers=moderator).status_code == 403
    refused = client.put(
        f"/api/v1/role/users/{person_id}/role",
        json={"new_role": "manager", "reason": "почему бы и нет"},
        headers=moderator,
    )
    assert refused.status_code == 403
