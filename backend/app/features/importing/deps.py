"""Where the importing services get their collaborators from other features."""

from fastapi import Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.database import get_db
from app.features.chat.services.chat_service import ChatService
from app.features.importing.services.request_service import BuyerRequestService


def get_buyer_request_service(db: AsyncSession = Depends(get_db)) -> BuyerRequestService:
    return BuyerRequestService(db, ChatService(db))
