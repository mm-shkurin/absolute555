from sqlalchemy.orm import relationship
from app.db.database import Base
import uuid
from sqlalchemy import Boolean, Column, DateTime, ForeignKey, Integer, String, Text, Enum, func
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import declarative_base
from datetime import datetime
from app.db.database import BaseModel
from app.models.offer import Offer
from app.permissions.roles import UserRole
class Users(BaseModel):
    __tablename__ = "users"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    vk_id = Column(String, unique=True, index=True)
    yandex_id = Column(String, unique = True,index=True)
    device_id = Column(String,index = True, nullable = True)
    
    yandex_json = Column(JSONB,nullable=True)
    vk_json = Column(JSONB, nullable=True)
    guest_json = Column(JSONB,nullable=True)
    
    role = Column(String, default=UserRole.USER.value, nullable=False)
    is_verified = Column(Boolean, default=False, nullable=False)
    is_guest = Column(Boolean, default = False)
    role_requests = relationship("RoleRequest", foreign_keys="RoleRequest.user_id", back_populates="user")
    offers = relationship("Offer", back_populates="user", cascade="all, delete-orphan")
    
    created_at = Column(DateTime, server_default=func.now()) 
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())  