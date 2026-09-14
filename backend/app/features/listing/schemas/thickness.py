"""Провод карты замеров."""

from datetime import datetime
from typing import List, Optional

from pydantic import BaseModel

from app.features.listing.domain.panels import BodyPanel, PanelStatus, ValueSource


class Measurement(BaseModel):
    panel: BodyPanel
    value_um: int
    status: PanelStatus
    source: ValueSource
    ocr_value_um: Optional[int] = None
    photo_url: str
    updated_at: Optional[datetime] = None


class ThicknessSummary(BaseModel):
    """Сводка в карточке и детальной выдаче: отдельного вызова ради неё нет."""

    measured_panels: int
    total_panels: int
    is_complete: bool
    # Статус каждой панели в порядке BodyPanel; пусто — панель не замерена.
    panels: List[Optional[PanelStatus]] = []


class ThicknessMap(BaseModel):
    sale_car_id: str
    measurements: List[Measurement]
    measured_panels: int
    total_panels: int
    is_complete: bool


class GaugeReading(BaseModel):
    """Число со снимка прибора — подсказка продавцу, а не замер: сохраняет его «Сохранить»."""

    value_um: Optional[int] = None
