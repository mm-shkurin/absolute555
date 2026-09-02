"""Where complaint refusals become HTTP errors."""

from app.core.exceptions import BusinessRuleError, ConflictError, ResourceNotFoundError
from app.features.moderation.services.complaint_errors import (
    AlreadyComplained,
    ComplaintAlreadyHandled,
    ComplaintNotFound,
    ComplaintOnOwnListing,
)


def to_http(error: Exception):
    if isinstance(error, ComplaintNotFound):
        return ResourceNotFoundError(str(error), code="COMPLAINT_NOT_FOUND")

    if isinstance(error, AlreadyComplained):
        return ConflictError(str(error), code="ALREADY_COMPLAINED")

    if isinstance(error, ComplaintOnOwnListing):
        return ConflictError(str(error), code="COMPLAINT_ON_OWN_LISTING")

    if isinstance(error, ComplaintAlreadyHandled):
        return ConflictError(str(error), code="COMPLAINT_ALREADY_HANDLED")

    raise error
