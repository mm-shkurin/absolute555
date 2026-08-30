"""Where listing domain errors become HTTP errors.

The service layer states the refusal; this is the one place that decides which status
and which machine code says it. Keeping the mapping here is what lets the lifecycle
service stay free of fastapi imports.
"""

from app.core.exceptions import (
    AuthorizationError,
    BusinessRuleError,
    ConflictError,
    ResourceNotFoundError,
    ValidationError,
)
from app.models.sale_car import SaleCarStatus
from app.models.users import Users
from app.permissions.ownership import can_manage_sale_car
from app.services.listing_errors import (
    ListingFrozen,
    ListingIncomplete,
    ListingNotFound,
    RejectionNeedsReason,
    TooManyDrafts,
    TransitionNotAllowed,
)
from app.services.listing_photos import PhotoNotReadable

PUBLIC_STATUSES = frozenset({SaleCarStatus.PUBLISHED, SaleCarStatus.WITHDRAWN, SaleCarStatus.SOLD})


def to_http(error: Exception):
    """The custom error that says this refusal on the wire."""
    if isinstance(error, ListingNotFound):
        return ResourceNotFoundError("Sale car not found", code="LISTING_NOT_FOUND")

    if isinstance(error, TransitionNotAllowed):
        return ConflictError(
            str(error),
            code="TRANSITION_NOT_ALLOWED",
            details={"current_status": error.current, "allowed": error.allowed},
        )

    if isinstance(error, ListingFrozen):
        return ConflictError(
            str(error),
            code="LISTING_FROZEN",
            details={"current_status": error.current, "allowed": []},
        )

    if isinstance(error, TooManyDrafts):
        return BusinessRuleError(
            str(error), code="DRAFT_LIMIT_REACHED", details={"limit": error.limit}
        )

    if isinstance(error, ListingIncomplete):
        return ValidationError(
            str(error), code="LISTING_INCOMPLETE", details={"missing_fields": error.missing}
        )

    if isinstance(error, RejectionNeedsReason):
        return ValidationError(str(error), code="REJECTION_NEEDS_REASON")

    if isinstance(error, PhotoNotReadable):
        return ValidationError(str(error), code="PHOTO_NOT_READABLE")

    raise error


async def listing_of(service, sale_car_id: str, user: Users):
    """The listing, if this caller is allowed to know it exists.

    A caller who may not manage the listing is told it is not there rather than that it
    is forbidden: 403 confirms the identifier is real, which is the whole of what a
    scraper walking identifiers wants to learn.
    """
    listing = await service.get(sale_car_id)
    if not await can_manage_sale_car(user, str(listing.user_id)):
        raise ListingNotFound(sale_car_id)
    return listing
