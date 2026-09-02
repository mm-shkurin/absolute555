"""Где отказы заявок становятся отказами HTTP."""

from app.core.exceptions import BusinessRuleError, ConflictError, ResourceNotFoundError
from app.features.importing.services.request_errors import (
    RequestClosed,
    RequestLimitReached,
    RequestNotFound,
)


def to_http(error: Exception):
    if isinstance(error, RequestNotFound):
        return ResourceNotFoundError("Request not found", code="REQUEST_NOT_FOUND")

    if isinstance(error, RequestLimitReached):
        return BusinessRuleError(
            str(error), code="REQUEST_LIMIT_REACHED", details={"limit": error.limit}
        )

    if isinstance(error, RequestClosed):
        return ConflictError(str(error), code="REQUEST_CLOSED")

    raise error
