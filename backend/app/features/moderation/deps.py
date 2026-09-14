"""Service providers of the moderation feature: where its routers get services, wired with their collaborators."""

from fastapi import Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.database import get_db
from app.features.moderation.services.moderation_service import ModerationService
from app.features.moderation.services.complaint_service import ComplaintService


def get_complaint_service(db: AsyncSession = Depends(get_db)) -> ComplaintService:
    return ComplaintService(db)


def get_moderation_service(db: AsyncSession = Depends(get_db)) -> ModerationService:
    return ModerationService(db)
