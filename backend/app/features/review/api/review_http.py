"""Where review domain errors become HTTP errors."""

from app.core.exceptions import BusinessRuleError, ResourceNotFoundError, ValidationError
from app.features.review.services.review_errors import (
    DealNotClosed,
    EditWindowClosed,
    MalformedIdentifier,
    OfferNotReviewable,
    ReviewAlreadyWritten,
    ReviewNotFound,
    SellerNotFound,
)


def to_http(error: Exception):
    if isinstance(error, OfferNotReviewable):
        return ResourceNotFoundError(str(error), code="OFFER_NOT_REVIEWABLE")

    if isinstance(error, ReviewNotFound):
        return ResourceNotFoundError(str(error), code="REVIEW_NOT_FOUND")

    if isinstance(error, SellerNotFound):
        return ResourceNotFoundError(str(error), code="SELLER_NOT_FOUND")

    if isinstance(error, MalformedIdentifier):
        return ValidationError(
            str(error), code="MALFORMED_IDENTIFIER", details={"field": error.field}
        )

    if isinstance(error, DealNotClosed):
        return BusinessRuleError(
            str(error), code="DEAL_NOT_CLOSED", details={"current_status": error.current}
        )

    if isinstance(error, ReviewAlreadyWritten):
        # The identifier travels with the refusal so the screen moves to correcting the
        # review instead of offering to write a second one.
        return BusinessRuleError(
            str(error), code="REVIEW_ALREADY_WRITTEN", details={"review_id": error.review_id}
        )

    if isinstance(error, EditWindowClosed):
        return BusinessRuleError(
            str(error), code="REVIEW_EDIT_WINDOW_CLOSED", details={"hours": error.hours}
        )

    raise error
