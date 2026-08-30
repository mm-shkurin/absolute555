"""Domain errors of a listing's gallery."""

from app.services.listing_errors import ListingError


class PhotoTooLarge(ListingError):
    def __init__(self, limit: int, size: int):
        super().__init__("The photograph is larger than the limit")
        self.limit = limit
        self.size = size


class NotAnImage(ListingError):
    def __init__(self, filename: str = ""):
        super().__init__("The file is not an image")
        self.filename = filename


class GalleryLimitReached(ListingError):
    def __init__(self, limit: int, held: int, offered: int):
        super().__init__("The gallery cannot hold that many photographs")
        self.limit = limit
        self.held = held
        self.offered = offered


class NoFilesGiven(ListingError):
    def __init__(self):
        super().__init__("The upload carries no files")


class PhotoNotFound(ListingError):
    def __init__(self, photo_id: str):
        super().__init__("Photograph not found")
        self.photo_id = photo_id


class OrderMismatch(ListingError):
    def __init__(self, missing: list, unknown: list):
        super().__init__("The order does not match the photographs held")
        self.missing = missing
        self.unknown = unknown


class DocumentNotFound(ListingError):
    def __init__(self):
        super().__init__("No registration document is stored for this listing")
