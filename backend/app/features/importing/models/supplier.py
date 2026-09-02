"""Профиль поставщика: чем он возит, откуда и на каких условиях.

Один профиль на пользователя с ролью importer, а не отдельная сущность «компания»:
членство, приглашения и роли внутри компании — это своя история, и заводить их таблицами
раньше, чем появится хоть один поставщик, значит строить пустой каркас.

Профиль проходит модерацию тем же путём, что и объявление: страница поставщика — это
витрина, и опубликованная без проверки она ничем не отличается от объявления, которое
модерацию обходит.
"""

import uuid
from enum import Enum as PyEnum

from sqlalchemy import Column, DateTime, ForeignKey, Integer, String, Text, func
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import relationship

from app.db.database import Base


class SupplierStatus(str, PyEnum):
    DRAFT = "draft"
    PENDING = "pending"
    PUBLISHED = "published"
    REJECTED = "rejected"


REQUIRED_TO_SUBMIT = ("company_name", "countries", "delivery_days_min", "delivery_days_max")


class SupplierProfile(Base):
    __tablename__ = "supplier_profiles"

    user_id = Column(
        UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), primary_key=True
    )

    company_name = Column(String, nullable=True)
    # Страны и марки — списки строк, а не связи со справочником: поставщик возит из
    # Кореи и Японии, а справочник марок здесь про машину в объявлении, и марка, которую
    # он назвал, ещё ничего не публикует.
    countries = Column(JSONB, default=list)
    brands = Column(JSONB, default=list)

    delivery_days_min = Column(Integer, nullable=True)
    delivery_days_max = Column(Integer, nullable=True)
    terms = Column(Text, nullable=True)
    description = Column(Text, nullable=True)

    status = Column(String, default=SupplierStatus.DRAFT.value, nullable=False, index=True)
    reject_reason = Column(Text, nullable=True)
    submitted_at = Column(DateTime, nullable=True)
    moderated_at = Column(DateTime, nullable=True)

    created_at = Column(DateTime, server_default=func.now(), nullable=False)
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())

    owner = relationship("Users")
