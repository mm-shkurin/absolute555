"""Who stands behind a token: refreshing an access token and resolving the caller."""

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config_getters import get_jwt_settings
from app.core.exceptions import AuthenticationError, AuthorizationError
from app.features.account.models.users import Users
from app.features.auth.services.token_revocation import is_revoked
from app.utils.security import create_access_token, verify_token


def _credentials_invalid() -> AuthenticationError:
    return AuthenticationError("Could not validate credentials", code="CREDENTIALS_INVALID")


class AccessService:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def refresh(self, refresh_token: str) -> str:
        if await is_revoked(refresh_token):
            # Вышедший не обновляется: иначе «выйти» означало бы «выйти до конца часа».
            raise AuthenticationError("Could not validate credentials", code="TOKEN_INVALID")

        try:
            payload = await verify_token(
                refresh_token, get_jwt_settings().refresh_token_secret_key, get_jwt_settings().algorithm
            )
            if payload.get("type") != "refresh":
                raise AuthenticationError("Invalid token type", code="TOKEN_WRONG_TYPE")

            # Подписи мало: она говорит, что токен наш, и молчит о том, жив ли человек.
            await self._still_allowed(payload.get("id"))

            return await create_access_token({"id": payload.get("id")})
        except AuthenticationError:
            raise
        except Exception:
            raise AuthenticationError("Could not validate credentials", code="TOKEN_INVALID")

    async def user_of(self, token: str) -> Users:
        user_id = await self._access_subject(token)
        return await self._still_allowed(user_id, code="CREDENTIALS_INVALID")

    async def _still_allowed(self, user_id, code: str = "TOKEN_INVALID") -> Users:
        """Человек за токеном: существует, не ушёл и не закрыт."""
        found = await self.db.execute(select(Users).where(Users.id == user_id))
        user = found.scalar_one_or_none()

        if user is None or user.deleted_at is not None:
            # Удалённая запись неотличима от несуществующей: обратной дороги нет, и ответ,
            # приглашающий написать в поддержку, обещал бы её.
            raise AuthenticationError("Could not validate credentials", code=code)

        if user.is_blocked:
            # 403, а не 401: токен подлинный, закрыта учётная запись. На 401 клиент пошёл
            # бы обновлять исправный токен по кругу и показал бы сбой входа вместо закрытой двери.
            raise AuthorizationError(user.blocked_reason or "Доступ закрыт", code="USER_BLOCKED")
        return user

    @staticmethod
    async def _access_subject(token: str):
        """The user id an access token names.

        An expired token keeps TOKEN_EXPIRED so the client knows to refresh; every other
        defect of the token answers CREDENTIALS_INVALID.
        """
        try:
            payload = await verify_token(token, get_jwt_settings().secret_key, get_jwt_settings().algorithm)
            revoked = await is_revoked(token)
        except AuthenticationError as error:
            if error.code == "TOKEN_EXPIRED":
                raise
            raise _credentials_invalid() from error
        except Exception as error:
            raise _credentials_invalid() from error
        if revoked or payload.get("id") is None or payload.get("type") != "access":
            raise _credentials_invalid()
        return payload.get("id")
