from sqlalchemy import Column, ForeignKey, Float, Text, DateTime, String, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from sqlalchemy.ext.declarative import declarative_base
from app.db.database import Base
import uuid
from datetime import datetime

class Review(Base):
    __tablename__ = "review"
    review_id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    rating = Column(Float, nullable=False)
    chroma_document_id = Column(String, nullable=True, unique=True)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    
    user = relationship("Users", back_populates="review")

    created_at = Column(DateTime, nullable=False, server_default=func.now())