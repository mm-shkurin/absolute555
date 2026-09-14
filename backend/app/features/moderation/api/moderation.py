"""The moderator's screens: the queue, the counts, and the complaints.

Every route here is behind the same permission. A queue that an ordinary user can read is
a list of what has not been checked yet, which is exactly what someone gaming the review
wants to know.
"""

from fastapi import APIRouter, Depends, Query
from app.shared.http.paging import page_size as page_size_query
from app.features.listing.services.listing_review import ListingReviewService
from app.features.moderation.deps import get_complaint_service
from app.features.moderation.deps import get_moderation_service

from app.features.listing.deps import get_listing_review_service
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
from app.features.moderation.services.moderation_service import ModerationService

from app.shared.http.listing_http import to_http
from app.shared.http.moderation_view import complaint_view, group_view, queue_item
from app.shared.http.moderation_http import to_http as complaint_to_http

moderation_router = APIRouter()

MODERATOR = require_permission(Permission.EDIT_ANY_SALE_CAR)


@moderation_router.get("/queue", response_model=QueuePage)
async def read_queue(
    tab: str = Query(default="waiting", pattern="^(waiting|complained|handled_today)$"),
    page: int = Query(default=1, ge=1),
    size: int = Depends(page_size_query()),
    moderation_service: ModerationService = Depends(get_moderation_service),
    moderator=Depends(MODERATOR),
):
    listings, total = await moderation_service.queue(tab, page, size, str(moderator.id))
    complaints = await moderation_service.open_complaint_counts([listing.sale_car_id for listing in listings])
    return {
        "items": [queue_item(listing, complaints.get(listing.sale_car_id, 0)) for listing in listings],
        "total": total,
        "page": page,
        "size": size,
    }


@moderation_router.get("/counts", response_model=QueueCounts)
async def read_counts(
    moderation_service: ModerationService = Depends(get_moderation_service),
    moderator=Depends(MODERATOR),
):
    return await moderation_service.counts(str(moderator.id))


@moderation_router.get("/complaints", response_model=ComplaintPage)
async def read_complaints(
    status: str = Query(default="open", pattern="^(open|handled)$"),
    page: int = Query(default=1, ge=1),
    size: int = Depends(page_size_query()),
    complaint_service: ComplaintService = Depends(get_complaint_service),
    moderator=Depends(MODERATOR),
):
    groups, total = await complaint_service.grouped(status, page, size)
    return {
        "items": [group_view(listing_id, complaints) for listing_id, complaints in groups],
        "total": total,
        "page": page,
        "size": size,
    }


@moderation_router.post("/complaints/{complaint_id}/dismiss", response_model=ComplaintResponse)
async def dismiss_complaint(
    complaint_id: str,
    complaint_service: ComplaintService = Depends(get_complaint_service),
    moderator=Depends(MODERATOR),
):
    try:
        settled = await complaint_service.dismiss(complaint_id, str(moderator.id))
    except ComplaintError as error:
        raise complaint_to_http(error)
    return complaint_view(settled)


@moderation_router.post("/listings/{sale_car_id}/unpublish", response_model=SaleCarStatusChanged)
async def unpublish_listing(
    sale_car_id: str,
    reason: RejectionReason,
    listing_review_service: ListingReviewService = Depends(get_listing_review_service),
    moderator=Depends(MODERATOR),
):
    """Take a published listing down and settle its complaints in the same decision."""
    try:
        listing = await listing_review_service.take_down(
            sale_car_id, reason.label.value, reason.comment, str(moderator.id)
        )
    except ListingError as error:
        raise to_http(error)
    return SaleCarStatusChanged(
        sale_car_id=listing.sale_car_id, status=listing.status, updated_at=listing.updated_at
    )
