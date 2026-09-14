"""Listings: creating a draft, filling it in, reading it back.

The transitions between statuses live next door in sale_car_lifecycle.py; this module
never writes `status`.
"""

from typing import List, Optional

from fastapi import APIRouter, Depends, status
from app.features.listing.deps import get_listing_feed_service
from app.features.listing.deps import get_listing_lifecycle_service
from app.features.listing.deps import get_sale_car_service
from app.features.listing.services.listing_lifecycle import ListingLifecycleService
from app.features.listing.services.listing_records import SaleCarService

from app.core.exceptions import AuthorizationError, ResourceNotFoundError, ValidationError
from app.features.listing.deps import get_listing_lifecycle_service, get_sale_car_service
from app.features.listing.statuses import ListingKind, SaleCarStatus
from app.permissions.dependencies import has_permission
from app.permissions.ownership import can_manage_sale_car
from app.permissions.permissions import Permission
from app.features.listing.schemas.feed import FeedPage, FeedQuery, PhoneRevealed
from app.features.listing.schemas.sale_cars import DraftKind, SaleCarResponse, SaleCarUpdate
from app.features.listing.services.listing_feed import ListingFeedService
from app.utils.security import get_current_user, get_current_user_or_none

from .sale_car_feed_query import feed_query
from app.features.listing.services.listing_access_service import PUBLIC_STATUSES, listing_of, visible_listing
from .sale_car_document import document_router
from .sale_car_lifecycle import lifecycle_router
from .sale_car_photos import photos_router
from .sale_car_thickness import thickness_router
from .sale_car_vin import vin_router
from app.shared.http.sale_car_view import to_card, to_view, to_views

sale_car_router = APIRouter()


@sale_car_router.post("", response_model=SaleCarResponse, status_code=status.HTTP_201_CREATED)
async def create_draft(
    kind: DraftKind = DraftKind(),
    listing_lifecycle_service: ListingLifecycleService = Depends(get_listing_lifecycle_service),
    current_user=Depends(get_current_user),
):
    if kind.listing_kind == ListingKind.IMPORT and not await has_permission(
        current_user.role, Permission.MANAGE_SUPPLIER_PROFILE
    ):
        # Объявление под привоз обещает покупателю доставку. Обещать её может тот, чью
        # заявку на роль поставщика одобрил модератор, а не любой продавец.
        raise AuthorizationError("Not an importer", code="NOT_AN_IMPORTER")

    draft = await listing_lifecycle_service.create_draft(
        str(current_user.id), kind.listing_kind.value
    )
    return await to_view(draft, current_user)


@sale_car_router.get("/list", response_model=FeedPage)
async def list_sale_cars(
    query: FeedQuery = Depends(feed_query),
    listing_feed_service: ListingFeedService = Depends(get_listing_feed_service),
):
    """The feed, open to a reader who has not signed in.

    Answers an object rather than an array: without the total the screen can show
    neither its count nor its pages, and a second request to count would answer about a
    different moment than the page it labels.
    """
    listings, total = await listing_feed_service.page(query)
    return {
        "items": [to_card(listing) for listing in listings],
        "total": total,
        "page": query.page,
        "size": query.size,
    }


@sale_car_router.get("/user", response_model=List[SaleCarResponse])
async def list_my_sale_cars(
    status: Optional[SaleCarStatus] = None,
    sale_car_service: SaleCarService = Depends(get_sale_car_service),
    current_user=Depends(get_current_user),
):
    cars = await sale_car_service.get_sale_cars_by_user(str(current_user.id), status=status)
    return await to_views(cars, current_user)


@sale_car_router.get("/{sale_car_id}", response_model=SaleCarResponse)
async def get_sale_car_by_id(
    sale_car_id: str,
    listing_lifecycle_service: ListingLifecycleService = Depends(get_listing_lifecycle_service),
    current_user=Depends(get_current_user_or_none),
):
    listing = await visible_listing(listing_lifecycle_service, sale_car_id, current_user)
    return await to_view(listing, current_user)


@sale_car_router.patch("/{sale_car_id}", response_model=SaleCarResponse)
async def update_sale_car(
    sale_car_id: str,
    sale_car_update: SaleCarUpdate,
    listing_lifecycle_service: ListingLifecycleService = Depends(get_listing_lifecycle_service),
    current_user=Depends(get_current_user),
):
    fields = sale_car_update.model_dump(exclude_unset=True)
    if not fields:
        raise ValidationError("No data to update", code="EMPTY_PATCH")

    await listing_of(listing_lifecycle_service, sale_car_id, current_user)
    updated = await listing_lifecycle_service.edit(sale_car_id, fields)
    return await to_view(updated, current_user)


@sale_car_router.post("/{sale_car_id}/reveal-phone", response_model=PhoneRevealed)
async def reveal_phone(
    sale_car_id: str,
    listing_lifecycle_service: ListingLifecycleService = Depends(get_listing_lifecycle_service),
    current_user=Depends(get_current_user),
):
    """The seller's number, on request and only to someone signed in.

    A field in the listing payload would hand every number on the platform to one pass
    of a scraper, and the button on the card would then be decoration.
    """
    listing = await listing_lifecycle_service.get(sale_car_id)

    if listing.status not in PUBLIC_STATUSES or not listing.phone_number:
        # A listing nobody may see and a listing with no number are one answer: the
        # other would confirm which listings exist to whoever walks identifiers.
        raise ResourceNotFoundError("Sale car not found", code="LISTING_NOT_FOUND")

    return {"phone_number": listing.phone_number}


@sale_car_router.delete("/{sale_car_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_sale_car(
    sale_car_id: str,
    sale_car_service: SaleCarService = Depends(get_sale_car_service),
    current_user=Depends(get_current_user),
):
    car = await sale_car_service.get_sale_car_by_id(sale_car_id)
    if not car:
        raise ResourceNotFoundError("Sale car not found", code="LISTING_NOT_FOUND")
    if not await can_manage_sale_car(current_user, str(car.user_id)):
        raise AuthorizationError("Access denied", code="NOT_LISTING_OWNER")

    await sale_car_service.delete_sale_car(sale_car_id)
    return None


sale_car_router.include_router(lifecycle_router)
sale_car_router.include_router(photos_router)
sale_car_router.include_router(document_router)
sale_car_router.include_router(thickness_router)
sale_car_router.include_router(vin_router)
