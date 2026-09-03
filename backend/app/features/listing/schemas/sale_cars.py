from pydantic import BaseModel, ConfigDict, Field
from typing import List, Optional
from uuid import UUID
from datetime import datetime

# One vocabulary for the wire and the row. Re-declaring the six values here is how the
# two drift apart the first time one is extended.
from app.features.listing.statuses import AutofillState, FieldSource, ListingKind, SaleCarStatus
from app.features.listing.schemas.feed import Seller
from app.features.listing.schemas.thickness import ThicknessSummary


class SaleCarCreate(BaseModel):
    phone_number: str
    price: float
    milleage: float
    vin: Optional[str] = None
    description: Optional[str] = None


class SaleCarUpdate(BaseModel):
    """Any subset of a listing's fields.

    Unknown fields are refused rather than ignored: `status` used to be one of these, and
    a client that can still send it would expect it to have been applied.
    """

    model_config = ConfigDict(extra="forbid")

    vin: Optional[str] = None
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

    # Поля привоза правятся так же, как остальные; вид объявления — нет: он выбран при
    # создании, и смена его на живом объявлении означала бы, что покупатель торговался
    # за машину другого канала.
    import_country: Optional[str] = Field(default=None, max_length=60)
    delivery_days: Optional[int] = Field(default=None, ge=1, le=365)
    turnkey_price: Optional[float] = Field(default=None, ge=0)


class DraftKind(BaseModel):
    """Чем будет объявление. Привоз создаёт только поставщик."""

    listing_kind: ListingKind = ListingKind.STOCK


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


class Photo(BaseModel):
    photo_id: str
    url: str
    preview_url: str


class GalleryResponse(BaseModel):
    sale_car_id: UUID
    photos: List[Photo]
    limit: int


class PhotoOrder(BaseModel):
    model_config = ConfigDict(extra="forbid")

    photo_ids: List[str] = Field(..., min_length=1)


class DocumentLink(BaseModel):
    url: str
    expires_at: datetime


class SaleCarStatusChanged(BaseModel):
    sale_car_id: UUID
    status: SaleCarStatus
    updated_at: datetime


class SaleCarUpdateResponse(BaseModel):
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
    task_status: Optional[str]
    updated_at: datetime
    message: str = "Sale car updated successfully"

    class Config:
        from_attributes = True


class SaleCarResponse(BaseModel):
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
    task_id: Optional[str] = None
    task_status: Optional[str] = None
    phone_number: Optional[str] = None
    price: Optional[float] = None
    milleage: Optional[float] = None
    description: Optional[str] = None
    status: SaleCarStatus
    listing_kind: ListingKind = ListingKind.STOCK
    import_country: Optional[str] = None
    delivery_days: Optional[int] = None
    turnkey_price: Optional[float] = None
    reject_reason: Optional[str] = None
    reject_label: Optional[str] = None
    published_at: Optional[datetime] = None
    created_at: Optional[datetime]
    updated_at: Optional[datetime]
    preview_photo_url: Optional[str] = None
    photos: List[Photo] = []
    autofill: Optional[Autofill] = None
    seller: Optional[Seller] = None
    thickness: Optional[ThicknessSummary] = None

    class Config:
        from_attributes = True
