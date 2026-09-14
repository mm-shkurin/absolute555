"""Domain errors of an offer, each with the status and code that say it on the wire."""

from app.core.exceptions import (
    AuthorizationError,
    BaseErrorApp,
    BusinessRuleError,
    ResourceNotFoundError,
    ValidationError,
)


class OfferError(BaseErrorApp):
    """Base of every offer refusal."""


class OfferNotFound(OfferError, ResourceNotFoundError):
    default_code = "OFFER_NOT_FOUND"

    def __init__(self, offer_id: str = ""):
        super().__init__("Offer not found")
        self.offer_id = offer_id


class SaleCarNotFound(OfferError, ResourceNotFoundError):
    default_code = "LISTING_NOT_FOUND"

    def __init__(self, sale_car_id: str = ""):
        super().__init__("Sale car not found")
        self.sale_car_id = sale_car_id


class MalformedIdentifier(OfferError, ValidationError):
    default_code = "MALFORMED_IDENTIFIER"

    def __init__(self, field: str):
        super().__init__(f"{field} is not a well-formed identifier", details={"field": field})
        self.field = field


class OfferOnOwnCar(OfferError, BusinessRuleError):
    default_code = "OFFER_ON_OWN_CAR"

    def __init__(self):
        super().__init__("Cannot make an offer on your own car")


class DuplicatePendingOffer(OfferError, BusinessRuleError):
    default_code = "DUPLICATE_PENDING_OFFER"

    def __init__(self):
        super().__init__("You already have a pending offer for this car")


class NotCarOwner(OfferError, AuthorizationError):
    default_code = "NOT_CAR_OWNER"

    def __init__(self):
        super().__init__("Only the car owner can change an offer's status")


class NotOfferParty(OfferError, AuthorizationError):
    default_code = "NOT_OFFER_PARTY"

    def __init__(self):
        super().__init__("Access denied")


class OfferAlreadySettled(OfferError, BusinessRuleError):
    default_code = "OFFER_ALREADY_SETTLED"

    def __init__(self, current: str):
        super().__init__("Only a pending offer can be updated", details={"current_status": current})
        self.current = current


class NotOfferAuthor(OfferError, AuthorizationError):
    default_code = "NOT_OFFER_AUTHOR"

    def __init__(self):
        super().__init__("Only the buyer who made an offer can withdraw it")
