"""Sessions of the documentation reader, kept in Redis so every worker sees the same login."""

import secrets

from app.core.config_getters import get_docs_settings
from app.shared.storage.cache_service import cache_service

PREFIX = "docs_session"


async def open_session() -> str:
    token = secrets.token_urlsafe(32)
    await cache_service.set(
        PREFIX, token, {"open": True}, ttl=get_docs_settings().docs_session_ttl_seconds
    )
    return token


async def is_open(token: str | None) -> bool:
    if not token:
        return False
    return await cache_service.get(PREFIX, token) is not None
