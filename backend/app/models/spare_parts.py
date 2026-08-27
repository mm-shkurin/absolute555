from sqlalchemy.orm import relationship
from app.db.database import Base
import uuid
from sqlalchemy import Boolean, Column, DateTime, ForeignKey, Integer,JSON, String, Text, func
from sqlalchemy.dialects.postgresql import JSONB, UUID, ARRAY
from datetime import datetime

class SpareParts(Base):
    __tablename__ = "spare_parts"
    part_id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    car_id = Column(UUID(as_uuid=True), ForeignKey("cars.car_id"), nullable=False)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)

    name = Column(String, nullable=False)
    mileage_last_replaced = Column(Integer, nullable=False)
    array_mileage = Column(ARRAY(Integer), default=[], nullable=False)
    mileage_average_value = Column(Integer, nullable=False)
    chroma_document_id = Column(String, nullable=True)
    task_id = Column(String, nullable=True)
    task_status = Column(String, nullable=True)

    car = relationship("Cars", back_populates="spare_parts")
    user = relationship("Users", back_populates="spare_parts")

    created_at = Column(DateTime, server_default=func.now()) 
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())
    
    @property
    def latest_mileage(self) -> int:
        return self.array_mileage[-1] if self.array_mileage else 0
    
    @property
    def mileage_count(self) -> int:
        return len(self.array_mileage)