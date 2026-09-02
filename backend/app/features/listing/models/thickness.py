"""Один замер толщиномера: панель объявления, число и фотография прибора.

Отдельная таблица, а не JSON-колонка рядом с галереей: единственность «один замер на
панель» здесь держит база, а не проверка в сервисе, которую две одновременные записи
проходят обе.
"""

import uuid

from sqlalchemy import Column, DateTime, ForeignKey, Integer, String, UniqueConstraint, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship

from app.db.database import Base


class ThicknessMeasurement(Base):
    __tablename__ = "thickness_measurements"
    __table_args__ = (
        UniqueConstraint("sale_car_id", "panel", name="thickness_one_per_panel"),
    )

    measurement_id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    sale_car_id = Column(
        UUID(as_uuid=True),
        ForeignKey("sale_cars.sale_car_id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )

    panel = Column(String, nullable=False)
    value_um = Column(Integer, nullable=False)

    # Чем записано число и что прочиталось с фотографии. Оба поля нужны рядом: без
    # первого не сказать, поправлял ли продавец, без второго — от чего он отступил, и
    # покупателю нечем отличить исправленную опечатку прибора от подрисованного замера.
    value_source = Column(String, nullable=False, default="seller")
    ocr_value_um = Column(Integer, nullable=True)

    # Фотография экрана прибора — доказательство замера, поэтому обязательна. В строке
    # только ключ: байты лежат в S3, как и галерея.
    photo_key = Column(String, nullable=False)

    created_at = Column(DateTime, server_default=func.now(), nullable=False)
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())

    listing = relationship("SaleCars", back_populates="thickness_measurements")
