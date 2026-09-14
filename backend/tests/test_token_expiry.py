"""Срок жизни токена и сессии документации.

Просроченный токен обязан получить 401, а не 500: разница между «войдите заново» и
«сервис сломался» — это разница между экраном входа и звонком в поддержку.
"""

import uuid
from datetime import datetime, timedelta, timezone

import jwt
import pytest

from app.core.config import JWTSettings
from app.features.account.services.session_service import SessionService
from tests.conftest import user_id_of as _user_id

jwt_settings = JWTSettings()


def _forge(claims: dict, secret: str) -> str:
    return jwt.encode(claims, secret, algorithm=jwt_settings.algorithm)


def _expired_access(user_id: str) -> str:
    past = datetime.now(timezone.utc) - timedelta(minutes=5)
    return _forge(
        {"id": user_id, "type": "access", "is_guest": True, "exp": past, "iat": past},
        jwt_settings.secret_key,
    )



def test_should_refuse_an_expired_access_token(client, signed_in):
    token = _expired_access(_user_id(signed_in()))

    refused = client.get("/api/v1/user/profile", headers={"Authorization": f"Bearer {token}"})

    assert refused.status_code == 401, refused.text


def test_should_refuse_an_expired_refresh_token(client, signed_in):
    past = datetime.now(timezone.utc) - timedelta(minutes=5)
    token = _forge(
        {"id": _user_id(signed_in()), "type": "refresh", "exp": past, "iat": past},
        jwt_settings.refresh_token_secret_key,
    )

    refused = client.post("/api/v1/auth/refresh", json={"refresh_token": token})

    assert refused.status_code == 401, refused.text


def test_should_refuse_a_token_without_a_kind(client, signed_in):
    future = datetime.now(timezone.utc) + timedelta(minutes=5)
    token = _forge({"id": _user_id(signed_in()), "exp": future}, jwt_settings.secret_key)

    refused = client.get("/api/v1/user/profile", headers={"Authorization": f"Bearer {token}"})

    assert refused.status_code == 401, refused.text


def test_should_refuse_a_refresh_token_signed_with_the_access_key(client, signed_in):
    future = datetime.now(timezone.utc) + timedelta(minutes=5)
    token = _forge(
        {"id": _user_id(signed_in()), "type": "refresh", "exp": future}, jwt_settings.secret_key
    )

    refused = client.post("/api/v1/auth/refresh", json={"refresh_token": token})

    assert refused.status_code == 401, refused.text


def test_should_answer_the_same_way_to_a_logout_of_an_expired_token(client, signed_in):
    token = _expired_access(_user_id(signed_in()))

    logged_out = client.post(
        "/api/v1/auth/logout", headers={"Authorization": f"Bearer {token}"}, json={}
    )

    assert logged_out.status_code == 204, logged_out.text


def test_should_refuse_a_refresh_token_of_a_user_who_never_existed(client):
    future = datetime.now(timezone.utc) + timedelta(minutes=5)
    token = _forge(
        {"id": str(uuid.uuid4()), "type": "refresh", "exp": future},
        jwt_settings.refresh_token_secret_key,
    )

    refreshed = client.post("/api/v1/auth/refresh", json={"refresh_token": token})

    assert refreshed.status_code == 401, refreshed.text
    assert refreshed.json()["code"] == "TOKEN_INVALID"


@pytest.mark.parametrize("known", [True, False])
def test_should_recognise_only_the_sessions_it_handed_out(known):
    service = SessionService()
    token = service.create_session_token()
    if known:
        service.add_session(token)

    assert service.is_valid_session(token) is known


def test_should_forget_a_session_that_was_removed():
    service = SessionService()
    token = service.create_session_token()
    service.add_session(token)

    service.remove_session(token)

    assert service.is_valid_session(token) is False
    # Повторное снятие — не ошибка: выход дважды нажимают чаще, чем один раз.
    service.remove_session(token)
