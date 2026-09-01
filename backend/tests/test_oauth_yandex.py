"""Signing in through Yandex ID, against a stand-in provider.

The provider itself needs a browser and a human, so what is held here is everything
around it — the properties that make the handshake safe rather than merely working: a
state good once, a handoff code good once, one account per subject, and a session token
that never travels in a URL.
"""

from urllib.parse import parse_qs, urlparse

import pytest

from app.features.auth.services.oauth_provider import FakeOAuthProvider, YandexOAuthProvider, provider_for
from app.features.auth.services.oauth_store import OAuthStore

pytestmark = pytest.mark.asyncio


@pytest.fixture(autouse=True)
def fake_provider(monkeypatch):
    monkeypatch.setattr("app.features.auth.api.auth_yandex.provider_for", lambda *_: FakeOAuthProvider())


def _start(client):
    response = client.get("/api/v1/auth/oauth/yandex/start", follow_redirects=False)
    assert response.status_code == 302, response.text
    return parse_qs(urlparse(response.headers["location"]).query)["state"][0]


def _callback(client, code="alice", state=None):
    return client.get(
        "/api/v1/auth/oauth/yandex/callback",
        params={"code": code, "state": state},
        follow_redirects=False,
    )


def _handoff(response):
    return parse_qs(urlparse(response.headers["location"]).query)


def _exchange(client, code):
    return client.post("/api/v1/auth/oauth/exchange", json={"code": code})


async def test_should_send_the_browser_to_the_provider_carrying_a_state(client):
    assert _start(client)


async def test_should_mint_a_different_state_every_time(client):
    assert _start(client) != _start(client)


async def test_should_hand_the_frontend_a_code_and_never_a_token(client):
    state = _start(client)

    response = _callback(client, state=state)

    assert response.status_code == 302, response.text
    handed = _handoff(response)
    assert handed["provider"] == ["yandex"]
    assert handed["code"], "no handoff code came back"
    assert "access_token" not in response.headers["location"]


async def test_should_exchange_the_handoff_code_for_a_session_once(client):
    state = _start(client)
    code = _handoff(_callback(client, state=state))["code"][0]

    first = _exchange(client, code)

    assert first.status_code == 200, first.text
    assert first.json()["token_type"] == "bearer"
    assert _exchange(client, code).status_code == 401, "the code was spent twice"


async def test_should_let_the_session_it_issued_read_the_profile(client):
    state = _start(client)
    code = _handoff(_callback(client, state=state))["code"][0]
    tokens = _exchange(client, code).json()

    profile = client.get(
        "/api/v1/user/profile", headers={"Authorization": f"Bearer {tokens['access_token']}"}
    )

    assert profile.status_code == 200, profile.text
    assert profile.json()["is_guest"] is False
    assert profile.json()["yandex_id"]


async def test_should_recognise_the_same_person_on_a_second_sign_in(client):
    def sign_in():
        state = _start(client)
        code = _handoff(_callback(client, state=state))["code"][0]
        tokens = _exchange(client, code).json()
        return client.get(
            "/api/v1/user/profile", headers={"Authorization": f"Bearer {tokens['access_token']}"}
        ).json()["id"]

    assert sign_in() == sign_in()


async def test_should_refuse_a_callback_carrying_a_state_nobody_minted(client):
    response = _callback(client, state="forged-state")

    assert _handoff(response)["error"] == ["state_invalid"]


async def test_should_refuse_a_state_that_has_already_been_used(client):
    state = _start(client)
    _callback(client, state=state)

    replayed = _callback(client, state=state)

    assert _handoff(replayed)["error"] == ["state_invalid"]


async def test_should_refuse_a_callback_with_no_state_at_all(client):
    assert _handoff(_callback(client, state=""))["error"] == ["state_invalid"]


async def test_should_report_a_callback_with_no_code(client):
    state = _start(client)

    assert _handoff(_callback(client, code="", state=state))["error"] == ["code_missing"]


async def test_should_report_a_provider_that_refused(client):
    state = _start(client)

    response = _callback(client, code="refuse-me", state=state)

    assert _handoff(response)["error"] == ["provider_failed"]


async def test_should_refuse_a_handoff_code_nobody_issued(client):
    assert _exchange(client, "never-minted").status_code == 401


async def test_should_refuse_a_state_minted_for_another_provider(client):
    store = OAuthStore()
    state = await store.mint_state("some-other-provider")

    assert await store.take_state(state, "yandex") is False


def test_should_build_the_yandex_authorisation_url_from_the_configured_client():
    url = YandexOAuthProvider().authorization_url("the-state")

    assert url.startswith("https://oauth.yandex.ru/authorize?")
    assert "response_type=code" in url
    assert "state=the-state" in url


def test_should_choose_the_stand_in_only_when_asked_for_it():
    assert isinstance(provider_for("fake"), FakeOAuthProvider)
    assert isinstance(provider_for("yandex"), YandexOAuthProvider)
