"""Where offer domain errors become HTTP errors."""

from app.core.exceptions import (
    AuthorizationError,
    BusinessRuleError,
    ResourceNotFoundError,
    ValidationError,
)
from app.features.offer.services import offer_errors as errors


def to_http(error: Exception):
    if isinstance(error, errors.OfferNotFound):
        return ResourceNotFoundError(str(error), code="OFFER_NOT_FOUND")

    if isinstance(error, errors.SaleCarNotFound):
        return ResourceNotFoundError(str(error), code="LISTING_NOT_FOUND")

    if isinstance(error, errors.MalformedIdentifier):
        return ValidationError(str(error), code="MALFORMED_IDENTIFIER", details={"field": error.field})

    if isinstance(error, errors.OfferOnOwnCar):
        return BusinessRuleError(str(error), code="OFFER_ON_OWN_CAR")

    if isinstance(error, errors.DuplicatePendingOffer):
        return BusinessRuleError(str(error), code="DUPLICATE_PENDING_OFFER")

    if isinstance(error, errors.NotOfferAuthor):
        return AuthorizationError(str(error), code="NOT_OFFER_AUTHOR")

    if isinstance(error, errors.NotCarOwner):
        return AuthorizationError(str(error), code="NOT_CAR_OWNER")

    if isinstance(error, errors.OfferAlreadySettled):
        return BusinessRuleError(
            str(error), code="OFFER_ALREADY_SETTLED", details={"current_status": error.current}
        )

    raise error
