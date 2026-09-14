"""Domain errors of complaints and moderation, with the status and code that say them."""

from app.core.exceptions import BaseErrorApp, ConflictError, ResourceNotFoundError


class ComplaintError(BaseErrorApp):
    """Base of every refusal in this area."""


class ComplaintNotFound(ComplaintError, ResourceNotFoundError):
    default_code = "COMPLAINT_NOT_FOUND"

    def __init__(self, complaint_id: str):
        super().__init__(f"complaint {complaint_id} not found")
        self.complaint_id = complaint_id


class AlreadyComplained(ComplaintError, ConflictError):
    default_code = "ALREADY_COMPLAINED"

    def __init__(self):
        super().__init__("this person has already complained about this listing")


class ComplaintOnOwnListing(ComplaintError, ConflictError):
    default_code = "COMPLAINT_ON_OWN_LISTING"

    def __init__(self):
        super().__init__("a seller cannot complain about their own listing")


class ComplaintAlreadyHandled(ComplaintError, ConflictError):
    default_code = "COMPLAINT_ALREADY_HANDLED"

    def __init__(self):
        super().__init__("this complaint has already been settled")
