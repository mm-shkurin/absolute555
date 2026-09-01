"""The moderator's screens: the queue, the counts, and the complaints.

Every route here is behind the same permission. A queue that an ordinary user can read is
a list of what has not been checked yet, which is exactly what someone gaming the review
wants to know.
"""

from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.database import get_db
from app.permissions.dependencies import require_permission
from app.permissions.permissions import Permission
from app.features.moderation.schemas.moderation import (
    ComplaintPage,
    ComplaintResponse,
    QueueCounts,
    QueuePage,
    RejectionReason,
)
from app.features.listing.schemas.sale_cars import SaleCarStatusChanged
from app.features.moderation.services.complaint_errors import ComplaintError
from app.features.moderation.services.complaint_service import ComplaintService
from app.features.listing.services.listing_errors import ListingError
from app.features.listing.services.listing_review import ListingReviewService
from app.features.moderation.services.moderation_service import ModerationService

from app.features.listing.api.listing_http import to_http
from .moderation_view import complaint_view, group_view, queue_item
from .moderation_http import to_http as complaint_to_http

moderation_router = APIRouter()

MODERATOR = require_permission(Permission.EDIT_ANY_SALE_CAR)


@moderation_router.get("/queue", response_model=QueuePage)
async def read_queue(
    tab: str = Query(default="waiting", pattern="^(waiting|complained|handled_today)$"),
    page: int = Query(default=1, ge=1),
    size: int = Query(default=20, ge=1, le=60),
    db: AsyncSession = Depends(get_db),
    moderator=Depends(MODERATOR),
):
    service = ModerationService(db)
    listings, total = await service.queue(tab, page, size, str(moderator.id))
    complaints = await service.open_complaint_counts([listing.sale_car_id for listing in listings])
    return {
        "items": [queue_item(listing, complaints.get(listing.sale_car_id, 0)) for listing in listings],
        "total": total,
        "page": page,
        "size": size,
    }


@moderation_router.get("/counts", response_model=QueueCounts)
async def read_counts(
    db: AsyncSession = Depends(get_db),
    moderator=Depends(MODERATOR),
):
    return await ModerationService(db).counts(str(moderator.id))


@moderation_router.get("/complaints", response_model=ComplaintPage)
async def read_complaints(
    status: str = Query(default="open", pattern="^(open|handled)$"),
    page: int = Query(default=1, ge=1),
    size: int = Query(default=20, ge=1, le=60),
    db: AsyncSession = Depends(get_db),
    moderator=Depends(MODERATOR),
):
    groups, total = await ComplaintService(db).grouped(status, page, size)
    return {
        "items": [group_view(listing_id, complaints) for listing_id, complaints in groups],
        "total": total,
        "page": page,
        "size": size,
    }


@moderation_router.post("/complaints/{complaint_id}/dismiss", response_model=ComplaintResponse)
async def dismiss_complaint(
    complaint_id: str,
    db: AsyncSession = Depends(get_db),
    moderator=Depends(MODERATOR),
):
    try:
        settled = await ComplaintService(db).dismiss(complaint_id, str(moderator.id))
    except ComplaintError as error:
        raise complaint_to_http(error)
    return complaint_view(settled)


@moderation_router.post("/listings/{sale_car_id}/unpublish", response_model=SaleCarStatusChanged)
async def unpublish_listing(
    sale_car_id: str,
    reason: RejectionReason,
    db: AsyncSession = Depends(get_db),
    moderator=Depends(MODERATOR),
):
    """Take a published listing down and settle its complaints in the same decision."""
    try:
        listing = await ListingReviewService(db).take_down(
            sale_car_id, reason.label.value, reason.comment, str(moderator.id)
        )
    except ListingError as error:
        raise to_http(error)
    return SaleCarStatusChanged(
        sale_car_id=listing.sale_car_id, status=listing.status, updated_at=listing.updated_at
    )
