"""Where listing domain errors become HTTP.

The service layer states the refusal; this is the one place that decides which status
code says it. Keeping the mapping here is what lets the lifecycle service stay free of
fastapi imports.
"""

from fastapi import HTTPException

from app.models.sale_car import SaleCarStatus
from app.models.users import Users
from app.permissions.dependencies import can_manage_sale_car
from app.services.listing_errors import (
    ListingFrozen,
    ListingIncomplete,
    ListingNotFound,
    RejectionNeedsReason,
    TooManyDrafts,
    TransitionNotAllowed,
)

PUBLIC_STATUSES = frozenset({SaleCarStatus.PUBLISHED, SaleCarStatus.WITHDRAWN, SaleCarStatus.SOLD})


def to_http(error: Exception) -> HTTPException:
    if isinstance(error, ListingNotFound):
        return HTTPException(status_code=404, detail="Sale car not found")
    if isinstance(error, TransitionNotAllowed):
        return HTTPException(
            status_code=409,
            detail={
                "detail": str(error),
                "current_status": error.current,
                "allowed": error.allowed,
            },
        )
    if isinstance(error, ListingIncomplete):
        return HTTPException(
            status_code=422,
            detail={"detail": str(error), "missing_fields": error.missing},
        )
    if isinstance(error, ListingFrozen):
        return HTTPException(
            status_code=409,
            detail={"detail": str(error), "current_status": error.current, "allowed": []},
        )
    if isinstance(error, TooManyDrafts):
        return HTTPException(status_code=409, detail={"detail": str(error), "limit": error.limit})
    if isinstance(error, RejectionNeedsReason):
        return HTTPException(status_code=422, detail=str(error))
    return HTTPException(status_code=500, detail="Listing error")


async def listing_of(service, sale_car_id: str, user: Users):
    """The listing, if this caller is allowed to know it exists.

    A caller who may not manage the listing is told it is not there rather than that it
    is forbidden: 403 confirms the identifier is real, which is the whole of what a
    scraper walking identifiers wants to learn.
    """
    from app.services.listing_errors import ListingNotFound as _NotFound

    listing = await service.get(sale_car_id)
    if not await can_manage_sale_car(user, str(listing.user_id)):
        raise _NotFound(sale_car_id)
    return listing
