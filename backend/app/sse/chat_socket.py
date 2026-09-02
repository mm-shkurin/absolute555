"""Live delivery for the chat, and the check that decides who may listen.

Two things live here and nowhere else: turning a token into the person behind it, and
fanning a message out to the connections of the two people in a dialogue.

Redis carries the fan-out because a message written on one uvicorn worker has to reach a
connection held by another; the in-process dictionary is only the last hop.
"""

import asyncio
import json
from typing import Dict, List, Optional, Set

from loguru import logger

from app.core.config import JWTSettings
from app.shared.storage.cache_service import cache_service
from app.utils.security import verify_token

jwt_settings = JWTSettings()

CHANNEL = "chat_messages"


async def listener_of(token: str) -> Optional[str]:
    """The user id a token stands for, or nothing at all.

    Nothing at all covers every failure the same way: absent, malformed, expired, signed
    with another key. A connection has no error screen to tell them apart on.
    """
    if not token:
        return None

    try:
        payload = await verify_token(
            token.removeprefix("Bearer "), jwt_settings.secret_key, jwt_settings.algorithm
        )
    except Exception:
        return None

    if payload.get("type") != "access":
        return None
    return payload.get("id")


class ChatHub:
    """The connections this process is holding, by the person on the other end."""

    def __init__(self):
        self._listeners: Dict[str, Set[asyncio.Queue]] = {}

    def join(self, user_id: str) -> asyncio.Queue:
        queue: asyncio.Queue = asyncio.Queue()
        self._listeners.setdefault(user_id, set()).add(queue)
        return queue

    def leave(self, user_id: str, queue: asyncio.Queue) -> None:
        held = self._listeners.get(user_id)
        if not held:
            return
        held.discard(queue)
        if not held:
            del self._listeners[user_id]

    async def deliver(self, user_ids: List[str], payload: dict) -> None:
        """Hand one message to the people it belongs to, here and on the other workers."""
        await self._publish(user_ids, payload)
        for user_id in user_ids:
            self.hand_over(user_id, payload)

    def hand_over(self, user_id: str, payload: dict) -> None:
        for queue in list(self._listeners.get(user_id, ())):
            try:
                queue.put_nowait(payload)
            except Exception as error:  # noqa: BLE001 - a full or closed queue is one lost message
                logger.warning(f"chat delivery to {user_id} failed: {error}")

    @staticmethod
    async def _publish(user_ids: List[str], payload: dict) -> None:
        client = cache_service.redis_client
        if client is None:
            return
        try:
            loop = asyncio.get_event_loop()
            await loop.run_in_executor(
                None,
                lambda: client.publish(CHANNEL, json.dumps({"to": user_ids, "payload": payload}, default=str)),
            )
        except Exception as error:  # noqa: BLE001 - a lost fan-out is a message the other worker misses
            logger.warning(f"chat fan-out failed: {error}")


chat_hub = ChatHub()
