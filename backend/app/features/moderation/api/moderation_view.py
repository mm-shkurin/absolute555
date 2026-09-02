"""One shape for the moderator's screens."""

from typing import Iterable

from app.features.listing.api.sale_car_view import seller_view, to_card


def queue_item(listing, open_complaints: int) -> dict:
    """A queue row: the card a buyer would see, plus what only a moderator needs."""
    row = to_card(listing)
    row["seller"] = seller_view(listing.owner)
    row["open_complaints"] = open_complaints
    row["submitted_at"] = listing.submitted_at.isoformat() if listing.submitted_at else None
    return row


def complaint_view(complaint) -> dict:
    return {
        "complaint_id": complaint.complaint_id,
        "sale_car_id": complaint.sale_car_id,
        "author": seller_view(complaint.author),
        "reason": complaint.reason,
        "text": complaint.text,
        "status": complaint.status,
        "created_at": complaint.created_at,
        "handled_at": complaint.handled_at,
    }


def group_view(listing_id, complaints: Iterable) -> dict:
    """Complaints gathered under the listing they are about, as the screen shows them."""
    complaints = list(complaints)
    listing = complaints[0].listing if complaints else None
    return {
        "sale_car_id": listing_id,
        "listing": to_card(listing) if listing is not None else None,
        "complaints": [complaint_view(complaint) for complaint in complaints],
    }
