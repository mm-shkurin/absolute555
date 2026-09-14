"""Service providers of the importing feature: where its routers get services, wired with their collaborators."""

from fastapi import Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.database import get_db
from app.features.importing.services.supplier_service import SupplierProfileService
from app.features.importing.services.supplier_cover import SupplierCoverService
from app.features.chat.services.chat_service import ChatService
from app.features.importing.services.request_service import BuyerRequestService


def get_buyer_request_service(db: AsyncSession = Depends(get_db)) -> BuyerRequestService:
    return BuyerRequestService(db, ChatService(db))


def get_supplier_cover_service(db: AsyncSession = Depends(get_db)) -> SupplierCoverService:
    return SupplierCoverService(db)


def get_supplier_profile_service(db: AsyncSession = Depends(get_db)) -> SupplierProfileService:
    return SupplierProfileService(db)
