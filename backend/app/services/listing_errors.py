"""Domain errors of the listing lifecycle.

A service states what went wrong in the language of listings; the router decides which
status code says that over HTTP. Raising HTTPException down here would put the wire
protocol inside the business rules -- which is what `.claude/rules/coding-rules.md`
forbids, and what the rest of this service layer still does.
"""


class ListingError(Exception):
    """Base of every lifecycle refusal."""


class ListingNotFound(ListingError):
    def __init__(self, listing_id: str):
        super().__init__(f"listing {listing_id} not found")
        self.listing_id = listing_id


class TransitionNotAllowed(ListingError):
    def __init__(self, current: str, allowed: list[str]):
        super().__init__(f"a listing in {current} cannot move there")
        self.current = current
        self.allowed = allowed


class ListingIncomplete(ListingError):
    def __init__(self, missing: list[str]):
        super().__init__("the listing is not complete enough to be reviewed")
        self.missing = missing


class ListingFrozen(ListingError):
    def __init__(self, current: str):
        super().__init__(f"a listing in {current} cannot be edited")
        self.current = current


class TooManyDrafts(ListingError):
    def __init__(self, limit: int):
        super().__init__(f"no more than {limit} drafts at a time")
        self.limit = limit


class RejectionNeedsReason(ListingError):
    def __init__(self):
        super().__init__("a rejection without a reason gives the seller nothing to fix")
