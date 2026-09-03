"""Ушедший человек в консоли модератора.

История 23, Tier 1. История 21 сделала удаление пометкой: строки остаются, объявления
остаются. Консоль, показывающая такую запись живой, врёт модератору — он пишет тому,
кого уже нет, и не понимает, почему тот молчит.
"""

import uuid


def _guest(client):
    response = client.post(
        "/api/v1/auth/guest/login", json={"device_id": f"adm-{uuid.uuid4()}"}
    )
    assert response.status_code == 200, response.text
    return response.json()


def _departed(client):
    """Учётная запись, владелец которой ушёл. Возвращает её идентификатор."""
    tokens = _guest(client)
    headers = {"Authorization": f"Bearer {tokens['access_token']}"}
    user_id = client.get("/api/v1/user/profile", headers=headers).json()["id"]
    assert client.delete("/api/v1/user", headers=headers).status_code == 204
    return user_id


def _card(client, moderator, user_id):
    response = client.get(f"/api/v1/role/users/{user_id}", headers=moderator)
    assert response.status_code == 200, response.text
    return response.json()


def test_should_mark_a_departed_account_in_the_card(client, moderator):
    user_id = _departed(client)

    assert _card(client, moderator, user_id)["deleted_at"]


def test_should_keep_a_living_account_unmarked(client, moderator):
    tokens = _guest(client)
    user_id = client.get(
        "/api/v1/user/profile", headers={"Authorization": f"Bearer {tokens['access_token']}"}
    ).json()["id"]

    assert _card(client, moderator, user_id)["deleted_at"] is None


def test_should_separate_the_departed_from_the_living_in_the_list(client, moderator):
    user_id = _departed(client)

    departed = client.get("/api/v1/role/users?deleted=true&page_size=100", headers=moderator)
    living = client.get("/api/v1/role/users?deleted=false&page_size=100", headers=moderator)

    assert departed.status_code == 200, departed.text
    assert all(row["deleted_at"] for row in departed.json()["items"])
    assert user_id not in [row["id"] for row in living.json()["items"]]


def test_should_refuse_to_block_someone_who_already_left(client, moderator):
    """Дверь уже закрыта: запись в журнале создавала бы видимость действия."""
    user_id = _departed(client)

    response = client.post(
        f"/api/v1/role/users/{user_id}/block",
        headers=moderator,
        json={"reason": "проверка"},
    )

    assert response.status_code == 409, response.text
    assert response.json()["code"] == "ACCESS_UNCHANGED"
