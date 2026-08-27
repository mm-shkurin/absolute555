import hashlib
import hmac
import httpx
import json
from typing import Optional
from fastapi import Depends, HTTPException, status
from fastapi.responses import PlainTextResponse
from loguru import logger
from sqlalchemy.ext.asyncio import AsyncSession
import pkce 
from app.db.database import get_db
from app.utils.security import create_access_token, create_refresh_token
from app.services.user_service import UserService


async def guest_auth(db: AsyncSession , device_id: Optional[str] = None) -> dict[str,str]:
    if not device_id :
         raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="device_id is required for guest authentication"
        )
    
    user_service = UserService(db)
    user_id = await user_service.create_or_get_guest_user(device_id = device_id)

    access_token = await create_access_token({"id": str(user_id), "is_guest": True})
    refresh_token = await create_refresh_token({"id": str(user_id), "is_guest": True})

    return refresh_token, access_token