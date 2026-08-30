"""Sign-in.

The two OAuth providers live in auth_vk.py and auth_yandex.py; what stays here is what
belongs to no provider -- refreshing a token and the guest account a device gets before
it has signed in with anything.
"""

from fastapi import APIRouter, Body, Depends

from app.core.exceptions import BaseErrorApp, ExternalServiceError
from loguru import logger
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.database import get_db
from app.schemas.token import Token
from app.services.user_service import UserService
from app.utils.security import create_access_token, create_refresh_token, refresh_access_token

from .auth_vk import vk_router
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


auth_router.include_router(vk_router)
auth_router.include_router(yandex_router)
