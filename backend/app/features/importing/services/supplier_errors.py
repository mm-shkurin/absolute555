"""Отказы профиля поставщика, на языке предметной области, с кодом ответа."""

from app.core.exceptions import (
    BaseErrorApp,
    ConflictError,
    ResourceNotFoundError,
    ValidationError,
)


class SupplierError(BaseErrorApp):
    """База отказов импортного канала."""


class SupplierNotFound(SupplierError, ResourceNotFoundError):
    default_code = "SUPPLIER_NOT_FOUND"

    def __init__(self, user_id: str):
        super().__init__("Supplier profile not found")
        self.user_id = user_id


class ProfileIncomplete(SupplierError, ValidationError):
    default_code = "PROFILE_INCOMPLETE"

    def __init__(self, missing: list):
        super().__init__(
            "the profile is not complete enough to be reviewed",
            details={"missing_fields": missing},
        )
        self.missing = missing


class ProfileFrozen(SupplierError, ConflictError):
    default_code = "PROFILE_FROZEN"

    def __init__(self, current: str):
        super().__init__(
            f"a profile in {current} cannot be edited", details={"current_status": current}
        )
        self.current = current


class RejectionNeedsReason(SupplierError, ValidationError):
    default_code = "REJECTION_NEEDS_REASON"

    def __init__(self):
        super().__init__("a rejection without a reason gives the supplier nothing to fix")
