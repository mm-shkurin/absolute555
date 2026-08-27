from sqlalchemy.orm import relationship
from app.db.database import Base
import uuid
from sqlalchemy import Boolean, Column,Float, DateTime, ForeignKey, Integer,JSON, String, Text, Enum, func
from sqlalchemy.dialects.postgresql import JSONB, UUID
from datetime import datetime
from enum import Enum as PyEnum

class OfferStatus(str, PyEnum):
    ACCEPT = "accept"
    PENDING = "pending"
    REJECT = "reject"

class Offer(Base):
    __tablename__ = "offers"
    offer_id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    sale_car_id = Column(UUID(as_uuid=True), ForeignKey("sale_cars.sale_car_id"),nullable=False)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    price = Column(Float,nullable=False)
    status = Column(Enum(OfferStatus), default=OfferStatus.PENDING, nullable=False)

    sale_car = relationship("SaleCars", back_populates="offers")
    user = relationship("Users", back_populates="offers")

    created_at = Column(DateTime, server_default=func.now()) 
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())