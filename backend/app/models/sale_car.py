from sqlalchemy.orm import relationship
from app.db.database import Base
import uuid
from sqlalchemy import Boolean, Column,Float, DateTime, ForeignKey, Integer,JSON, String, Text, Enum, func
from sqlalchemy.dialects.postgresql import JSONB, UUID
from datetime import datetime
from enum import Enum as PyEnum

class SaleCarStatus(str, PyEnum):
    ON_SALE = "on_sale"
    SOLD = "sold"

class SaleCars(Base):
    __tablename__ = "sale_cars"
    vin = Column(String)
    sale_car_id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    chroma_document_id = Column(String, nullable=True)
    task_id = Column(String, nullable=True)
    task_status = Column(String, nullable=True)
    price = Column(Float,nullable=False)
    milleage = Column(Float,nullable=False)
    phone_number = Column(String,nullable=False)
    description = Column(Text, nullable=True)
    status = Column(String, default=SaleCarStatus.ON_SALE, nullable=False)
    sts_photos = Column(JSONB,default=[])
    s3_photo_car_keys = Column(JSON, default=[])
    
    offers = relationship("Offer", back_populates="sale_car", cascade="all, delete-orphan")

    created_at = Column(DateTime, server_default=func.now()) 
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())