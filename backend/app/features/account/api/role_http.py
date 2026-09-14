"""Где отказы по заявкам на роль становятся ответами HTTP."""

from app.core.exceptions import (
    AuthorizationError,
    BusinessRuleError,
    ResourceNotFoundError,
    ValidationError,
)
from app.features.account.services import role_errors as errors


def to_http(error: Exception):
    if isinstance(error, errors.RoleRequestNotFound):
        return ResourceNotFoundError(str(error), code="ROLE_REQUEST_NOT_FOUND")

    if isinstance(error, errors.UserNotFound):
        return ResourceNotFoundError(str(error), code="USER_NOT_FOUND")

    if isinstance(error, errors.DuplicateLiveRequest):
        return BusinessRuleError(str(error), code="DUPLICATE_ROLE_REQUEST")

    if isinstance(error, errors.RoleAlreadyHeld):
        return BusinessRuleError(str(error), code="ROLE_ALREADY_HELD")

    if isinstance(error, errors.RequestAlreadyDecided):
        return BusinessRuleError(
            str(error), code="ROLE_REQUEST_DECIDED", details={"current_status": error.current}
        )

    if isinstance(error, errors.RejectionWithoutReason):
        return ValidationError(
            str(error), code="REJECTION_WITHOUT_REASON", details={"field": "review_comment"}
        )

    if isinstance(error, errors.CannotGrantRole):
        return AuthorizationError(str(error), code="ROLE_ABOVE_REVIEWER")

    raise error
