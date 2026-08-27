from sqlalchemy.orm import relationship
from app.db.database import Base
import uuid
from sqlalchemy import Boolean, Column, DateTime, ForeignKey, Integer,JSON, String, Text, func
from sqlalchemy.dialects.postgresql import JSONB, UUID
from datetime import datetime

class Cars(Base):
    __tablename__ = "cars"
    vin = Column(String)
    car_id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    chroma_document_id = Column(String, nullable=True)
    task_id = Column(String, nullable=True)
    task_status = Column(String, nullable=True)

    sts_photos = Column(JSONB,default=[])
    spare_parts = relationship("SpareParts", back_populates="car")
    
    created_at = Column(DateTime, server_default=func.now()) 
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())