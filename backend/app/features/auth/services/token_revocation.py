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
import time
from datetime import datetime, timezone

from loguru import logger

from app.core.config_getters import get_jwt_settings
from app.core.exceptions import AuthenticationError
from app.shared.storage.cache_service import cache_service
from app.utils.security import verify_token

PREFIX = "revoked_token"


def fingerprint(token: str) -> str:
    return hashlib.sha256(token.encode("utf-8")).hexdigest()


def _seconds_left(payload: dict) -> int:
    """Сколько токену осталось жить; без `exp` — сколько живёт самый долгий токен."""
    expires_at = payload.get("exp")
    if not expires_at:
        return get_jwt_settings().refresh_token_expire_minutes * 60
    return max(int(expires_at - time.time()), 1)


async def revoke(token: str, payload: dict) -> None:
    await cache_service.set(
        PREFIX, fingerprint(token), {"revoked_at": datetime.now(timezone.utc).isoformat()},
        ttl=_seconds_left(payload),
    )


async def revoke_if_valid(token: str, secret: str) -> None:
    """An expired or forged token has nothing to revoke: it fails the signature check anyway."""
    try:
        payload = await verify_token(token, secret, get_jwt_settings().algorithm)
    except AuthenticationError:
        return
    await revoke(token, payload)


async def is_revoked(token: str) -> bool:
    """Отозван ли токен.

    Недоступный Redis отвечает «нет»: сервис, отказывающий всем во входе из-за
    недоступного кэша, хуже сервиса, у которого один вышедший ещё несколько минут ходит
    по действующему токену.
    """
    try:
        return await cache_service.get(PREFIX, fingerprint(token)) is not None
    except Exception as error:  # noqa: BLE001 - any cache failure answers "not revoked", see above
        logger.warning("проверка отозванных токенов не удалась: {}", error)
        return False
