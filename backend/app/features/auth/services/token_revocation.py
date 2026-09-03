"""Отозванные токены.

Выход должен закрывать дверь на сервере, а не только стирать ключ у клиента: человек
жмёт «выйти» ровно тогда, когда боится за чужое устройство. JWT сам по себе отзыву не
поддаётся — он проверяется подписью и живёт до своего `exp`, — поэтому отозванные
хранятся списком, и список этот общий для всех воркеров: в памяти процесса он означал бы
«вышел на том сервере, который принял запрос».

Хранится отпечаток токена, а не сам токен: список отозванных не должен быть складом
действующих ключей на случай, если до Redis доберутся. Запись живёт ровно до `exp`
токена — после него токен не примет и проверка подписи.
"""

import hashlib
from datetime import datetime

from loguru import logger

from app.shared.storage.cache_service import cache_service

PREFIX = "revoked_token"


def fingerprint(token: str) -> str:
    return hashlib.sha256(token.encode("utf-8")).hexdigest()


def _seconds_left(payload: dict) -> int:
    """Сколько токену осталось жить. Не больше суток и не меньше минуты."""
    expires_at = payload.get("exp")
    if not expires_at:
        return 3600
    left = int(expires_at - datetime.utcnow().timestamp())
    return max(60, min(left, 86400))


async def revoke(token: str, payload: dict) -> None:
    await cache_service.set(
        PREFIX, fingerprint(token), {"revoked_at": datetime.utcnow().isoformat()},
        ttl=_seconds_left(payload),
    )


async def is_revoked(token: str) -> bool:
    """Отозван ли токен.

    Недоступный Redis отвечает «нет»: сервис, отказывающий всем во входе из-за
    недоступного кэша, хуже сервиса, у которого один вышедший ещё несколько минут ходит
    по действующему токену.
    """
    try:
        return await cache_service.get(PREFIX, fingerprint(token)) is not None
    except Exception as error:
        logger.warning(f"проверка отозванных токенов не удалась: {error}")
        return False
