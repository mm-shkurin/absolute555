"""Sign-in.

Yandex OAuth lives in auth_yandex.py; what stays here is what belongs to no provider --
refreshing a token and the guest account a device gets before it has signed in with
anything.

VK is out of the repository, not merely disabled: the flow needs a VK business account
this project does not have, so the code could never be run or tested here and an
unreachable provider wired into the router is a route that answers 500. The files are
listed in .gitignore so a local copy does not drift back in.
"""

from typing import Optional

from fastapi import APIRouter, Body, Depends, status

from app.core.exceptions import BaseErrorApp, ExternalServiceError
from loguru import logger
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.database import get_db
from app.features.auth.schemas.token import Token
from app.features.account.services.user_service import UserService
from app.features.auth.services import token_revocation
from app.utils.security import (
    auth_scheme,
    create_access_token,
    create_refresh_token,
    jwt_settings,
    refresh_access_token,
    verify_token,
)

from .auth_yandex import yandex_router

auth_router = APIRouter()

@auth_router.post("/refresh", response_model=Token)
async def refresh(refresh_token: str = Body(..., embed=True), db: AsyncSession = Depends(get_db)):
    new_access_token = await refresh_access_token(refresh_token)
    
    return Token(
        access_token=new_access_token,
        refresh_token=refresh_token,
        token_type="bearer"
    )


@auth_router.post("/logout", status_code=status.HTTP_204_NO_CONTENT)
async def logout(
    refresh_token: Optional[str] = Body(None, embed=True),
    token: Optional[str] = Depends(auth_scheme),
):
    """Отозвать оба токена: тот, что в заголовке, и тот, что прислан телом.

    Ответ один и тот же, был токен действителен или нет: иначе ручка отвечает на вопрос
    «жив ли этот токен» кому угодно, кто его подобрал.
    """
    if token:
        await _revoke(token.removeprefix("Bearer "), jwt_settings.secret_key)
    if refresh_token:
        await _revoke(refresh_token, jwt_settings.refresh_token_secret_key)


async def _revoke(token: str, secret: str) -> None:
    try:
        payload = await verify_token(token, secret, jwt_settings.algorithm)
    except Exception:
        # Истёкший или подделанный отзывать нечего: он и так не пройдёт проверку подписи.
        return
    await token_revocation.revoke(token, payload)

@auth_router.post("/guest/login", response_model=Token)
async def guest_login(
    device_id: str = Body(..., embed=True),
    db: AsyncSession = Depends(get_db)
):
    try:
        user_service = UserService(db)
        user_id = await user_service.create_or_get_guest_user(device_id=device_id)
        
        if not user_id:
            raise ExternalServiceError("Failed to create guest user", code="GUEST_CREATE_FAILED")
        
        access_token = await create_access_token({"id": str(user_id), "is_guest": True})
        refresh_token = await create_refresh_token({"id": str(user_id), "is_guest": True})
        
        logger.info(f"Guest login successful: user_id={user_id}, device_id={device_id}")
        
        return Token(
            access_token=access_token,
            refresh_token=refresh_token,
            token_type="bearer"
        )
        
    except BaseErrorApp:
        raise
    except Exception as e:
        logger.error(f"Guest login error: {e}")
        raise ExternalServiceError("Guest login failed", code="GUEST_LOGIN_FAILED")


auth_router.include_router(yandex_router)
