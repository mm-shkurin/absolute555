from datetime import datetime
from typing import List, Optional

from pydantic import BaseModel, Field, UUID4

from app.features.listing.schemas.feed import Seller


class ReviewCreate(BaseModel):
    rating: int = Field(ge=1, le=5)
    text: Optional[str] = Field(default=None, max_length=2000)


class ReviewPatch(BaseModel):
    """A field left out stays as it was: a correction is not a rewrite."""

    rating: Optional[int] = Field(default=None, ge=1, le=5)
    text: Optional[str] = Field(default=None, max_length=2000)


class ReviewResponse(BaseModel):
    review_id: UUID4
    offer_id: UUID4
    seller_id: UUID4
    author: Optional[Seller] = None
    rating: int
    text: Optional[str] = None
    created_at: datetime
    updated_at: Optional[datetime] = None
    editable_until: Optional[datetime] = None

    model_config = {"from_attributes": True}


class ReviewPage(BaseModel):
    items: List[ReviewResponse]
    total: int
    page: int
    size: int


class SellerProfileResponse(BaseModel):
    user_id: UUID4
    name: Optional[str] = None
    avatar_url: Optional[str] = None
    rating: Optional[float] = None
    reviews_count: int = 0
    deals_count: int = 0
    listings_count: int = 0
    member_since: Optional[datetime] = None


class SellerListingPage(BaseModel):
    items: List[dict]
    total: int
    page: int
    size: int
