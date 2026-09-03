from datetime import datetime, timedelta

from fastapi import Depends, status
from fastapi import Request
from fastapi.security import APIKeyHeader
import jwt
from loguru import logger
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from app.core.exceptions import AuthenticationError, AuthorizationError
from app.core.config import JWTSettings
from app.core.config import CookieSettings
from app.db.database import get_db
from app.features.account.models.users import Users
from app.features.auth.schemas.token import Token  

auth_scheme = APIKeyHeader(name="Authorization", scheme_name="Bearer", auto_error=False)

jwt_settings = JWTSettings()
cookie_settings = CookieSettings()
async def create_access_token(to_encode: dict):
    expire = datetime.utcnow() + timedelta(
        minutes=jwt_settings.access_token_expire_minutes
    )
    payload = dict(to_encode)
    payload.update({"exp": expire, "type": "access"})
    encoded_jwt = jwt.encode(
        payload, jwt_settings.secret_key, algorithm=jwt_settings.algorithm
    )

    return encoded_jwt

async def create_refresh_token(to_encode: dict):
    expire = datetime.utcnow() + timedelta(
        minutes=jwt_settings.refresh_token_expire_minutes
    )
    payload = dict(to_encode)
    payload.update({"exp": expire, "type": "refresh"})
    encoded_jwt = jwt.encode(
        payload, jwt_settings.refresh_token_secret_key, algorithm=jwt_settings.algorithm
    )

    return encoded_jwt

async def verify_token(token:str, secret_key:str, algorithm:str):
    try:
        payload = jwt.decode(token, secret_key, algorithms=[algorithm])
        return payload
    except jwt.ExpiredSignatureError:
        raise AuthenticationError("Token has expired", code="TOKEN_EXPIRED")
    except jwt.InvalidTokenError:
        raise AuthenticationError("Could not validate credentials", code="TOKEN_INVALID")

async def refresh_access_token(refresh_token: str):
    from app.features.auth.services.token_revocation import is_revoked

    if await is_revoked(refresh_token):
        # Вышедший не обновляется: иначе «выйти» означало бы «выйти до конца часа».
        raise AuthenticationError("Could not validate credentials", code="TOKEN_INVALID")

    try:
        refresh_token_payload = await verify_token(
            refresh_token, 
            jwt_settings.refresh_token_secret_key, 
            jwt_settings.algorithm
        )
        if refresh_token_payload.get("type") != "refresh":
            raise AuthenticationError("Invalid token type", code="TOKEN_WRONG_TYPE")
        access_token_payload = {
            "id": refresh_token_payload.get("id"),  
        }
        
        new_access_token = await create_access_token(access_token_payload)
        return new_access_token
        
    except AuthenticationError:
        raise
    except Exception:
        raise AuthenticationError("Could not validate credentials", code="TOKEN_INVALID")

async def _is_revoked(token: str) -> bool:
    # Импорт внутри: отзыв живёт в фиче авторизации, а она читает эти же утилиты.
    from app.features.auth.services.token_revocation import is_revoked

    return await is_revoked(token)


async def get_current_user(request: Request, token: str = Depends(auth_scheme), db: AsyncSession = Depends(get_db)):
    credentials_exception = AuthenticationError(
        "Could not validate credentials",
        code="CREDENTIALS_INVALID",
    )
    
    if not token:
        # Try to read access token from HttpOnly cookie
        token = request.cookies.get(cookie_settings.access_cookie_name)
        if not token:
            raise credentials_exception
    
    try:
        if token.startswith("Bearer "):
            token = token[7:]
        
        payload = await verify_token(token, jwt_settings.secret_key, jwt_settings.algorithm)
        if await _is_revoked(token):
            raise credentials_exception
        id: str = payload.get("id")
        if id is None:
            raise credentials_exception
        if payload.get("type") != "access":
            raise credentials_exception
    except Exception:
        raise credentials_exception
    
    result = await db.execute(select(Users).where(Users.id == id))
    user = result.scalar_one_or_none()
    
    if user is None or user.deleted_at is not None:
        # Удалённая запись неотличима от несуществующей: обратной дороги нет, и ответ,
        # приглашающий написать в поддержку, обещал бы её.
        raise credentials_exception

    if user.is_blocked:
        # 403, а не 401: токен подлинный, дело не в нём. На 401 клиент пошёл бы
        # обновлять исправный токен по кругу и показал бы человеку сбой входа вместо
        # закрытой двери. Проверка стоит здесь, а не в каждой пишущей ручке: их
        # полтора десятка, и пропущенная — дыра, которую находит нарушитель.
        raise AuthorizationError(
            user.blocked_reason or "Доступ закрыт",
            code="USER_BLOCKED",
        )

    return user


async def get_current_user_or_none(
    request: Request, token: str = Depends(auth_scheme), db: AsyncSession = Depends(get_db)
):
    """The caller, when there is one.

    A public listing is readable by a guest, but the same path must recognise its owner:
    an unpublished listing is visible to the person who wrote it and to nobody else. So
    the token is read when present and its absence is not an error.
    """
    try:
        return await get_current_user(request, token, db)
    except AuthenticationError:
        return None
    # AuthorizationError не перехватывается намеренно: заблокированный, пришедший с
    # токеном, получает закрытую дверь и на публичном маршруте. Молча понизить его до
    # гостя значило бы показать ленту тому, кому доступ закрыли, и не сказать об этом.
