from enum import Enum as PyEnum

from sqlalchemy import Column, String, Text, DateTime, ForeignKey, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from app.db.database import Base
import uuid
from datetime import datetime
from app.permissions.roles import UserRole

class RoleRequestStatus(str, PyEnum):
    """Три исхода заявки. Наследовал sqlalchemy.Enum — значения оказывались строками,
    и то, что сравнения работали, было случайностью."""

    PENDING = "pending"
    APPROVED = "approved"
    REJECTED = "rejected"

class RoleRequest(Base):
    __tablename__ = "role_requests"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    requested_role = Column(String, nullable=False)
    reason = Column(Text, nullable=False)
    additional_info = Column(Text, nullable=True)
    status = Column(String, default=RoleRequestStatus.PENDING, nullable=False)
    
    reviewed_by = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    reviewed_at = Column(DateTime, nullable=True)
    review_comment = Column(Text, nullable=True)
    
    created_at = Column(DateTime, server_default=func.now(), nullable=False)
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now(), nullable=False)
    
    user = relationship("Users", foreign_keys=[user_id], back_populates="role_requests")
    reviewer = relationship("Users", foreign_keys=[reviewed_by])
