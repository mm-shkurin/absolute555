"""Where listing domain errors become HTTP errors.

The service layer states the refusal; this is the one place that decides which status
and which machine code says it. Keeping the mapping here is what lets the lifecycle
service stay free of fastapi imports.
"""

from app.core.exceptions import (
    BusinessRuleError,
    ConflictError,
    PayloadTooLarge,
    ResourceNotFoundError,
    ValidationError,
)
from app.features.listing.models.sale_car import SaleCarStatus
from app.features.account.models.users import Users
from app.permissions.ownership import can_manage_sale_car
from app.features.listing.services.listing_errors import (
    ListingFrozen,
    ListingIncomplete,
    ListingNotFound,
    RejectionNeedsReason,
    TooManyDrafts,
    TransitionNotAllowed,
)
from app.features.listing.services.photo_errors import (
    DocumentNotFound,
    GalleryLimitReached,
    NoFilesGiven,
    NotAnImage,
    OrderMismatch,
    PhotoNotFound,
    PhotoTooLarge,
)

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

    if isinstance(error, PhotoTooLarge):
        return PayloadTooLarge(
            str(error),
            code="PHOTO_TOO_LARGE",
            details={"limit_bytes": error.limit, "size_bytes": error.size},
        )

    if isinstance(error, NotAnImage):
        return ValidationError(str(error), code="NOT_AN_IMAGE", details={"filename": error.filename})

    if isinstance(error, GalleryLimitReached):
        return ConflictError(
            str(error),
            code="GALLERY_LIMIT_REACHED",
            details={"limit": error.limit, "current": error.held, "offered": error.offered},
        )

    if isinstance(error, NoFilesGiven):
        return ValidationError(str(error), code="NO_FILES_GIVEN")

    if isinstance(error, PhotoNotFound):
        return ResourceNotFoundError(str(error), code="PHOTO_NOT_FOUND")

    if isinstance(error, OrderMismatch):
        return ValidationError(
            str(error),
            code="ORDER_MISMATCH",
            details={"missing": error.missing, "unknown": error.unknown},
        )

    if isinstance(error, DocumentNotFound):
        # Indistinguishable from a listing that never existed, on purpose.
        return ResourceNotFoundError("Sale car not found", code="LISTING_NOT_FOUND")

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
