from pydantic import BaseModel, Field, UUID4
from datetime import datetime
from enum import Enum
from typing import Optional

from app.features.offer.domain.statuses import OfferStatus

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
    status: OfferStatus
    expires_at: datetime | None = None
    created_at: datetime
    updated_at: datetime | None = None

    # Only meaningful on one's own offers: the review is left by the buyer, so a seller
    # reading offers received always sees both empty.
    can_review: bool = False
    review_id: UUID4 | None = None

    model_config = {
        "from_attributes": True
    }

class OfferWithCarResponse(OfferResponse):
    car: Optional[dict] = None
    model_config = {"from_attributes": True}
