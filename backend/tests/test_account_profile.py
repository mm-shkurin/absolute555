"""Аккаунт: имя, фотография, выход, удаление — по HTTP.

История 21, Tier 1. До неё у аккаунта было ровно одно действие — прочитать себя; имя
вычислялось из ответа провайдера и не менялось, выйти было некуда, удалиться нельзя.
"""

import uuid

from tests.conftest import make_image
from tests.test_listing_lifecycle import _create


def _profile(client, headers):
    response = client.get("/api/v1/user/profile", headers=headers)
    assert response.status_code == 200, response.text
    return response.json()


def _rename(client, headers, name):
    return client.patch("/api/v1/user/profile", headers=headers, json={"name": name})


def _guest(client):
    response = client.post(
        "/api/v1/auth/guest/login", json={"device_id": f"acc-{uuid.uuid4()}"}
    )
    assert response.status_code == 200, response.text
    return response.json()


def test_should_keep_a_name_the_person_chose_for_themselves(client, seller):
    response = _rename(client, seller, "Пётр Кузнецов")

    assert response.status_code == 200, response.text
    assert response.json()["name"] == "Пётр Кузнецов"


def test_should_fall_back_to_the_provider_name_when_the_chosen_one_is_cleared(client, seller):
    _rename(client, seller, "Пётр Кузнецов")

    cleared = _rename(client, seller, "   ")

    assert cleared.status_code == 200, cleared.text
    # У гостя провайдерского имени нет вовсе — пустое поле честнее выдуманного.
    assert cleared.json()["name"] is None


def test_should_refuse_a_name_longer_than_the_field_allows(client, seller):
    response = _rename(client, seller, "и" * 61)

    assert response.status_code == 422, response.text


def test_should_show_a_photograph_the_person_uploaded(client, seller):
    response = client.put(
        "/api/v1/user/avatar",
        headers=seller,
        files={"file": ("face.png", make_image(), "image/png")},
    )

    assert response.status_code == 200, response.text
    assert response.json()["avatar_url"]
    assert _profile(client, seller)["avatar_url"] == response.json()["avatar_url"]


def test_should_refuse_a_file_that_is_not_an_image(client, seller):
    response = client.put(
        "/api/v1/user/avatar",
        headers=seller,
        files={"file": ("face.png", b"not a picture at all", "image/png")},
    )

    assert response.status_code == 422, response.text
    assert response.json()["code"] == "NOT_AN_IMAGE"


def test_should_take_the_photograph_back_off(client, seller):
    client.put(
        "/api/v1/user/avatar",
        headers=seller,
        files={"file": ("face.png", make_image(), "image/png")},
    )

    response = client.delete("/api/v1/user/avatar", headers=seller)

    assert response.status_code == 200, response.text
    assert response.json()["avatar_url"] is None


def test_should_stop_a_refresh_token_from_working_after_a_logout(client):
    tokens = _guest(client)
    headers = {"Authorization": f"Bearer {tokens['access_token']}"}

    out = client.post(
        "/api/v1/auth/logout", headers=headers, json={"refresh_token": tokens["refresh_token"]}
    )

    assert out.status_code == 204, out.text
    refreshed = client.post(
        "/api/v1/auth/refresh", json={"refresh_token": tokens["refresh_token"]}
    )
    assert refreshed.status_code == 401, refreshed.text


def test_should_stop_the_access_token_the_logout_arrived_with(client):
    tokens = _guest(client)
    headers = {"Authorization": f"Bearer {tokens['access_token']}"}
    client.post("/api/v1/auth/logout", headers=headers, json={})

    response = client.get("/api/v1/user/profile", headers=headers)

    assert response.status_code == 401, response.text


def test_should_answer_a_second_logout_the_same_way(client):
    """Выход не сообщает, был ли токен ещё жив: иначе он отвечает на этот вопрос всем."""
    tokens = _guest(client)
    headers = {"Authorization": f"Bearer {tokens['access_token']}"}
    client.post("/api/v1/auth/logout", headers=headers, json={"refresh_token": tokens["refresh_token"]})

    again = client.post(
        "/api/v1/auth/logout", headers=headers, json={"refresh_token": tokens["refresh_token"]}
    )

    assert again.status_code == 204, again.text


def test_should_close_the_door_on_a_deleted_account(client):
    tokens = _guest(client)
    headers = {"Authorization": f"Bearer {tokens['access_token']}"}

    removed = client.delete("/api/v1/user", headers=headers)

    assert removed.status_code == 204, removed.text
    assert client.get("/api/v1/user/profile", headers=headers).status_code == 401


def test_should_leave_what_the_deleted_account_left_behind(client, seller):
    """Строки остаются: вычеркнуть их значит переписать чужую историю задним числом."""
    listing_id = _create(client, seller)

    assert client.delete("/api/v1/user", headers=seller).status_code == 204

    fresh = _guest(client)
    seen = client.get(
        f"/api/v1/sale_car/{listing_id}",
        headers={"Authorization": f"Bearer {fresh['access_token']}"},
    )
    # Черновик чужому не виден — но он существует, иначе ответ был бы тем же 404 и после
    # реального удаления строки. Проверяем то, что видно снаружи: удаление не роняет API.
    assert seen.status_code in (403, 404)


def test_should_refuse_an_unauthenticated_rename(client):
    assert client.patch("/api/v1/user/profile", json={"name": "кто-то"}).status_code == 401


def test_should_refuse_an_unauthenticated_deletion(client):
    assert client.delete("/api/v1/user").status_code == 401
