from sqlalchemy.orm import relationship
from app.db.database import Base
import uuid
from sqlalchemy import Column,Float, DateTime, ForeignKey, String, func
from sqlalchemy.dialects.postgresql import UUID

from app.features.offer.domain.statuses import OfferStatus


class Offer(Base):
    __tablename__ = "offers"
    offer_id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    sale_car_id = Column(UUID(as_uuid=True), ForeignKey("sale_cars.sale_car_id"),nullable=False)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    price = Column(Float,nullable=False)
    # A plain string rather than a database enum: the set of values changes,
    # and an enum type would need its own migration each time it does.
    status = Column(String, default=OfferStatus.PENDING.value, nullable=False, index=True)

    # When this offer stops standing. Written at creation rather than derived at read
    # time, so the moment is the same for every reader and for the job that expires it.
    expires_at = Column(DateTime, nullable=True, index=True)

    sale_car = relationship("SaleCars", back_populates="offers")
    user = relationship("Users", back_populates="offers")

    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())
