"""Where review domain errors become HTTP errors."""

from app.core.exceptions import BusinessRuleError, ResourceNotFoundError, ValidationError
from app.features.review.services.review_errors import (
    DealNotClosed,
    DialogNotReviewable,
    EditWindowClosed,
    MalformedIdentifier,
    OfferNotReviewable,
    ReviewAlreadyWritten,
    ReviewNotFound,
    SellerNotFound,
)


# (domain error, HTTP error, code, details as (key, attribute) or None)
_MAPPING = (
    (OfferNotReviewable, ResourceNotFoundError, "OFFER_NOT_REVIEWABLE", None),
    (DialogNotReviewable, ResourceNotFoundError, "DIALOG_NOT_REVIEWABLE", None),
    (ReviewNotFound, ResourceNotFoundError, "REVIEW_NOT_FOUND", None),
    (SellerNotFound, ResourceNotFoundError, "SELLER_NOT_FOUND", None),
    (MalformedIdentifier, ValidationError, "MALFORMED_IDENTIFIER", ("field", "field")),
    (DealNotClosed, BusinessRuleError, "DEAL_NOT_CLOSED", ("current_status", "current")),
    # The identifier travels with the refusal so the screen moves to correcting the
    # review instead of offering to write a second one.
    (ReviewAlreadyWritten, BusinessRuleError, "REVIEW_ALREADY_WRITTEN", ("review_id", "review_id")),
    (EditWindowClosed, BusinessRuleError, "REVIEW_EDIT_WINDOW_CLOSED", ("hours", "hours")),
)


def to_http(error: Exception):
    for error_type, http_error, code, detail in _MAPPING:
        if isinstance(error, error_type):
            if detail is None:
                return http_error(str(error), code=code)
            key, attribute = detail
            return http_error(str(error), code=code, details={key: getattr(error, attribute)})
    raise error
