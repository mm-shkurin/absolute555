from pydantic import BaseModel, ConfigDict, Field
from typing import List, Optional
from uuid import UUID
from datetime import datetime

# One vocabulary for the wire and the row. Re-declaring the six values here is how the
# two drift apart the first time one is extended.
from app.models.sale_car import SaleCarStatus


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
    reject_reason: Optional[str] = None
    published_at: Optional[datetime] = None
    created_at: Optional[datetime]
    updated_at: Optional[datetime]
    car_data: Optional[dict] = None
    preview_photo_url: Optional[str] = None
    photos: List[Photo] = []

    class Config:
        from_attributes = True
