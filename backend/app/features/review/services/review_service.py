"""Writing a review, and keeping the seller's aggregate true.

The right to review is not a field anywhere: it is the accepted offer itself, read back
under the caller who claims it. That is why there is no "review seller X" operation —
without a deal to name, the rating would be a number anyone could raise.
"""

import uuid
from datetime import datetime, timedelta
from typing import Dict, List, Optional

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.features.offer.models.offer import Offer, OfferStatus
from app.features.review.models.review import EDIT_WINDOW_HOURS, Review
from app.features.listing.models.sale_car import SaleCars
from app.features.account.models.users import Users
from app.features.review.services.review_errors import (
    DealNotClosed,
    EditWindowClosed,
    MalformedIdentifier,
    OfferNotReviewable,
    ReviewAlreadyWritten,
    ReviewNotFound,
)


def as_uuid(value: str, field: str) -> uuid.UUID:
    try:
        return uuid.UUID(str(value))
    except (ValueError, AttributeError, TypeError):
        raise MalformedIdentifier(field)


def editable_until(review: Review) -> Optional[datetime]:
    if review.created_at is None:
        return None
    return review.created_at + timedelta(hours=EDIT_WINDOW_HOURS)


class ReviewService:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def create(
        self, offer_id: str, author_id: str, rating: int, text: Optional[str]
    ) -> Review:
        offer, seller_id = await self._reviewable_offer(offer_id, author_id)

        existing = await self.db.execute(select(Review).where(Review.offer_id == offer.offer_id))
        already = existing.scalar_one_or_none()
        if already is not None:
            raise ReviewAlreadyWritten(str(already.review_id))

        review = Review(
            offer_id=offer.offer_id,
            seller_id=seller_id,
            author_id=as_uuid(author_id, "author_id"),
            rating=rating,
            text=text or None,
        )
        self.db.add(review)
        await self.db.flush()

        # In the same transaction as the review: an aggregate written afterwards is an
        # aggregate that a failure between the two writes leaves permanently wrong.
        await self._recount(seller_id)
        await self.db.commit()
        await self.db.refresh(review)
        return review

    async def update(self, review_id: str, author_id: str, changes: dict) -> Review:
        """Only the fields the author actually sent: a correction is not a rewrite.

        The caller passes what was in the request rather than every field plus a flag
        saying which of them were meant -- a flag the service could only obey blindly.
        """
        found = await self.db.execute(
            select(Review).where(Review.review_id == as_uuid(review_id, "review_id"))
        )
        review = found.scalar_one_or_none()
        if review is None or str(review.author_id) != str(author_id):
            raise ReviewNotFound(review_id)

        settled = editable_until(review)
        if settled is not None and datetime.utcnow() > settled:
            raise EditWindowClosed(EDIT_WINDOW_HOURS)

        if "rating" in changes and changes["rating"] is not None:
            review.rating = changes["rating"]
        if "text" in changes:
            review.text = changes["text"] or None

        await self.db.flush()
        await self._recount(review.seller_id)
        await self.db.commit()
        await self.db.refresh(review)
        return review

    async def reviews_by_offer(self, offer_ids: List[uuid.UUID]) -> Dict[str, Review]:
        """Which of these offers already carry a review, keyed by offer.

        The offers screen needs it for the whole page at once: a query per row is a query
        per offer, and the screen shows all of them.
        """
        if not offer_ids:
            return {}
        found = await self.db.execute(select(Review).where(Review.offer_id.in_(offer_ids)))
        return {str(review.offer_id): review for review in found.scalars()}

    async def _reviewable_offer(self, offer_id: str, author_id: str):
        found = await self.db.execute(
            select(Offer, SaleCars.user_id)
            .join(SaleCars, SaleCars.sale_car_id == Offer.sale_car_id)
            .where(Offer.offer_id == as_uuid(offer_id, "offer_id"))
        )
        row = found.first()
        if row is None:
            raise OfferNotReviewable(offer_id)

        offer, seller_id = row
        if str(offer.user_id) != str(author_id):
            raise OfferNotReviewable(offer_id)
        if str(seller_id) == str(author_id):
            # Unreachable through the offer routes, which refuse an offer on one's own
            # car. Stated anyway: this is the rule that keeps a rating from being
            # self-issued, and it must not depend on another route's guard.
            raise OfferNotReviewable(offer_id)
        if offer.status != OfferStatus.ACCEPTED.value:
            raise DealNotClosed(offer.status)
        return offer, seller_id

    async def _recount(self, seller_id) -> None:
        counted = await self.db.execute(
            select(func.avg(Review.rating), func.count(Review.review_id)).where(
                Review.seller_id == seller_id
            )
        )
        average, count = counted.one()
        seller = await self.db.get(Users, seller_id)
        if seller is None:
            return
        seller.rating_avg = round(float(average), 1) if average is not None else None
        seller.reviews_count = int(count)
