"""Talking to Yandex ID, and the stand-in that lets the flow be tested without it.

Authorization code with a server-side secret exchange: the browser carries a code, this
service turns it into a token, and the token is spent here and never leaves. No PKCE --
there is no public client holding a secret to protect.
"""

from dataclasses import dataclass
from typing import Optional
from urllib.parse import urlencode

import httpx

from app.core.config import OAuthSettings, YandexSettings

AUTHORIZE_URL = "https://oauth.yandex.ru/authorize"
TOKEN_URL = "https://oauth.yandex.ru/token"
INFO_URL = "https://login.yandex.ru/info"

oauth_settings = OAuthSettings()


class OAuthFailed(Exception):
    """The provider refused, answered with nothing usable, or could not be reached."""


@dataclass(frozen=True)
class Identity:
    subject: str
    email: Optional[str]
    raw: dict


class YandexOAuthProvider:
    name = "yandex"

    def __init__(self, settings: Optional[YandexSettings] = None):
        self.settings = settings or YandexSettings()

    def authorization_url(self, state: str) -> str:
        return f"{AUTHORIZE_URL}?" + urlencode(
            {
                "response_type": "code",
                "client_id": self.settings.yandex_clientid,
                "redirect_uri": str(self.settings.yandex_redirect_uri),
                "state": state,
            }
        )

    async def fetch_identity(self, code: str) -> Identity:
        async with httpx.AsyncClient(timeout=10) as http:
            token = await self._exchange(http, code)
            return await self._read_identity(http, token)

    async def _exchange(self, http: httpx.AsyncClient, code: str) -> str:
        answer = await http.post(
            TOKEN_URL,
            data={
                "grant_type": "authorization_code",
                "code": code,
                "client_id": self.settings.yandex_clientid,
                "client_secret": self.settings.yandex_client_secret,
            },
        )
        if answer.status_code != 200:
            raise OAuthFailed(f"the token endpoint answered {answer.status_code}")

        token = answer.json().get("access_token")
        if not token:
            raise OAuthFailed("the token response carried no access token")
        return token

    @staticmethod
    async def _read_identity(http: httpx.AsyncClient, token: str) -> Identity:
        answer = await http.get(INFO_URL, headers={"Authorization": f"OAuth {token}"})
        if answer.status_code != 200:
            raise OAuthFailed(f"the info endpoint answered {answer.status_code}")

        profile = answer.json()
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
        return f"{oauth_settings.oauth_frontend_callback_url}?fake=1&state={state}"

    async def fetch_identity(self, code: str) -> Identity:
        if code.startswith("refuse"):
            raise OAuthFailed("the stand-in was asked to refuse")
        return Identity(subject=f"fake-{code}", email=f"{code}@example.test", raw={"id": f"fake-{code}"})


def provider_for(name: Optional[str] = None):
    chosen = name or oauth_settings.oauth_provider
    if chosen == "fake":
        return FakeOAuthProvider()
    return YandexOAuthProvider()
