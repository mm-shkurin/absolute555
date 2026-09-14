"""Domain errors of a listing's gallery."""

from app.core.exceptions import (
    ConflictError,
    PayloadTooLarge,
    ResourceNotFoundError,
    ValidationError,
)
from app.features.listing.services.listing_errors import NOT_FOUND_MESSAGE, ListingError


class PhotoTooLarge(ListingError, PayloadTooLarge):
    default_code = "PHOTO_TOO_LARGE"

    def __init__(self, limit: int, size: int):
        super().__init__(
            "The photograph is larger than the limit",
            details={"limit_bytes": limit, "size_bytes": size},
        )
        self.limit = limit
        self.size = size


class NotAnImage(ListingError, ValidationError):
    default_code = "NOT_AN_IMAGE"

    def __init__(self, filename: str = ""):
        super().__init__("The file is not an image", details={"filename": filename})
        self.filename = filename


class GalleryLimitReached(ListingError, ConflictError):
    default_code = "GALLERY_LIMIT_REACHED"

    def __init__(self, limit: int, held: int, offered: int):
        super().__init__(
            "The gallery cannot hold that many photographs",
            details={"limit": limit, "current": held, "offered": offered},
        )
        self.limit = limit
        self.held = held
        self.offered = offered


class NoFilesGiven(ListingError, ValidationError):
    default_code = "NO_FILES_GIVEN"

    def __init__(self):
        super().__init__("The upload carries no files")


class PhotoNotFound(ListingError, ResourceNotFoundError):
    default_code = "PHOTO_NOT_FOUND"

    def __init__(self, photo_id: str):
        super().__init__("Photograph not found")
        self.photo_id = photo_id


class OrderMismatch(ListingError, ValidationError):
    default_code = "ORDER_MISMATCH"

    def __init__(self, missing: list, unknown: list):
        super().__init__(
            "The order does not match the photographs held",
            details={"missing": missing, "unknown": unknown},
        )
        self.missing = missing
        self.unknown = unknown


class DocumentNotFound(ListingError, ResourceNotFoundError):
    """Indistinguishable on the wire from a listing that never existed, on purpose."""

    default_code = "LISTING_NOT_FOUND"

    def __init__(self):
        super().__init__(NOT_FOUND_MESSAGE)
