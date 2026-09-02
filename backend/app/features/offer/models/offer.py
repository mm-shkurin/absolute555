from sqlalchemy.orm import relationship
from app.db.database import Base
import uuid
from sqlalchemy import Boolean, Column,Float, DateTime, ForeignKey, Integer,JSON, String, Text, Enum, func
from sqlalchemy.dialects.postgresql import JSONB, UUID
from datetime import datetime
from enum import Enum as PyEnum

# Словарь состояний живёт отдельно (app/features/offer/statuses.py). Имена продолжают
# читаться отсюда: для сервисов оффер и его статусы — один предмет.
from app.features.offer.statuses import LIVE, OfferStatus  # noqa: F401


class Offer(Base):
    __tablename__ = "offers"
    offer_id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    sale_car_id = Column(UUID(as_uuid=True), ForeignKey("sale_cars.sale_car_id"),nullable=False)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    price = Column(Float,nullable=False)
    # A plain string rather than a database enum: the set grew from three values to six
    # in story 10, and an enum type would need its own migration each time it does.
    status = Column(String, default=OfferStatus.PENDING.value, nullable=False, index=True)

    # When this offer stops standing. Written at creation rather than derived at read
    # time, so the moment is the same for every reader and for the job that expires it.
    expires_at = Column(DateTime, nullable=True, index=True)

    sale_car = relationship("SaleCars", back_populates="offers")
    user = relationship("Users", back_populates="offers")

    created_at = Column(DateTime, server_default=func.now()) 
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())