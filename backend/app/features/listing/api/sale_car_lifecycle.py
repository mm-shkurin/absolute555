"""Lifecycle actions on a listing.

One path per intent rather than one writable status field: a client that can assign any
value walks straight past the transition table.
"""

from fastapi import APIRouter, Depends
from app.features.listing.services.listing_lifecycle import ListingLifecycleService
from app.features.listing.deps import get_listing_review_service
from app.features.listing.services.listing_review import ListingReviewService
from app.features.moderation.deps import get_complaint_service

from app.features.listing.deps import get_listing_lifecycle_service, get_listing_review_service
from app.permissions.dependencies import require_permission
from app.permissions.permissions import Permission
from app.features.moderation.schemas.moderation import ComplaintCreate, ComplaintResponse, RejectionReason
from app.features.listing.schemas.sale_cars import SaleCarStatusChanged
from app.features.moderation.services.complaint_service import ComplaintService
from app.features.auth.deps import get_current_user
from app.features.listing.services.listing_access_service import listing_of
from app.features.moderation.api.moderation_view import complaint_view

lifecycle_router = APIRouter()


def _changed(listing) -> SaleCarStatusChanged:
    return SaleCarStatusChanged(
        sale_car_id=listing.sale_car_id,
        status=listing.status,
        updated_at=listing.updated_at,
    )


async def _own_action(action, sale_car_id: str, service, user):
    await listing_of(service, sale_car_id, user)
    return _changed(await getattr(service, action)(sale_car_id))


@lifecycle_router.post("/{sale_car_id}/submit", response_model=SaleCarStatusChanged)
async def submit(
    sale_car_id: str,
    listing_lifecycle_service: ListingLifecycleService = Depends(get_listing_lifecycle_service),
    current_user=Depends(get_current_user),
):
    return await _own_action("submit", sale_car_id, listing_lifecycle_service, current_user)


@lifecycle_router.post("/{sale_car_id}/withdraw", response_model=SaleCarStatusChanged)
async def withdraw(
    sale_car_id: str,
    listing_lifecycle_service: ListingLifecycleService = Depends(get_listing_lifecycle_service),
    current_user=Depends(get_current_user),
):
    return await _own_action("withdraw", sale_car_id, listing_lifecycle_service, current_user)


@lifecycle_router.post("/{sale_car_id}/sold", response_model=SaleCarStatusChanged)
async def mark_sold(
    sale_car_id: str,
    listing_lifecycle_service: ListingLifecycleService = Depends(get_listing_lifecycle_service),
    current_user=Depends(get_current_user),
):
    return await _own_action("mark_sold", sale_car_id, listing_lifecycle_service, current_user)


@lifecycle_router.post("/{sale_car_id}/republish", response_model=SaleCarStatusChanged)
async def republish(
    sale_car_id: str,
    listing_lifecycle_service: ListingLifecycleService = Depends(get_listing_lifecycle_service),
    current_user=Depends(get_current_user),
):
    return await _own_action("republish", sale_car_id, listing_lifecycle_service, current_user)


@lifecycle_router.post("/{sale_car_id}/revise", response_model=SaleCarStatusChanged)
async def revise(
    sale_car_id: str,
    listing_lifecycle_service: ListingLifecycleService = Depends(get_listing_lifecycle_service),
    current_user=Depends(get_current_user),
):
    return await _own_action("revise", sale_car_id, listing_lifecycle_service, current_user)


@lifecycle_router.post("/{sale_car_id}/approve", response_model=SaleCarStatusChanged)
async def approve(
    sale_car_id: str,
    listing_review_service: ListingReviewService = Depends(get_listing_review_service),
    moderator=Depends(require_permission(Permission.EDIT_ANY_SALE_CAR)),
):
    return _changed(await listing_review_service.approve(sale_car_id, str(moderator.id)))


@lifecycle_router.post("/{sale_car_id}/reject", response_model=SaleCarStatusChanged)
async def reject(
    sale_car_id: str,
    reason: RejectionReason,
    listing_review_service: ListingReviewService = Depends(get_listing_review_service),
    moderator=Depends(require_permission(Permission.EDIT_ANY_SALE_CAR)),
):
    """Turn a listing back. The label is required; the comment the seller reads is not."""
    turned_back = await listing_review_service.reject(
        sale_car_id, reason.label.value, reason.comment, str(moderator.id)
    )
    return _changed(turned_back)


@lifecycle_router.post(
    "/{sale_car_id}/complaints", response_model=ComplaintResponse, status_code=201
)
async def complain(
    sale_car_id: str,
    complaint: ComplaintCreate,
    complaint_service: ComplaintService = Depends(get_complaint_service),
    current_user=Depends(get_current_user),
):
    """Anyone signed in, once per listing. Only about a listing that is published."""
    recorded = await complaint_service.complain(
        sale_car_id, str(current_user.id), complaint.reason.value, complaint.text
    )
    return complaint_view(recorded)
