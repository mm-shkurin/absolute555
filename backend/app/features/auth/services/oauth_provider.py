"""Talking to Yandex ID, and the stand-in that lets the flow be tested without it.

Authorization code with a server-side secret exchange: the browser carries a code, this
service turns it into a token, and the token is spent here and never leaves. No PKCE --
there is no public client holding a secret to protect.
"""

from dataclasses import dataclass
from typing import Optional
from urllib.parse import urlencode

import httpx

from app.core.config import YandexSettings
from app.core.config_getters import get_oauth_settings, get_yandex_settings
from app.features.auth.services.oauth_errors import OAuthFailed
from app.shared.outbound_http import outbound_client


@dataclass(frozen=True)
class Identity:
    subject: str
    email: Optional[str]
    raw: dict


class YandexOAuthProvider:
    name = "yandex"

    def __init__(self, settings: Optional[YandexSettings] = None):
        self.settings = settings or get_yandex_settings()

    def authorization_url(self, state: str) -> str:
        return f"{self.settings.yandex_authorize_url}?" + urlencode(
            {
                "response_type": "code",
                "client_id": self.settings.yandex_clientid,
                "redirect_uri": str(self.settings.yandex_redirect_uri),
                "state": state,
            }
        )

    async def fetch_identity(self, code: str) -> Identity:
        # Сеть до провайдера рвётся так же буднично, как провайдер отказывает, и для
        # человека это одно и то же событие. Без этого таймаут уходил наверх и колбэк
        # отвечал страницей ошибки — а его открывает сам браузер, так что человек
        # оставался в тупике с уже потраченным кодом и без пути назад ко входу.
        try:
            async with outbound_client() as http:
                token = await self._exchange(http, code)
                return await self._read_identity(http, token)
        except httpx.HTTPError as unreachable:
            raise OAuthFailed(f"the provider could not be reached: {unreachable!r}") from unreachable

    async def _exchange(self, http: httpx.AsyncClient, code: str) -> str:
        answer = await http.post(
            str(self.settings.yandex_token_url),
            data={
                "grant_type": "authorization_code",
                "code": code,
                "client_id": self.settings.yandex_clientid,
                "client_secret": self.settings.yandex_client_secret,
            },
        )
        if not answer.is_success:
            raise OAuthFailed(f"the token endpoint answered {answer.status_code}")

        try:
            token = answer.json().get("access_token")
        except ValueError as unreadable:
            raise OAuthFailed("the token response was not readable") from unreadable
        if not token:
            raise OAuthFailed("the token response carried no access token")
        return token

    async def _read_identity(self, http: httpx.AsyncClient, token: str) -> Identity:
        answer = await http.get(
            str(self.settings.yandex_info_url), headers={"Authorization": f"OAuth {token}"}
        )
        if not answer.is_success:
            raise OAuthFailed(f"the info endpoint answered {answer.status_code}")

        try:
            profile = answer.json()
        except ValueError as unreadable:
            raise OAuthFailed("the info response was not readable") from unreadable
        subject = profile.get("id")
        if not subject:
            # Without a stable subject there is nothing to recognise this person by next
            # time, and signing them in would create a second account on every visit.
            raise OAuthFailed("the info response carried no subject")

        return Identity(subject=str(subject), email=profile.get("default_email"), raw=profile)


class FakeOAuthProvider:
    """Signs in whoever the code says, for tests and for a stack with no credentials."""

    name = "yandex"

    def authorization_url(self, state: str) -> str:
        return f"{get_oauth_settings().oauth_frontend_callback_url}?fake=1&state={state}"

    async def fetch_identity(self, code: str) -> Identity:
        if code.startswith("refuse"):
            raise OAuthFailed("the stand-in was asked to refuse")
        return Identity(subject=f"fake-{code}", email=f"{code}@example.test", raw={"id": f"fake-{code}"})


def provider_for(name: Optional[str] = None):
    chosen = name or get_oauth_settings().oauth_provider
    if chosen == "fake":
        return FakeOAuthProvider()
    return YandexOAuthProvider()
