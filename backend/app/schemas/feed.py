"""The feed's query and its answer.

The query is a model rather than a dozen loose parameters so that the rules binding
them — a model needs its make, a range needs its ends in order — are stated once, next
to the fields, and answered as one refusal instead of a partial reading.
"""

from enum import Enum
from typing import List, Optional
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field, model_validator

from app.models.sale_car import SaleCarStatus

MAX_PAGE_SIZE = 60


class FeedSort(str, Enum):
    NEWEST = "newest"
    PRICE_ASC = "price_asc"
    PRICE_DESC = "price_desc"


class FeedQuery(BaseModel):
    model_config = ConfigDict(extra="forbid")

    brand_id: Optional[UUID] = None
    model_id: Optional[UUID] = None
    year_from: Optional[int] = None
    year_to: Optional[int] = None
    price_from: Optional[float] = None
    price_to: Optional[float] = None
    mileage_from: Optional[float] = None
    mileage_to: Optional[float] = None
    transmission: List[str] = Field(default_factory=list)
    sort: FeedSort = FeedSort.NEWEST
    page: int = Field(default=1, ge=1)
    size: int = Field(default=20, ge=1, le=MAX_PAGE_SIZE)

    @model_validator(mode="after")
    def _model_needs_its_make(self):
        if self.model_id is not None and self.brand_id is None:
            raise ValueError("model_id needs brand_id: a model outside a make means nothing")
        return self

    @model_validator(mode="after")
    def _ranges_run_forwards(self):
        for low, high in (("year_from", "year_to"), ("price_from", "price_to"), ("mileage_from", "mileage_to")):
            start, end = getattr(self, low), getattr(self, high)
            if start is not None and end is not None and start > end:
                # Answered rather than refused, a backwards range returns an empty feed,
                # which reads as an honest "nothing matches" for what is a typo.
                raise ValueError(f"{low} is above {high}")
        return self


class FeedCard(BaseModel):
    """What the card on the list actually shows.

    The feed answers twenty of these at a time, so a field nobody draws is twenty
    copies of it — the description and the phone number are the two that matter.
    """

    sale_car_id: UUID
    brand: Optional[str] = None
    model: Optional[str] = None
    year: Optional[int] = None
    price: Optional[float] = None
    milleage: Optional[float] = None
    transmission: Optional[str] = None
    status: SaleCarStatus
    preview_photo_url: Optional[str] = None
    published_at: Optional[str] = None


class FeedPage(BaseModel):
    items: List[FeedCard]
    total: int
    page: int
    size: int


class Seller(BaseModel):
    user_id: UUID
    name: Optional[str] = None
    avatar_url: Optional[str] = None

    # The aggregate travels with the seller block wherever it appears -- the card, the
    # moderation row -- rather than through a call of its own: three numbers do not earn
    # a request per screen. None rather than 0 for an unrated seller: a zero reads as a
    # rating of zero rather than as no ratings.
    rating: Optional[float] = None
    reviews_count: int = 0
    deals_count: int = 0


class PhoneRevealed(BaseModel):
    phone_number: str
