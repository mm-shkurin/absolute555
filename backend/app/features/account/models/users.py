from sqlalchemy.orm import relationship
from app.db.database import Base
import uuid
from sqlalchemy import Boolean, Column, DateTime, Float, ForeignKey, Integer, String, Text, Enum, func
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import declarative_base
from datetime import datetime
from app.db.database import BaseModel
from app.features.offer.models.offer import Offer
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
    # The aggregate lives on the seller rather than being averaged per read: it is shown
    # on every card of the feed, on every row of the moderation queue and on the profile,
    # and an AVG subquery per row is a query per card. Recalculated in the transaction
    # that writes the review.
    rating_avg = Column(Float, nullable=True)
    reviews_count = Column(Integer, default=0, nullable=False, server_default="0")
    deals_count = Column(Integer, default=0, nullable=False, server_default="0")

    role_requests = relationship("RoleRequest", foreign_keys="RoleRequest.user_id", back_populates="user")
    offers = relationship("Offer", back_populates="user", cascade="all, delete-orphan")
    
    created_at = Column(DateTime, server_default=func.now()) 
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())

    @property
    def display_name(self) -> str:
        """Имя из того провайдера, которым человек вошёл.

        Жило двумя одинаковыми копиями в двух сервисах ролей. Принадлежит строке: имя
        собирается из её же колонок и ни от чего больше не зависит.
        """
        for profile in (self.vk_json, self.yandex_json):
            if isinstance(profile, dict):
                name = " ".join(
                    part for part in (profile.get("first_name"), profile.get("last_name")) if part
                ).strip()
                if name:
                    return name
        return "Неизвестный пользователь"
