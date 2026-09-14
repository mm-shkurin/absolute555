"""Where the offer services get their collaborators from other features."""

from fastapi import Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.database import get_db
from app.features.chat.services.chat_service import ChatService
from app.features.offer.services.offer_notices import OfferNotices
from app.features.offer.services.offer_service import OfferService


def get_offer_service(db: AsyncSession = Depends(get_db)) -> OfferService:
    return OfferService(db, OfferNotices(ChatService(db)))
