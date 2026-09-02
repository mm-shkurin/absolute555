"""Domain errors of complaints and moderation.

The service states the refusal in the language of complaints; the router decides which
status says it over HTTP.
"""


class ComplaintError(Exception):
    """Base of every refusal in this area."""


class ComplaintNotFound(ComplaintError):
    def __init__(self, complaint_id: str):
        super().__init__(f"complaint {complaint_id} not found")
        self.complaint_id = complaint_id


class AlreadyComplained(ComplaintError):
    def __init__(self):
        super().__init__("this person has already complained about this listing")


class ComplaintOnOwnListing(ComplaintError):
    def __init__(self):
        super().__init__("a seller cannot complain about their own listing")


class ComplaintAlreadyHandled(ComplaintError):
    def __init__(self):
        super().__init__("this complaint has already been settled")
