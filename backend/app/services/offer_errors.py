"""Domain errors of an offer.

Offer service used to raise HTTPException directly, which put the wire protocol inside
the business rules -- the violation `.claude/rules/coding-rules.md` names by file. The
service states the refusal here; app/api/offer_http.py decides the status code.
"""


class OfferError(Exception):
    """Base of every offer refusal."""


class OfferNotFound(OfferError):
    def __init__(self, offer_id: str = ""):
        super().__init__("Offer not found")
        self.offer_id = offer_id


class SaleCarNotFound(OfferError):
    def __init__(self, sale_car_id: str = ""):
        super().__init__("Sale car not found")
        self.sale_car_id = sale_car_id


class MalformedIdentifier(OfferError):
    def __init__(self, field: str):
        super().__init__(f"{field} is not a well-formed identifier")
        self.field = field


class OfferOnOwnCar(OfferError):
    def __init__(self):
        super().__init__("Cannot make an offer on your own car")


class DuplicatePendingOffer(OfferError):
    def __init__(self):
        super().__init__("You already have a pending offer for this car")


class NotCarOwner(OfferError):
    def __init__(self):
        super().__init__("Only the car owner can change an offer's status")


class OfferAlreadySettled(OfferError):
    def __init__(self, current: str):
        super().__init__("Only a pending offer can be updated")
        self.current = current
