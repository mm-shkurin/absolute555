"""Signing in, and what a token is worth.

The guest account is the whole of what this API grants without a provider, so these hold
the two properties everything else rests on: one device is one account, and a token is
accepted only if it is the right kind, signed with the right key, for a user who exists.
"""

import uuid

import jwt
import pytest

from app.core.config import JWTSettings

jwt_settings = JWTSettings()


def _guest(client, device_id=None):
    return client.post(
        "/api/v1/auth/guest/login",
        json={"device_id": device_id or f"device-{uuid.uuid4()}"},
    )


def _claims(token):
    return jwt.decode(token, options={"verify_signature": False})


def test_should_hand_a_device_an_account_and_the_same_one_next_time(client):
    device_id = f"device-{uuid.uuid4()}"

    first = _guest(client, device_id)
    second = _guest(client, device_id)

    assert first.status_code == 200, first.text
    assert second.status_code == 200, second.text
    assert _claims(first.json()["access_token"])["id"] == _claims(second.json()["access_token"])["id"]


def test_should_give_two_devices_two_accounts(client):
    one = _claims(_guest(client).json()["access_token"])["id"]
    other = _claims(_guest(client).json()["access_token"])["id"]

    assert one != other


def test_should_mark_a_guest_token_as_a_guest(client):
    claims = _claims(_guest(client).json()["access_token"])

    assert claims["is_guest"] is True
    assert claims["type"] == "access"


def test_should_refuse_a_login_without_a_device(client):
    assert client.post("/api/v1/auth/guest/login", json={}).status_code == 422


def test_should_exchange_a_refresh_token_for_a_new_access_token(client):
    tokens = _guest(client).json()

    response = client.post("/api/v1/auth/refresh", json={"refresh_token": tokens["refresh_token"]})

    assert response.status_code == 200, response.text
    assert _claims(response.json()["access_token"])["type"] == "access"


def test_should_refuse_an_access_token_where_a_refresh_token_belongs(client):
    tokens = _guest(client).json()

    response = client.post("/api/v1/auth/refresh", json={"refresh_token": tokens["access_token"]})

    assert response.status_code == 401, response.text


@pytest.mark.parametrize(
    "token",
    ["not-a-token", "", "Bearer.nonsense.here"],
)
def test_should_refuse_a_token_that_is_not_one(client, token):
    response = client.get("/api/v1/user/profile", headers={"Authorization": f"Bearer {token}"})

    assert response.status_code == 401, response.text


def test_should_refuse_a_token_signed_with_another_key(client):
    forged = jwt.encode(
        {"id": str(uuid.uuid4()), "type": "access"}, "not-the-signing-key", algorithm="HS256"
    )

    response = client.get("/api/v1/user/profile", headers={"Authorization": f"Bearer {forged}"})

    assert response.status_code == 401, response.text


def test_should_refuse_a_well_formed_token_for_a_user_who_does_not_exist(client):
    orphan = jwt.encode(
        {"id": str(uuid.uuid4()), "type": "access"},
        jwt_settings.secret_key,
        algorithm=jwt_settings.algorithm,
    )

    response = client.get("/api/v1/user/profile", headers={"Authorization": f"Bearer {orphan}"})

    assert response.status_code == 401, response.text


def test_should_describe_the_signed_in_caller(client, seller):
    response = client.get("/api/v1/user/profile", headers=seller)

    assert response.status_code == 200, response.text
    profile = response.json()
    assert profile["is_guest"] is True
    assert profile["user_type"] == "guest"
    # A guest is marked by is_guest, not by the role: the role ladder is about what a
    # user may moderate, and a guest sits at its bottom rung like any signed-in user.
    assert profile["role"] == "user"
    assert profile["device_id"]
