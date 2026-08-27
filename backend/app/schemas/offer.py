from pydantic import BaseModel, Field, UUID4
from datetime import datetime
from enum import Enum
from typing import Optional

class OfferStatusEnum(str, Enum):
    pending = "pending"
    accept = "accept"
    reject = "reject"

class OfferCreate(BaseModel):
    sale_car_id: UUID4
    price: float = Field(gt=0)

class OfferStatusUpdate(BaseModel):
    status: OfferStatusEnum

class OfferResponse(BaseModel):
    offer_id: UUID4
    sale_car_id: UUID4
    user_id: UUID4
    price: float
    status: OfferStatusEnum
    created_at: datetime
    updated_at: datetime | None = None  

    model_config = {
        "from_attributes": True  
    }

class OfferWithCarResponse(OfferResponse):
    car: Optional[dict] = None  
    model_config = {"from_attributes": True}