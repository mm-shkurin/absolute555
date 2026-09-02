"""Где отказы импортного канала становятся отказами HTTP."""

from app.core.exceptions import ConflictError, ResourceNotFoundError, ValidationError
from app.features.importing.services.supplier_errors import (
    ProfileFrozen,
    ProfileIncomplete,
    RejectionNeedsReason,
    SupplierNotFound,
)


def to_http(error: Exception):
    if isinstance(error, SupplierNotFound):
        return ResourceNotFoundError("Supplier profile not found", code="SUPPLIER_NOT_FOUND")

    if isinstance(error, ProfileIncomplete):
        return ValidationError(
            str(error), code="PROFILE_INCOMPLETE", details={"missing_fields": error.missing}
        )

    if isinstance(error, ProfileFrozen):
        return ConflictError(
            str(error), code="PROFILE_FROZEN", details={"current_status": error.current}
        )

    if isinstance(error, RejectionNeedsReason):
        return ValidationError(str(error), code="REJECTION_NEEDS_REASON")

    raise error
