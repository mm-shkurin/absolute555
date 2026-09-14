"""Where the listing services get their collaborators from other features."""

from fastapi import Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.database import get_db
from app.features.listing.services.listing_lifecycle import ListingLifecycleService
from app.features.listing.services.listing_review import ListingReviewService
from app.features.listing.services.sale_cars_service import SaleCarService
from app.features.moderation.services.complaint_service import ComplaintService
from app.features.recognition.services.webhook_service import WebhookService


def get_listing_lifecycle_service(db: AsyncSession = Depends(get_db)) -> ListingLifecycleService:
    return ListingLifecycleService(db, WebhookService(db))


def get_sale_car_service(db: AsyncSession = Depends(get_db)) -> SaleCarService:
    return SaleCarService(db, WebhookService(db))


def get_listing_review_service(db: AsyncSession = Depends(get_db)) -> ListingReviewService:
    return ListingReviewService(db, get_listing_lifecycle_service(db), ComplaintService(db))
