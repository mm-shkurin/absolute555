"""Консоль: отказы в блокировке, поиск по людям, карточка и путь от жалобы до блокировки.

Продолжение `test_admin_console.py`: там закрытие и открытие двери и границы власти.
"""

import uuid

from tests.conftest import run_sql
from tests.conftest import user_id_of as _id_of
from tests.helpers import grant_role as _as
from tests.test_admin_console import _block, _unblock, admin  # noqa: F401
from tests.test_complaints import published  # noqa: F401 — фикстура публикации истории 9


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
    assert complaint.status_code == 201, complaint.text

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
