"""A review of a seller, earned by one closed deal.

The offer is the review's identity, not the pair of people: an accepted offer is the only
thing on this marketplace that separates a sale from a conversation, and it carries the
uniqueness with it — one offer, one review, held by the database rather than by a check
that two concurrent writes could both pass.
"""

import uuid

from sqlalchemy import Column, DateTime, ForeignKey, Integer, Text, UniqueConstraint, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship

from app.db.database import Base

# How long the author may correct what they wrote. After that the review settles: a
# review that can be changed forever is something a seller can bargain over.
EDIT_WINDOW_HOURS = 24


class Review(Base):
    __tablename__ = "reviews"
    __table_args__ = (UniqueConstraint("offer_id", name="reviews_one_per_offer"),)

    review_id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    offer_id = Column(
        UUID(as_uuid=True), ForeignKey("offers.offer_id", ondelete="CASCADE"), nullable=False
    )

    # Both sides denormalised from the offer: the profile reads reviews by seller, and
    # the offers screen reads them by author, and neither should join through the offer
    # to find out whose they are.
    seller_id = Column(
        UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True
    )
    author_id = Column(
        UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True
    )

    rating = Column(Integer, nullable=False)
    text = Column(Text, nullable=True)

    created_at = Column(DateTime, server_default=func.now(), nullable=False, index=True)
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())

    offer = relationship("Offer")
    seller = relationship("Users", foreign_keys=[seller_id])
    author = relationship("Users", foreign_keys=[author_id])
