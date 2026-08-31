"""Lifecycle actions on a listing.

One path per intent rather than one writable status field: a client that can assign any
value walks straight past the transition table.
"""

from fastapi import APIRouter, Body, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.database import get_db
from app.models.users import Users
from app.permissions.dependencies import require_permission
from app.permissions.permissions import Permission
from app.schemas.moderation import ComplaintCreate, ComplaintResponse, RejectionReason
from app.schemas.sale_cars import SaleCarStatusChanged
from app.services.listing_errors import ListingError
from app.services.complaint_errors import ComplaintError
from app.services.complaint_service import ComplaintService
from app.services.listing_lifecycle import ListingLifecycleService
from app.services.listing_review import ListingReviewService
from app.utils.security import get_current_user
from .listing_http import listing_of, to_http
from .moderation_http import to_http as complaint_to_http
from .moderation_view import complaint_view

lifecycle_router = APIRouter()


def _changed(listing) -> SaleCarStatusChanged:
    return SaleCarStatusChanged(
        sale_car_id=listing.sale_car_id,
        status=listing.status,
        updated_at=listing.updated_at,
    )


async def _own_action(action, sale_car_id: str, db: AsyncSession, user: Users):
    service = ListingLifecycleService(db)
    try:
        await listing_of(service, sale_car_id, user)
        return _changed(await getattr(service, action)(sale_car_id))
    except ListingError as error:
        raise to_http(error)


@lifecycle_router.post("/{sale_car_id}/submit", response_model=SaleCarStatusChanged)
async def submit(
    sale_car_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: Users = Depends(get_current_user),
):
    return await _own_action("submit", sale_car_id, db, current_user)


@lifecycle_router.post("/{sale_car_id}/withdraw", response_model=SaleCarStatusChanged)
async def withdraw(
    sale_car_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: Users = Depends(get_current_user),
):
    return await _own_action("withdraw", sale_car_id, db, current_user)


@lifecycle_router.post("/{sale_car_id}/sold", response_model=SaleCarStatusChanged)
async def mark_sold(
    sale_car_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: Users = Depends(get_current_user),
):
    return await _own_action("mark_sold", sale_car_id, db, current_user)


@lifecycle_router.post("/{sale_car_id}/republish", response_model=SaleCarStatusChanged)
async def republish(
    sale_car_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: Users = Depends(get_current_user),
):
    return await _own_action("republish", sale_car_id, db, current_user)


@lifecycle_router.post("/{sale_car_id}/revise", response_model=SaleCarStatusChanged)
async def revise(
    sale_car_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: Users = Depends(get_current_user),
):
    return await _own_action("revise", sale_car_id, db, current_user)


@lifecycle_router.post("/{sale_car_id}/approve", response_model=SaleCarStatusChanged)
async def approve(
    sale_car_id: str,
    db: AsyncSession = Depends(get_db),
    moderator: Users = Depends(require_permission(Permission.EDIT_ANY_SALE_CAR)),
):
    try:
        return _changed(await ListingReviewService(db).approve(sale_car_id, str(moderator.id)))
    except ListingError as error:
        raise to_http(error)


@lifecycle_router.post("/{sale_car_id}/reject", response_model=SaleCarStatusChanged)
async def reject(
    sale_car_id: str,
    reason: RejectionReason,
    db: AsyncSession = Depends(get_db),
    moderator: Users = Depends(require_permission(Permission.EDIT_ANY_SALE_CAR)),
):
    """Turn a listing back. The label is required; the comment the seller reads is not."""
    try:
        turned_back = await ListingReviewService(db).reject(
            sale_car_id, reason.label.value, reason.comment, str(moderator.id)
        )
        return _changed(turned_back)
    except ListingError as error:
        raise to_http(error)


@lifecycle_router.post(
    "/{sale_car_id}/complaints", response_model=ComplaintResponse, status_code=201
)
async def complain(
    sale_car_id: str,
    complaint: ComplaintCreate,
    db: AsyncSession = Depends(get_db),
    current_user: Users = Depends(get_current_user),
):
    """Anyone signed in, once per listing. Only about a listing that is published."""
    try:
        recorded = await ComplaintService(db).complain(
            sale_car_id, str(current_user.id), complaint.reason.value, complaint.text
        )
    except ListingError as error:
        raise to_http(error)
    except ComplaintError as error:
        raise complaint_to_http(error)
    return complaint_view(recorded)
