"""Service providers of the offer feature: where its routers get services, wired with their collaborators."""

from fastapi import Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.database import get_db
from app.features.chat.services.chat_service import ChatService
from app.features.offer.services.offer_access_service import OfferAccessService
from app.features.offer.services.offer_notices import OfferNotices
from app.features.offer.services.offer_service import OfferService


def get_offer_service(db: AsyncSession = Depends(get_db)) -> OfferService:
    return OfferService(db, OfferNotices(ChatService(db)))


def get_offer_access_service(db: AsyncSession = Depends(get_db)) -> OfferAccessService:
    return OfferAccessService(db)
