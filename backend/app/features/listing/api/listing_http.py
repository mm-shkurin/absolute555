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
from app.features.listing.statuses import SaleCarStatus
from app.permissions.ownership import can_manage_sale_car
from app.features.listing.services.listing_lifecycle import ListingLifecycleService
from app.features.listing.services.listing_errors import (
    ListingError,
    ListingFrozen,
    ListingIncomplete,
    ListingNotFound,
    RejectionNeedsReason,
    TooManyDrafts,
    TransitionNotAllowed,
    VinMalformed,
)
from app.features.listing.services.thickness_errors import (
    GaugeUnreadable,
    MeasurementNotFound,
    ValueOutOfRange,
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


_NOT_FOUND = "Sale car not found"

# Checked in order; the first class the error is an instance of decides.
_TRANSLATIONS = (
    (ListingNotFound, lambda e: ResourceNotFoundError(_NOT_FOUND, code="LISTING_NOT_FOUND")),
    (TransitionNotAllowed, lambda e: ConflictError(
        str(e), code="TRANSITION_NOT_ALLOWED",
        details={"current_status": e.current, "allowed": e.allowed},
    )),
    (ListingFrozen, lambda e: ConflictError(
        str(e), code="LISTING_FROZEN", details={"current_status": e.current, "allowed": []},
    )),
    (TooManyDrafts, lambda e: BusinessRuleError(
        str(e), code="DRAFT_LIMIT_REACHED", details={"limit": e.limit},
    )),
    (ListingIncomplete, lambda e: ValidationError(
        str(e), code="LISTING_INCOMPLETE", details={"missing_fields": e.missing},
    )),
    (VinMalformed, lambda e: ValidationError(str(e), code="VIN_MALFORMED", details={"vin": e.vin})),
    (RejectionNeedsReason, lambda e: ValidationError(str(e), code="REJECTION_NEEDS_REASON")),
    (PhotoTooLarge, lambda e: PayloadTooLarge(
        str(e), code="PHOTO_TOO_LARGE", details={"limit_bytes": e.limit, "size_bytes": e.size},
    )),
    (NotAnImage, lambda e: ValidationError(
        str(e), code="NOT_AN_IMAGE", details={"filename": e.filename},
    )),
    (GalleryLimitReached, lambda e: ConflictError(
        str(e), code="GALLERY_LIMIT_REACHED",
        details={"limit": e.limit, "current": e.held, "offered": e.offered},
    )),
    (NoFilesGiven, lambda e: ValidationError(str(e), code="NO_FILES_GIVEN")),
    (PhotoNotFound, lambda e: ResourceNotFoundError(str(e), code="PHOTO_NOT_FOUND")),
    (OrderMismatch, lambda e: ValidationError(
        str(e), code="ORDER_MISMATCH", details={"missing": e.missing, "unknown": e.unknown},
    )),
    (ValueOutOfRange, lambda e: ValidationError(
        str(e), code="VALUE_OUT_OF_RANGE", details={"value_um": e.value_um},
    )),
    (GaugeUnreadable, lambda e: ValidationError(
        str(e), code="OCR_UNREADABLE", details={"panel": e.panel},
    )),
    (MeasurementNotFound, lambda e: ResourceNotFoundError(str(e), code="MEASUREMENT_NOT_FOUND")),
    # Indistinguishable from a listing that never existed, on purpose.
    (DocumentNotFound, lambda e: ResourceNotFoundError(_NOT_FOUND, code="LISTING_NOT_FOUND")),
)


def to_http(error: Exception):
    """The custom error that says this refusal on the wire."""
    for kind, translate in _TRANSLATIONS:
        if isinstance(error, kind):
            return translate(error)
    raise error


async def listing_of(service, sale_car_id: str, user):
    """The listing, if this caller is allowed to know it exists.

    A caller who may not manage the listing is told it is not there rather than that it
    is forbidden: 403 confirms the identifier is real, which is the whole of what a
    scraper walking identifiers wants to learn.
    """
    listing = await service.get(sale_car_id)
    if not await can_manage_sale_car(user, str(listing.user_id)):
        raise ListingNotFound(sale_car_id)
    return listing


async def owned_listing(db, sale_car_id: str, user):
    """`listing_of` for a router that has nothing else to translate."""
    try:
        return await listing_of(ListingLifecycleService(db), sale_car_id, user)
    except ListingError as error:
        raise to_http(error)


async def visible_listing(db, sale_car_id: str, user):
    """The listing, if this reader may see it: public, or managed by the reader."""
    try:
        listing = await ListingLifecycleService(db).get(sale_car_id)
        if listing.status not in PUBLIC_STATUSES and not (
            user is not None and await can_manage_sale_car(user, str(listing.user_id))
        ):
            raise ListingNotFound(sale_car_id)
    except ListingError as error:
        raise to_http(error)
    return listing
