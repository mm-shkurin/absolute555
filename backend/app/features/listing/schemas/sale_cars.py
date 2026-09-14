from datetime import datetime
from typing import List, Optional
from uuid import UUID

from pydantic import BaseModel

# One vocabulary for the wire and the row. Re-declaring the six values here is how the
# two drift apart the first time one is extended.
from app.features.listing.statuses import ListingKind, SaleCarStatus
from app.features.listing.schemas.autofill import Autofill, StsAccepted, VinDecodeRequest
from app.features.listing.schemas.feed import Seller
from app.features.listing.schemas.listing_edit import (
    DraftKind,
    SaleCarCreate,
    SaleCarUpdate,
    SaleCarUpdateResponse,
)
from app.features.listing.schemas.listing_moderation import (
    Moderation,
    Moderator,
    SaleCarStatusChanged,
)
from app.features.listing.schemas.photos import DocumentLink, GalleryResponse, Photo, PhotoOrder
from app.features.listing.schemas.thickness import ThicknessSummary

__all__ = [
    "Autofill",
    "DocumentLink",
    "DraftKind",
    "GalleryResponse",
    "Moderation",
    "Moderator",
    "Photo",
    "PhotoOrder",
    "SaleCarCreate",
    "SaleCarResponse",
    "SaleCarStatusChanged",
    "SaleCarUpdate",
    "SaleCarUpdateResponse",
    "StsAccepted",
    "VinDecodeRequest",
]


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
    moderation: Optional[Moderation] = None
    phone_visible: bool = True
    chat_allowed: bool = True
    offers_visible: bool = False
    seller: Optional[Seller] = None
    thickness: Optional[ThicknessSummary] = None

    class Config:
        from_attributes = True
