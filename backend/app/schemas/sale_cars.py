from pydantic import BaseModel, Field
from typing import List, Optional
from uuid import UUID
from datetime import datetime
from enum import Enum

class SaleCarStatus(str, Enum):
    ON_SALE = "on_sale"  
    SOLD = "sold" 


class SaleCarCreate(BaseModel):
    phone_number: str
    price: float
    milleage: float
    vin: Optional[str] = None
    description: Optional[str] = None
    sts_photos_b64: Optional[List[str]] = None


class SaleCarPhotoUpload(BaseModel):
    photos_b64: List[str]


class SaleCarPhotoDelete(BaseModel):
    photo_keys: List[str] = Field(..., min_items=1, description="List of photo keys to delete")


class SaleCarUpdate(BaseModel):
    vin: Optional[str] = None
    phone_number: Optional[str] = None
    price: Optional[float] = None
    milleage: Optional[float] = None
    description: Optional[str] = None
    status: Optional[SaleCarStatus] = None
    mark: Optional[str] = None
    model: Optional[str] = None
    year: Optional[str] = None
    transmission: Optional[str] = None
    engine_power: Optional[int] = None
    body_type: Optional[str] = None
    fuel_type: Optional[str] = None
    drive_type: Optional[str] = None
    sts_photos_b64: Optional[List[str]] = None


class SaleCarUpdateResponse(BaseModel):
    sale_car_id: UUID
    user_id: UUID
    vin: Optional[str]
    chroma_document_id: Optional[str]
    task_status: Optional[str]
    updated_at: datetime
    message: str = "Sale car updated successfully"

    class Config:
        from_attributes = True


class SaleCarResponse(BaseModel):
    sale_car_id: UUID
    user_id: UUID
    vin: Optional[str]
    chroma_document_id: Optional[str]
    s3_photo_car_keys: Optional[List[str]] = None
    task_id: Optional[str] = None
    task_status: Optional[str] = None
    phone_number: str
    price: float
    milleage: float
    description: Optional[str] = None
    status: SaleCarStatus
    created_at: Optional[datetime]
    updated_at: Optional[datetime]
    car_data: Optional[dict] = None
    preview_photo_url: Optional[str] = None
    photo_urls: Optional[List[str]] = None

    class Config:
        from_attributes = True


class SaleCarStatusUpdate(BaseModel):
    status: SaleCarStatus = Field(..., description="Новый статус объявления")
