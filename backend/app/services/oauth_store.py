"""The two short-lived secrets an OAuth sign-in needs, both in Redis.

The state is a CSRF guard: minted before the browser leaves for the provider, required
back on the callback, and good exactly once. The handoff code carries the finished
sign-in back to the frontend without putting a session token in a URL — a redirect
carrying a token leaves it in the browser's history and in the next request's referer.

Redis rather than a dict: this backend runs as several uvicorn workers, so a state minted
on one and returned to another must still be found (`.claude/rules/coding-rules.md`).
"""

import secrets
from typing import Optional

from app.core.config import OAuthSettings
from app.services.cache_service import cache_service

STATE_PREFIX = "oauth_state"
HANDOFF_PREFIX = "oauth_handoff"

oauth_settings = OAuthSettings()


class OAuthStore:
    def __init__(self, cache=cache_service):
        self.cache = cache

    async def mint_state(self, provider: str) -> str:
        state = secrets.token_urlsafe(32)
        await self.cache.set(
            STATE_PREFIX, state, {"provider": provider}, ttl=oauth_settings.oauth_state_ttl_seconds
        )
        return state

    async def take_state(self, state: str, provider: str) -> bool:
        """True when this state was minted here, for this provider, and not yet used.

        The provider is checked as well as the state itself: a state minted for one
        provider and replayed on another's callback would otherwise pass.
        """
        if not state:
            return False
        held = await self.cache.take(STATE_PREFIX, state)
        return held is not None and held.get("provider") == provider

    async def mint_handoff(self, user_id: str) -> str:
        code = secrets.token_urlsafe(32)
        await self.cache.set(
            HANDOFF_PREFIX,
            code,
            {"user_id": user_id},
            ttl=oauth_settings.oauth_handoff_ttl_seconds,
        )
        return code

    async def take_handoff(self, code: str) -> Optional[str]:
        if not code:
            return None
        held = await self.cache.take(HANDOFF_PREFIX, code)
        return held.get("user_id") if held else None
