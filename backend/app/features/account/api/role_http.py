"""Где отказы по заявкам на роль становятся ответами HTTP."""

from app.core.exceptions import (
    AuthorizationError,
    BusinessRuleError,
    ResourceNotFoundError,
    ValidationError,
)
from app.features.account.services.role_errors import (
    CannotGrantRole,
    DuplicateLiveRequest,
    RejectionWithoutReason,
    RequestAlreadyDecided,
    RoleAlreadyHeld,
    RoleRequestNotFound,
)


def to_http(error: Exception):
    if isinstance(error, RoleRequestNotFound):
        return ResourceNotFoundError(str(error), code="ROLE_REQUEST_NOT_FOUND")

    if isinstance(error, DuplicateLiveRequest):
        return BusinessRuleError(str(error), code="DUPLICATE_ROLE_REQUEST")

    if isinstance(error, RoleAlreadyHeld):
        return BusinessRuleError(str(error), code="ROLE_ALREADY_HELD")

    if isinstance(error, RequestAlreadyDecided):
        return BusinessRuleError(
            str(error), code="ROLE_REQUEST_DECIDED", details={"current_status": error.current}
        )

    if isinstance(error, RejectionWithoutReason):
        return ValidationError(
            str(error), code="REJECTION_WITHOUT_REASON", details={"field": "review_comment"}
        )

    if isinstance(error, CannotGrantRole):
        return AuthorizationError(str(error), code="ROLE_ABOVE_REVIEWER")

    raise error
