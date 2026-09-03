"""Консоль: люди, роли, блокировки и журнал.

Блокировка проверяется на живом токене, а не на новом входе. Правило, которое действует
только для тех, кто ещё не вошёл, — это не закрытая дверь, а закрытая калитка рядом с
открытыми воротами: у нарушителя токен уже на руках.

Граница между manager и admin проходит по власти над ролями. Модератор видит людей и
закрывает доступ — иначе разбор жалобы ничем не заканчивается; роли и журнал остаются
у admin, чтобы ручка разбора не становилась дорогой наверх (правило истории 13).
"""

import uuid

import jwt
import pytest

from tests.conftest import run_sql
from tests.test_complaints import published  # noqa: F401 — фикстура публикации истории 9


def _id_of(headers) -> str:
    return jwt.decode(
        headers["Authorization"].removeprefix("Bearer "), options={"verify_signature": False}
    )["id"]


def _as(headers, role):
    run_sql(
        "UPDATE users SET role = :role WHERE id = :id",
        {"role": role, "id": uuid.UUID(_id_of(headers))},
    )
    return headers


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


def test_should_refuse_a_block_that_says_nothing(client, admin, seller):
    """api-03. То же правило, что у отклонения объявления и отказа по заявке."""
    seller_id = _id_of(seller)

    assert _block(client, admin, seller_id, reason="").status_code == 422
    assert client.get("/api/v1/user/profile", headers=seller).status_code == 200


def test_should_not_let_anybody_block_themselves(client, admin):
    """api-04. Иначе первый промах оставляет площадку без администратора."""
    refused = _block(client, admin, _id_of(admin))

    assert refused.status_code == 409, refused.text
    assert client.get("/api/v1/role/users", headers=admin).status_code == 200


def test_should_not_apply_a_block_twice(client, admin, seller):
    """api-05."""
    seller_id = _id_of(seller)
    _block(client, admin, seller_id)

    assert _block(client, admin, seller_id).status_code == 409


def test_should_refuse_to_unblock_someone_who_has_their_access(client, admin, seller):
    """api-06."""
    assert _unblock(client, admin, _id_of(seller)).status_code == 409


def test_should_narrow_the_list_by_name(client, admin, signed_in):
    """api-11, вторая половина: поиск по части имени.

    Имя живёт внутри профиля провайдера, а не своей колонкой, поэтому ищется по тексту
    профиля — и именно это первая версия запроса собирала так, что сервер отвечал 500
    на любой поиск. Проверка нужна тестом: сценарий api-11 её называл, а первый тест
    сверял только роль и доступ.
    """
    person = signed_in()
    run_sql(
        "UPDATE users SET yandex_json = :profile WHERE id = :id",
        {
            "profile": '{"first_name": "Пелагея", "last_name": "Кузнецова"}',
            "id": uuid.UUID(_id_of(person)),
        },
    )

    found = client.get("/api/v1/role/users?query=Пелаг", headers=admin)

    assert found.status_code == 200, found.text
    assert _id_of(person) in [item["id"] for item in found.json()["items"]]


def test_should_narrow_the_list_by_role_and_by_access(client, admin, signed_in):
    """api-11."""
    blocked_id = _id_of(signed_in())
    _block(client, admin, blocked_id)

    only_blocked = client.get("/api/v1/role/users?blocked=true", headers=admin).json()
    assert all(item["is_blocked"] for item in only_blocked["items"])
    assert blocked_id in [item["id"] for item in only_blocked["items"]]

    admins = client.get("/api/v1/role/users?role=admin", headers=admin).json()
    assert all(item["role"] == "admin" for item in admins["items"])


def test_should_show_the_card_a_moderator_judges_by(client, moderator, seller):
    """api-12."""
    card = client.get(f"/api/v1/role/users/{_id_of(seller)}", headers=moderator)

    assert card.status_code == 200, card.text
    body = card.json()
    assert body["role"] == "user"
    assert body["is_blocked"] is False
    assert body["listings_total"] == 0
    assert body["complaints_total"] == 0


def test_should_walk_from_a_complaint_to_a_closed_door(
    client, admin, seller, moderator, published, signed_in
):
    """int-01. Разбор жалобы заканчивается закрытой дверью, а не снятым объявлением.

    Сценарий целиком: жалоба, снятие с публикации, блокировка автора. Без последнего шага
    человек публикует заново, и модерация ходит по кругу.
    """
    listing_id = published()
    complaint = client.post(
        f"/api/v1/sale_car/{listing_id}/complaints",
        headers=signed_in(),
        json={"reason": "photos_of_another_car", "text": "фотографии чужой машины"},
    )
    assert complaint.status_code in (200, 201), complaint.text

    taken_down = client.post(
        f"/api/v1/moderation/listings/{listing_id}/unpublish",
        headers=moderator,
        json={"label": "photos_of_another_car", "comment": "фотографии не от этой машины"},
    )
    assert taken_down.status_code == 200, taken_down.text

    closed = _block(client, admin, _id_of(seller), reason="фотографии чужих машин")
    assert closed.status_code == 200, closed.text

    assert client.get("/api/v1/user/profile", headers=seller).status_code == 403
    feed = client.get("/api/v1/sale_car/list").json()
    assert listing_id not in [item["sale_car_id"] for item in feed["items"]]
    journal = client.get(f"/api/v1/role/users/{_id_of(seller)}/audit", headers=admin).json()
    assert journal[0]["reason"] == "фотографии чужих машин"


def test_should_take_the_console_from_a_blocked_administrator(client, admin, signed_in):
    """sec-05."""
    other = _as(signed_in(), "admin")
    _block(client, admin, _id_of(other), reason="скомпрометирован")

    assert client.get("/api/v1/role/users", headers=other).status_code == 403
