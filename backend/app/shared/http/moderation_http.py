"""Where complaint refusals become HTTP errors."""

from app.core.exceptions import ConflictError, ResourceNotFoundError
from app.features.moderation.services import complaint_errors as errors


def to_http(error: Exception):
    if isinstance(error, errors.ComplaintNotFound):
        return ResourceNotFoundError(str(error), code="COMPLAINT_NOT_FOUND")

    if isinstance(error, errors.AlreadyComplained):
        return ConflictError(str(error), code="ALREADY_COMPLAINED")

    if isinstance(error, errors.ComplaintOnOwnListing):
        return ConflictError(str(error), code="COMPLAINT_ON_OWN_LISTING")

    if isinstance(error, errors.ComplaintAlreadyHandled):
        return ConflictError(str(error), code="COMPLAINT_ALREADY_HANDLED")

    raise error
