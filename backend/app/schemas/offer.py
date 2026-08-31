from pydantic import BaseModel, Field, UUID4
from datetime import datetime
from enum import Enum
from typing import Optional

class OfferStatusEnum(str, Enum):
    """What the screen writes under an offer.

    withdrawn, expired and car_sold are three different sentences to a buyer: you took it
    back, nobody answered, somebody else bought the car.
    """

    pending = "pending"
    accepted = "accepted"
    rejected = "rejected"
    withdrawn = "withdrawn"
    expired = "expired"
    car_sold = "car_sold"


class OfferDecision(str, Enum):
    """What a seller may answer. The other three statuses are nobody's decision."""

    accepted = "accepted"
    rejected = "rejected"

class OfferCreate(BaseModel):
    sale_car_id: UUID4
    price: float = Field(gt=0)

class OfferStatusUpdate(BaseModel):
    status: OfferDecision

class OfferResponse(BaseModel):
    offer_id: UUID4
    sale_car_id: UUID4
    user_id: UUID4
    price: float
    status: OfferStatusEnum
    expires_at: datetime | None = None
    created_at: datetime
    updated_at: datetime | None = None  

    model_config = {
        "from_attributes": True  
    }

class OfferWithCarResponse(OfferResponse):
    car: Optional[dict] = None  
    model_config = {"from_attributes": True}