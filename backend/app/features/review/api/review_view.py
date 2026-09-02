"""One shape for a review and a profile on the wire."""

from typing import Optional

from app.features.listing.api.sale_car_view import seller_view
from app.features.review.services.review_service import editable_until


def review_view(review) -> dict:
    return {
        "review_id": review.review_id,
        "offer_id": review.offer_id,
        "seller_id": review.seller_id,
        "author": seller_view(getattr(review, "author", None)),
        "rating": review.rating,
        "text": review.text,
        "created_at": review.created_at,
        "updated_at": review.updated_at,
        # Sent so the screen can grey the button itself rather than learn the window
        # closed from a refusal.
        "editable_until": editable_until(review),
    }


def profile_view(seller, listings_count: int) -> dict:
    block = seller_view(seller) or {}
    return {
        "user_id": seller.id,
        "name": block.get("name"),
        "avatar_url": block.get("avatar_url"),
        "rating": seller.rating_avg,
        "reviews_count": seller.reviews_count or 0,
        "deals_count": seller.deals_count or 0,
        "listings_count": listings_count,
        "member_since": seller.created_at,
    }


def offer_view(offer, review: Optional[object], accepted: bool) -> dict:
    """An offer as its author's screen shows it: the deal, and what may be said about it.

    Both fields are needed. Without can_review the screen would guess the right to review
    from the status; without review_id it would still not know whether one was written.
    """
    return {
        "offer_id": offer.offer_id,
        "sale_car_id": offer.sale_car_id,
        "user_id": offer.user_id,
        "price": offer.price,
        "status": offer.status,
        "expires_at": offer.expires_at,
        "created_at": offer.created_at,
        "updated_at": offer.updated_at,
        "can_review": accepted and review is None,
        "review_id": review.review_id if review is not None else None,
    }
