import hashlib
import hmac

from fastapi import Depends, HTTPException, status
from fastapi.responses import PlainTextResponse
from loguru import logger
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import  YandexSettings
from app.db.database import get_db
from app.utils.security import create_access_token, create_refresh_token

async def verify_yandex_user(user_data: dict) -> bool:
    from loguru import logger

    required_fields = ["id"]
    for field in required_fields:
        if not user_data.get(field):
            logger.error(f"Missing required field: {field}")
            return False

    logger.info(f"Yandex user data validation successful for user {user_data.get('id')}")
    return True
    
async def yandex_auth(id, db: AsyncSession):
    credentials_exception = HTTPException(
        status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
        detail="Could not auth for YandexId",
    )
    try:
        logger.info(f"Create token for Yandex {id}")
        access_token = await create_access_token({"id": str(id)})
        refresh_token = await create_refresh_token({"id": str(id)})

        return refresh_token,access_token
    except Exception as e:
        raise credentials_exception