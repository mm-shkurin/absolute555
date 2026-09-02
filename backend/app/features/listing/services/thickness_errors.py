"""Отказы карты замеров, на языке предметной области."""

from app.features.listing.services.listing_errors import ListingError


class ValueOutOfRange(ListingError):
    def __init__(self, value_um: int):
        super().__init__("The reading is outside what a gauge shows")
        self.value_um = value_um


class MeasurementNotFound(ListingError):
    def __init__(self, panel: str):
        super().__init__("That panel has not been measured")
        self.panel = panel


class GaugeUnreadable(ListingError):
    def __init__(self, panel: str):
        super().__init__("The gauge reading could not be read from the photograph")
        self.panel = panel
