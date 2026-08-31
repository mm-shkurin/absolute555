"""What the review rules refuse, in domain words. The router turns them into statuses."""


class ReviewError(Exception):
    pass


class OfferNotReviewable(ReviewError):
    """Not this caller's offer, or no such offer.

    One error for both on purpose: a separate "not yours" would confirm to a stranger
    walking identifiers that the offer exists, and with it that somebody bought that car.
    """

    def __init__(self, offer_id: str):
        self.offer_id = offer_id
        super().__init__("no such deal of yours")


class DealNotClosed(ReviewError):
    def __init__(self, current: str):
        self.current = current
        super().__init__("a review follows a closed deal, and this offer is not accepted")


class ReviewAlreadyWritten(ReviewError):
    def __init__(self, review_id: str):
        self.review_id = review_id
        super().__init__("this deal has already been reviewed")


class ReviewNotFound(ReviewError):
    def __init__(self, review_id: str):
        self.review_id = review_id
        super().__init__("no such review of yours")


class EditWindowClosed(ReviewError):
    def __init__(self, hours: int):
        self.hours = hours
        super().__init__(f"a review may be corrected within {hours} hours of writing it")


class SellerNotFound(ReviewError):
    def __init__(self, user_id: str):
        self.user_id = user_id
        super().__init__("no such seller")


class MalformedIdentifier(ReviewError):
    def __init__(self, field: str):
        self.field = field
        super().__init__(f"{field} is not an identifier")
