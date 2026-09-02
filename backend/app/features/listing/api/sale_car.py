"""Listings: creating a draft, filling it in, reading it back.

The transitions between statuses live next door in sale_car_lifecycle.py; this module
never writes `status`.
"""

from typing import List, Optional

from fastapi import APIRouter, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.exceptions import AuthorizationError, ResourceNotFoundError, ValidationError
from app.db.database import get_db
from app.features.listing.statuses import SaleCarStatus
from app.permissions.ownership import can_manage_sale_car
from app.features.listing.schemas.feed import FeedPage, FeedQuery, PhoneRevealed
from app.features.listing.schemas.sale_cars import SaleCarResponse, SaleCarUpdate
from app.features.listing.services.listing_errors import ListingError
from app.features.listing.services.listing_feed import ListingFeedService
from app.features.listing.services.listing_lifecycle import ListingLifecycleService
from app.features.listing.services.sale_cars_service import SaleCarService
from app.utils.security import get_current_user, get_current_user_or_none

from .feed_query import feed_query
from .listing_http import PUBLIC_STATUSES, listing_of, to_http
from .sale_car_document import document_router
from .sale_car_lifecycle import lifecycle_router
from .sale_car_photos import photos_router
from .sale_car_thickness import thickness_router
from .sale_car_view import to_card, to_view, to_views

sale_car_router = APIRouter()


@sale_car_router.post("", response_model=SaleCarResponse, status_code=status.HTTP_201_CREATED)
async def create_draft(
    db: AsyncSession = Depends(get_db),
    current_user=Depends(get_current_user),
):
    try:
        draft = await ListingLifecycleService(db).create_draft(str(current_user.id))
    except ListingError as error:
        raise to_http(error)
    return await to_view(draft, current_user)


@sale_car_router.get("/list", response_model=FeedPage)
async def list_sale_cars(
    query: FeedQuery = Depends(feed_query),
    db: AsyncSession = Depends(get_db),
):
    """The feed, open to a reader who has not signed in.

    Answers an object rather than an array: without the total the screen can show
    neither its count nor its pages, and a second request to count would answer about a
    different moment than the page it labels.
    """
    listings, total = await ListingFeedService(db).page(query)
    return {
        "items": [to_card(listing) for listing in listings],
        "total": total,
        "page": query.page,
        "size": query.size,
    }


@sale_car_router.get("/user", response_model=List[SaleCarResponse])
async def list_my_sale_cars(
    status: Optional[SaleCarStatus] = None,
    db: AsyncSession = Depends(get_db),
    current_user=Depends(get_current_user),
):
    service = SaleCarService(db)
    cars = await service.get_sale_cars_by_user(str(current_user.id), status=status)
    return await to_views(cars, current_user)


@sale_car_router.get("/{sale_car_id}", response_model=SaleCarResponse)
async def get_sale_car_by_id(
    sale_car_id: str,
    db: AsyncSession = Depends(get_db),
    current_user=Depends(get_current_user_or_none),
):
    service = ListingLifecycleService(db)
    try:
        listing = await service.get(sale_car_id)
    except ListingError as error:
        raise to_http(error)

    if listing.status not in PUBLIC_STATUSES:
        owner = current_user is not None and await can_manage_sale_car(
            current_user, str(listing.user_id)
        )
        if not owner:
            raise ResourceNotFoundError("Sale car not found", code="LISTING_NOT_FOUND")

    return await to_view(listing, current_user)


@sale_car_router.patch("/{sale_car_id}", response_model=SaleCarResponse)
async def update_sale_car(
    sale_car_id: str,
    sale_car_update: SaleCarUpdate,
    db: AsyncSession = Depends(get_db),
    current_user=Depends(get_current_user),
):
    service = ListingLifecycleService(db)
    fields = sale_car_update.model_dump(exclude_unset=True)
    if not fields:
        raise ValidationError("No data to update", code="EMPTY_PATCH")

    try:
        await listing_of(service, sale_car_id, current_user)
        updated = await service.edit(sale_car_id, fields)
    except ListingError as error:
        raise to_http(error)
    return await to_view(updated, current_user)


@sale_car_router.post("/{sale_car_id}/reveal-phone", response_model=PhoneRevealed)
async def reveal_phone(
    sale_car_id: str,
    db: AsyncSession = Depends(get_db),
    current_user=Depends(get_current_user),
):
    """The seller's number, on request and only to someone signed in.

    A field in the listing payload would hand every number on the platform to one pass
    of a scraper, and the button on the card would then be decoration.
    """
    try:
        listing = await ListingLifecycleService(db).get(sale_car_id)
    except ListingError as error:
        raise to_http(error)

    if listing.status not in PUBLIC_STATUSES or not listing.phone_number:
        # A listing nobody may see and a listing with no number are one answer: the
        # other would confirm which listings exist to whoever walks identifiers.
        raise ResourceNotFoundError("Sale car not found", code="LISTING_NOT_FOUND")

    return {"phone_number": listing.phone_number}


@sale_car_router.delete("/{sale_car_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_sale_car(
    sale_car_id: str,
    db: AsyncSession = Depends(get_db),
    current_user=Depends(get_current_user),
):
    service = SaleCarService(db)
    car = await service.get_sale_car_by_id(sale_car_id)
    if not car:
        raise ResourceNotFoundError("Sale car not found", code="LISTING_NOT_FOUND")
    if not await can_manage_sale_car(current_user, str(car.user_id)):
        raise AuthorizationError("Access denied", code="NOT_LISTING_OWNER")

    await service.delete_sale_car(sale_car_id)
    return None


sale_car_router.include_router(lifecycle_router)
sale_car_router.include_router(photos_router)
sale_car_router.include_router(document_router)
sale_car_router.include_router(thickness_router)
