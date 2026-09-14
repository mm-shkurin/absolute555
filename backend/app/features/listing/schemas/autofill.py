from datetime import datetime
from typing import Optional
from uuid import UUID

from pydantic import BaseModel, ConfigDict

from app.features.listing.statuses import AutofillState, FieldSource


class Autofill(BaseModel):
    """What the reading of the registration scan came to.

    unreadable and undecoded stay apart on the wire because the seller's next move
    differs: a new photograph against typing the fields in.
    """

    state: AutofillState
    brand_source: Optional[FieldSource] = None
    model_source: Optional[FieldSource] = None
    updated_at: Optional[datetime] = None


class StsAccepted(BaseModel):
    sale_car_id: UUID
    autofill: Autofill


class VinDecodeRequest(BaseModel):
    """Идентификационный номер, переписанный продавцом из документа.

    Форма проверяется в сервисе, а не здесь: «не похоже на VIN» — это отказ предметной
    области со своим кодом, а не поле, не прошедшее разбор запроса.
    """

    model_config = ConfigDict(extra="forbid")

    vin: str
