"""Where offer domain errors become HTTP errors."""

from app.core.exceptions import (
    AuthorizationError,
    BusinessRuleError,
    ResourceNotFoundError,
    ValidationError,
)
from app.services.offer_errors import (
    DuplicatePendingOffer,
    MalformedIdentifier,
    NotCarOwner,
    OfferAlreadySettled,
    OfferNotFound,
    OfferOnOwnCar,
    SaleCarNotFound,
)


def to_http(error: Exception):
    if isinstance(error, OfferNotFound):
        return ResourceNotFoundError(str(error), code="OFFER_NOT_FOUND")

    if isinstance(error, SaleCarNotFound):
        return ResourceNotFoundError(str(error), code="LISTING_NOT_FOUND")

    if isinstance(error, MalformedIdentifier):
        return ValidationError(str(error), code="MALFORMED_IDENTIFIER", details={"field": error.field})

    if isinstance(error, OfferOnOwnCar):
        return BusinessRuleError(str(error), code="OFFER_ON_OWN_CAR")

    if isinstance(error, DuplicatePendingOffer):
        return BusinessRuleError(str(error), code="DUPLICATE_PENDING_OFFER")

    if isinstance(error, NotCarOwner):
        return AuthorizationError(str(error), code="NOT_CAR_OWNER")

    if isinstance(error, OfferAlreadySettled):
        return BusinessRuleError(
            str(error), code="OFFER_ALREADY_SETTLED", details={"current_status": error.current}
        )

    raise error
