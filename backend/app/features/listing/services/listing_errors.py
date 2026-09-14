"""Domain errors of the listing lifecycle, each with the status and code that say it."""

from app.core.exceptions import (
    BaseErrorApp,
    BusinessRuleError,
    ConflictError,
    ResourceNotFoundError,
    ValidationError,
)

NOT_FOUND_MESSAGE = "Sale car not found"


class ListingError(BaseErrorApp):
    """Base of every lifecycle refusal."""


class ListingNotFound(ListingError, ResourceNotFoundError):
    default_code = "LISTING_NOT_FOUND"

    def __init__(self, listing_id: str):
        super().__init__(NOT_FOUND_MESSAGE)
        self.listing_id = listing_id


class TransitionNotAllowed(ListingError, ConflictError):
    default_code = "TRANSITION_NOT_ALLOWED"

    def __init__(self, current: str, allowed: list[str]):
        super().__init__(
            f"a listing in {current} cannot move there",
            details={"current_status": current, "allowed": allowed},
        )
        self.current = current
        self.allowed = allowed


class ListingIncomplete(ListingError, ValidationError):
    default_code = "LISTING_INCOMPLETE"

    def __init__(self, missing: list[str]):
        super().__init__(
            "the listing is not complete enough to be reviewed",
            details={"missing_fields": missing},
        )
        self.missing = missing


class ListingFrozen(ListingError, ConflictError):
    default_code = "LISTING_FROZEN"

    def __init__(self, current: str):
        super().__init__(
            f"a listing in {current} cannot be edited",
            details={"current_status": current, "allowed": []},
        )
        self.current = current


class TooManyDrafts(ListingError, BusinessRuleError):
    default_code = "DRAFT_LIMIT_REACHED"

    def __init__(self, limit: int):
        super().__init__(f"no more than {limit} drafts at a time", details={"limit": limit})
        self.limit = limit


class RejectionNeedsReason(ListingError, ValidationError):
    default_code = "REJECTION_NEEDS_REASON"

    def __init__(self):
        super().__init__("a rejection without a reason gives the seller nothing to fix")


class VinMalformed(ListingError, ValidationError):
    default_code = "VIN_MALFORMED"

    def __init__(self, vin: str):
        super().__init__(
            "this is not a VIN: seventeen characters of ISO 3779, no I, O or Q",
            details={"vin": vin},
        )
        self.vin = vin
