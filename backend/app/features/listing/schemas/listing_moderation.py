from datetime import datetime
from typing import Optional
from uuid import UUID

from pydantic import BaseModel

from app.features.listing.statuses import SaleCarStatus


class Moderator(BaseModel):
    user_id: UUID
    name: Optional[str] = None


class Moderation(BaseModel):
    """Последнее решение модератора по объявлению.

    decided_by заполнено только модератору: продавец видит, когда решили и за что
    вернули, но не кем.
    """

    decided_at: Optional[datetime] = None
    decided_by: Optional[Moderator] = None


class SaleCarStatusChanged(BaseModel):
    sale_car_id: UUID
    status: SaleCarStatus
    updated_at: datetime
