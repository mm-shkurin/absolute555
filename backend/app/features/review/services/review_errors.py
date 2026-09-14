"""What the review rules refuse, in domain words, with the status and code that say it."""

from app.core.exceptions import (
    BaseErrorApp,
    BusinessRuleError,
    ResourceNotFoundError,
    ValidationError,
)


class ReviewError(BaseErrorApp):
    pass


class OfferNotReviewable(ReviewError, ResourceNotFoundError):
    """Not this caller's offer, or no such offer.

    One error for both on purpose: a separate "not yours" would confirm to a stranger
    walking identifiers that the offer exists, and with it that somebody bought that car.
    """

    default_code = "OFFER_NOT_REVIEWABLE"

    def __init__(self, offer_id: str):
        self.offer_id = offer_id
        super().__init__("no such deal of yours")


class DealNotClosed(ReviewError, BusinessRuleError):
    default_code = "DEAL_NOT_CLOSED"

    def __init__(self, current: str):
        self.current = current
        super().__init__(
            "a review follows a closed deal, and this offer is not accepted",
            details={"current_status": current},
        )


class ReviewAlreadyWritten(ReviewError, BusinessRuleError):
    """The identifier travels with the refusal so the screen moves to correcting the
    review instead of offering to write a second one."""

    default_code = "REVIEW_ALREADY_WRITTEN"

    def __init__(self, review_id: str):
        self.review_id = review_id
        super().__init__("this deal has already been reviewed", details={"review_id": review_id})


class ReviewNotFound(ReviewError, ResourceNotFoundError):
    default_code = "REVIEW_NOT_FOUND"

    def __init__(self, review_id: str):
        self.review_id = review_id
        super().__init__("no such review of yours")


class EditWindowClosed(ReviewError, BusinessRuleError):
    default_code = "REVIEW_EDIT_WINDOW_CLOSED"

    def __init__(self, hours: int):
        self.hours = hours
        super().__init__(
            f"a review may be corrected within {hours} hours of writing it",
            details={"hours": hours},
        )


class SellerNotFound(ReviewError, ResourceNotFoundError):
    default_code = "SELLER_NOT_FOUND"

    def __init__(self, user_id: str):
        self.user_id = user_id
        super().__init__("no such seller")


class MalformedIdentifier(ReviewError, ValidationError):
    default_code = "MALFORMED_IDENTIFIER"

    def __init__(self, field: str):
        self.field = field
        super().__init__(f"{field} is not an identifier", details={"field": field})


class DialogNotReviewable(ReviewError, ResourceNotFoundError):
    """Оценивает только спрашивавший в переписке, и только другого её участника."""

    default_code = "DIALOG_NOT_REVIEWABLE"

    def __init__(self, dialog_id: str):
        self.dialog_id = dialog_id
        super().__init__(f"Dialog {dialog_id} gives no right to review")
