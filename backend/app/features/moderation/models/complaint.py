"""A complaint about a published listing.

One row per person per listing, enforced by the database rather than by a check in the
service: two workers reading "has this person complained?" at the same moment both see
no, and the count on the moderator's screen stops meaning "this many people".
"""

import uuid
from enum import Enum as PyEnum

from sqlalchemy import Column, DateTime, ForeignKey, String, Text, UniqueConstraint, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship

from app.db.database import Base


class ComplaintReason(str, PyEnum):
    BAIT_PRICE = "bait_price"
    PHOTOS_OF_ANOTHER_CAR = "photos_of_another_car"
    CONTACTS_IN_DESCRIPTION = "contacts_in_description"
    SOLD_ALREADY = "sold_already"
    OTHER = "other"


class ComplaintStatus(str, PyEnum):
    OPEN = "open"
    HANDLED = "handled"


class Complaint(Base):
    __tablename__ = "complaints"
    __table_args__ = (
        UniqueConstraint("sale_car_id", "user_id", name="complaints_one_per_person_per_listing"),
    )

    complaint_id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    sale_car_id = Column(
        UUID(as_uuid=True),
        ForeignKey("sale_cars.sale_car_id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)

    reason = Column(String, nullable=False)
    text = Column(Text, nullable=True)

    # Open until a moderator decides, either by taking the listing down or by saying the
    # complaint is unfounded. Both are decisions; neither is automatic.
    status = Column(String, default=ComplaintStatus.OPEN.value, nullable=False, index=True)
    handled_at = Column(DateTime, nullable=True)
    handled_by = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="SET NULL"), nullable=True)

    created_at = Column(DateTime, server_default=func.now(), nullable=False)

    author = relationship("Users", foreign_keys=[user_id])
    listing = relationship("SaleCars", back_populates="complaints")
