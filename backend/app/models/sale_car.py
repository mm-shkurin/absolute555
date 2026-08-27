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
    task_id = Column(String, nullable=True)
    task_status = Column(String, nullable=True)

    # Make and model resolved against the catalogue, null until they resolve. A make or
    # model the catalogue does not know does not stop a listing — it simply does not
    # appear under that filter until a moderator resolves the spelling (CatalogResolver).
    # Story 1 moved these off ChromaDB, where the row held only a document id and so
    # nothing could filter or sort on them; story 3 turned the two name columns into
    # these keys.
    brand_id = Column(UUID(as_uuid=True), ForeignKey("brands.brand_id", ondelete="SET NULL"), nullable=True, index=True)
    model_id = Column(UUID(as_uuid=True), ForeignKey("car_models.model_id", ondelete="SET NULL"), nullable=True, index=True)

    # What OCR actually read, kept even when both resolved. Without it a wrong fuzzy
    # match is invisible: the row says Toyota Camry with nothing to say the document
    # said Carina.
    mark_raw = Column(String, nullable=True)
    model_raw = Column(String, nullable=True)

    # The rest of what the СТС yields. Nullable because a listing can be filled in by
    # hand with no document at all, and an import listing has no VIN to decode.
    year = Column(Integer, nullable=True)
    transmission = Column(String, nullable=True)
    engine_power = Column(Integer, nullable=True)

    price = Column(Float,nullable=False)
    milleage = Column(Float,nullable=False)
    phone_number = Column(String,nullable=False)
    description = Column(Text, nullable=True)
    status = Column(String, default=SaleCarStatus.ON_SALE, nullable=False)
    sts_photos = Column(JSONB,default=[])
    s3_photo_car_keys = Column(JSON, default=[])

    brand = relationship("Brand")
    model = relationship("CarModel")
    offers = relationship("Offer", back_populates="sale_car", cascade="all, delete-orphan")

    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())
