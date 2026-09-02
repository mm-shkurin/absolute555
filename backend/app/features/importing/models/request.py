"""Заявка покупателя «хочу такую» и отклик поставщика на неё.

Заявка — это спрос без машины: у неё нет ни VIN, ни фотографий, ни продавца, поэтому она
не объявление и живёт своей таблицей. Отклик привязан к паре «заявка и поставщик»:
единственность держит база, и повторный отклик правит первый, а не встаёт вторым.
"""

import uuid
from enum import Enum as PyEnum

from sqlalchemy import (
    Column,
    DateTime,
    Float,
    ForeignKey,
    Integer,
    String,
    Text,
    UniqueConstraint,
    func,
)
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship

from app.db.database import Base

# Сколько заявок покупатель держит открытыми. Как лимит черновиков: без потолка десяток
# заявок одного человека вытесняет из ленты поставщика всех остальных.
MAX_OPEN_REQUESTS = 3


class RequestStatus(str, PyEnum):
    OPEN = "open"
    CLOSED = "closed"


class BuyerRequest(Base):
    __tablename__ = "buyer_requests"

    request_id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(
        UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True
    )

    brand_id = Column(UUID(as_uuid=True), ForeignKey("brands.brand_id", ondelete="SET NULL"))
    model_id = Column(UUID(as_uuid=True), ForeignKey("car_models.model_id", ondelete="SET NULL"))
    year_from = Column(Integer, nullable=True)
    budget_max = Column(Float, nullable=True)
    comment = Column(Text, nullable=True)

    status = Column(String, default=RequestStatus.OPEN.value, nullable=False, index=True)
    created_at = Column(DateTime, server_default=func.now(), nullable=False, index=True)
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())

    brand = relationship("Brand")
    model = relationship("CarModel")
    responses = relationship(
        "SupplierResponse", back_populates="request", cascade="all, delete-orphan"
    )


class SupplierResponse(Base):
    __tablename__ = "supplier_responses"
    __table_args__ = (
        UniqueConstraint("request_id", "supplier_id", name="responses_one_per_supplier"),
    )

    response_id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    request_id = Column(
        UUID(as_uuid=True),
        ForeignKey("buyer_requests.request_id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    supplier_id = Column(
        UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True
    )

    price = Column(Float, nullable=False)
    delivery_days = Column(Integer, nullable=False)
    comment = Column(Text, nullable=True)

    created_at = Column(DateTime, server_default=func.now(), nullable=False)
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())

    request = relationship("BuyerRequest", back_populates="responses")
    supplier = relationship("Users")
