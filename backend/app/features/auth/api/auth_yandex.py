"""Yandex ID sign-in: start, callback, exchange.

The browser never carries a session token. The callback hands the frontend a one-time
handoff code in the redirect and the frontend trades it for a token pair over POST — a
redirect carrying the token itself would leave it in the browser's history and in the
referer of whatever the page loads next.

The state is minted here before the browser leaves and required back on the callback: it
is what stops a callback forged by someone else from signing a victim into an account
they control.
"""

import json

from fastapi import APIRouter, Body, Depends
from fastapi.responses import RedirectResponse
from loguru import logger
from sqlalchemy.ext.asyncio import AsyncSession
from urllib.parse import urlencode

from app.core.config import OAuthSettings
from app.core.exceptions import AuthenticationError
from app.db.database import get_db
from app.features.auth.schemas.token import Token
from app.features.auth.services.oauth_provider import OAuthFailed, provider_for
from app.features.auth.services.oauth_store import OAuthStore
from app.features.account.services.user_service import UserService
from app.utils.security import create_access_token, create_refresh_token

yandex_router = APIRouter()
oauth_settings = OAuthSettings()


@yandex_router.get("/oauth/yandex/start")
async def start_yandex_sign_in():
    provider = provider_for()
    state = await OAuthStore().mint_state(provider.name)
    return RedirectResponse(provider.authorization_url(state), status_code=302)


@yandex_router.get("/oauth/yandex/callback")
async def finish_yandex_sign_in(
    code: str = "", state: str = "", db: AsyncSession = Depends(get_db)
):
    """Where Yandex sends the browser back.

    Answers a redirect in every case, success or failure: this URL is opened by the
    browser itself, so an error body would be shown as a page. The frontend decides what
    to say about `error`.
    """
    provider = provider_for()

    if not await OAuthStore().take_state(state, provider.name):
        # Covers a forged state, a replayed one, one minted for another provider, and one
        # that expired while the person sat on the consent screen.
        return _back_to_frontend(error="state_invalid", provider=provider.name)

    if not code:
        return _back_to_frontend(error="code_missing", provider=provider.name)

    try:
        identity = await provider.fetch_identity(code)
    except OAuthFailed as failure:
        logger.warning(f"yandex sign-in failed: {failure}")
        return _back_to_frontend(error="provider_failed", provider=provider.name)

    user_id = await UserService(db).create_or_get_yandex_user(
        yandex_id=identity.subject, yandex_json=json.dumps(identity.raw, ensure_ascii=False)
    )
    handoff = await OAuthStore().mint_handoff(str(user_id))
    return _back_to_frontend(code=handoff, provider=provider.name)


@yandex_router.post("/oauth/exchange", response_model=Token)
async def exchange_handoff_code(code: str = Body(..., embed=True)):
    """The handoff code, once, for a token pair.

    Good exactly once: the code travelled in a URL, so anything that reads that URL
    afterwards — history, an extension, a referer — finds a code already spent.
    """
    user_id = await OAuthStore().take_handoff(code)
    if not user_id:
        raise AuthenticationError("This sign-in code is not valid", code="HANDOFF_INVALID")

    return Token(
        access_token=await create_access_token({"id": user_id}),
        refresh_token=await create_refresh_token({"id": user_id}),
        token_type="bearer",
    )


def _back_to_frontend(**params) -> RedirectResponse:
    separator = "&" if "?" in oauth_settings.oauth_frontend_callback_url else "?"
    return RedirectResponse(
        f"{oauth_settings.oauth_frontend_callback_url}{separator}{urlencode(params)}",
        status_code=302,
    )
