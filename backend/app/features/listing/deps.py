"""Service providers of the listing feature: where its routers get services, wired with their collaborators."""

from fastapi import Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.database import get_db
from app.features.listing.services.thickness_map_service import ThicknessMapService
from app.features.listing.services.listing_gallery_service import ListingGalleryService
from app.features.listing.services.listing_feed_service import ListingFeedService
from app.features.listing.services.listing_document_service import ListingDocumentService
from app.features.listing.services.listing_autofill_service import ListingAutofillService
from app.features.listing.services.listing_lifecycle_service import ListingLifecycleService
from app.features.listing.services.listing_review_service import ListingReviewService
from app.features.listing.services.sale_car_service import SaleCarService
from app.features.moderation.services.complaint_service import ComplaintService
from app.features.recognition.services.webhook_service import WebhookService


def build_listing_autofill_service(db: AsyncSession) -> ListingAutofillService:
    return ListingAutofillService(db, ListingDocumentService(db))


def get_listing_lifecycle_service(db: AsyncSession = Depends(get_db)) -> ListingLifecycleService:
    return ListingLifecycleService(db, WebhookService(db), build_listing_autofill_service(db))


def get_sale_car_service(db: AsyncSession = Depends(get_db)) -> SaleCarService:
    return SaleCarService(db, WebhookService(db))


def get_listing_review_service(
    db: AsyncSession = Depends(get_db),
    lifecycle: ListingLifecycleService = Depends(get_listing_lifecycle_service),
) -> ListingReviewService:
    return ListingReviewService(db, lifecycle, ComplaintService(db), ListingDocumentService(db))


def get_listing_autofill_service(db: AsyncSession = Depends(get_db)) -> ListingAutofillService:
    return build_listing_autofill_service(db)


def get_listing_document_service(db: AsyncSession = Depends(get_db)) -> ListingDocumentService:
    return ListingDocumentService(db)


def get_listing_feed_service(db: AsyncSession = Depends(get_db)) -> ListingFeedService:
    return ListingFeedService(db)


def get_listing_gallery_service(db: AsyncSession = Depends(get_db)) -> ListingGalleryService:
    return ListingGalleryService(db)


def get_thickness_map_service(db: AsyncSession = Depends(get_db)) -> ThicknessMapService:
    return ThicknessMapService(db)
