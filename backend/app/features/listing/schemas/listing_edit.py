from datetime import datetime
from typing import Optional
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field

from app.features.listing.domain.statuses import ListingKind


class SaleCarCreate(BaseModel):
    phone_number: str
    price: float
    milleage: float
    vin: Optional[str] = None
    description: Optional[str] = None


class SaleCarUpdate(BaseModel):
    """Any subset of a listing's fields.

    Unknown fields are refused rather than ignored: a client that sends a field not listed
    here, `status` included, would expect it to have been applied.
    """

    model_config = ConfigDict(extra="forbid")

    vin: Optional[str] = None
    body_number: Optional[str] = Field(default=None, max_length=40)
    phone_number: Optional[str] = None
    price: Optional[float] = None
    milleage: Optional[float] = None
    description: Optional[str] = None
    brand_id: Optional[UUID] = None
    model_id: Optional[UUID] = None
    mark_raw: Optional[str] = None
    model_raw: Optional[str] = None
    year: Optional[int] = None
    transmission: Optional[str] = None
    engine_power: Optional[int] = None

    # Настройки видимости. Правятся как обычные поля: продавец решает про своё
    # объявление, и отдельная ручка ради трёх флагов была бы вторым способом сказать
    # то же самое.
    phone_visible: Optional[bool] = None
    chat_allowed: Optional[bool] = None
    offers_visible: Optional[bool] = None

    # Поля привоза правятся так же, как остальные; вид объявления — нет: он выбран при
    # создании, и смена его на живом объявлении означала бы, что покупатель торговался
    # за машину другого канала.
    import_country: Optional[str] = Field(default=None, max_length=60)
    delivery_days: Optional[int] = Field(default=None, ge=1, le=365)
    turnkey_price: Optional[float] = Field(default=None, ge=0)


class DraftKind(BaseModel):
    """Чем будет объявление. Привоз создаёт только поставщик."""

    listing_kind: ListingKind = ListingKind.STOCK


class RecognisedCar(BaseModel):
    """What a listing says about the car itself, as every listing payload carries it."""

    sale_car_id: UUID
    user_id: UUID
    vin: Optional[str]
    brand: Optional[str] = None
    model: Optional[str] = None
    mark_raw: Optional[str] = None
    model_raw: Optional[str] = None
    year: Optional[int] = None
    transmission: Optional[str] = None
    engine_power: Optional[int] = None


class SaleCarUpdateResponse(RecognisedCar):
    body_number: Optional[str] = None
    task_status: Optional[str]
    updated_at: datetime
    message: str = "Sale car updated successfully"

    class Config:
        from_attributes = True
