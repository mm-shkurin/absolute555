"""Отказы карты замеров, на языке предметной области."""

from app.core.exceptions import ResourceNotFoundError, ValidationError
from app.features.listing.services.listing_errors import ListingError


class ValueOutOfRange(ListingError, ValidationError):
    default_code = "VALUE_OUT_OF_RANGE"

    def __init__(self, value_um: int):
        super().__init__("The reading is outside what a gauge shows", details={"value_um": value_um})
        self.value_um = value_um


class MeasurementNotFound(ListingError, ResourceNotFoundError):
    default_code = "MEASUREMENT_NOT_FOUND"

    def __init__(self, panel: str):
        super().__init__("That panel has not been measured")
        self.panel = panel


class GaugeUnreadable(ListingError, ValidationError):
    default_code = "OCR_UNREADABLE"

    def __init__(self, panel: str):
        super().__init__(
            "The gauge reading could not be read from the photograph", details={"panel": panel}
        )
        self.panel = panel
