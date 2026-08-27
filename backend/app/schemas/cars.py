from pydantic import BaseModel, field_validator
from typing import List, Optional
from uuid import UUID
from datetime import datetime

class CarBase(BaseModel):
    vin: Optional[str]
    task_status: Optional[str]

class CarCreate(CarBase):
    sts_photo_bytes: bytes  

class CarPhotoUpload(BaseModel):
    photos_bytes: List[bytes]  

class CarUpdate(BaseModel):
    vin: Optional[str] = None
    mark: Optional[str] = None
    model: Optional[str] = None
    year: Optional[str] = None
    transmission: Optional[str] = None
    engine_power: Optional[int] = None
    body_type: Optional[str] = None
    fuel_type: Optional[str] = None
    drive_type: Optional[str] = None

class CarUpdateResponse(BaseModel):
    car_id: UUID
    user_id: UUID
    vin: Optional[str]
    chroma_document_id: Optional[str]
    task_status: Optional[str]
    updated_at: datetime
    message: str = "Car updated successfully"
    
    class Config:
        from_attributes = True

class CarResponse(CarBase):
    car_id: UUID
    user_id: UUID
    chroma_document_id: Optional[str]
    s3_photo_car_keys: Optional[List[str]] = None
    task_id: Optional[str] = None
    task_status: Optional[str]
    created_at: Optional[datetime]
    updated_at: Optional[datetime]
    
    mark: Optional[str] = None
    model: Optional[str] = None
    year: Optional[str] = None
    transmission: Optional[str] = None
    engine_power: Optional[int] = None  
    body_type: Optional[str] = None
    fuel_type: Optional[str] = None
    drive_type: Optional[str] = None

    @field_validator('engine_power', mode='before')
    @classmethod
    def validate_engine_power(cls, v):
        if v == "" or v is None:
            return None
        if isinstance(v, str):
            try:
                return int(v)
            except ValueError:
                return None
        return v

    class Config:
        from_attributes = True
