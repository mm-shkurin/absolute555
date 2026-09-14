"""Где отказы импортного канала становятся отказами HTTP."""

from app.core.exceptions import ConflictError, ResourceNotFoundError, ValidationError
from app.features.importing.services import supplier_errors as errors


def to_http(error: Exception):
    if isinstance(error, errors.SupplierNotFound):
        return ResourceNotFoundError("Supplier profile not found", code="SUPPLIER_NOT_FOUND")

    if isinstance(error, errors.ProfileIncomplete):
        return ValidationError(
            str(error), code="PROFILE_INCOMPLETE", details={"missing_fields": error.missing}
        )

    if isinstance(error, errors.ProfileFrozen):
        return ConflictError(
            str(error), code="PROFILE_FROZEN", details={"current_status": error.current}
        )

    if isinstance(error, errors.RejectionNeedsReason):
        return ValidationError(str(error), code="REJECTION_NEEDS_REASON")

    raise error
