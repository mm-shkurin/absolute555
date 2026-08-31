"""The wire contract of moderation: the queue, the counts, complaints and rejections."""

from datetime import datetime
from typing import List, Optional
from uuid import UUID

from pydantic import BaseModel, ConfigDict

from app.models.complaint import ComplaintReason, ComplaintStatus
from app.models.sale_car import RejectionLabel
from app.schemas.feed import FeedCard, Seller


class RejectionReason(BaseModel):
    """Why a listing is turned back. The label is required, the comment is not."""

    model_config = ConfigDict(extra="forbid")

    label: RejectionLabel
    comment: Optional[str] = None


class ComplaintCreate(BaseModel):
    model_config = ConfigDict(extra="forbid")

    reason: ComplaintReason
    text: Optional[str] = None


class ComplaintResponse(BaseModel):
    complaint_id: UUID
    sale_car_id: UUID
    author: Optional[Seller] = None
    reason: ComplaintReason
    text: Optional[str] = None
    status: ComplaintStatus
    created_at: datetime
    handled_at: Optional[datetime] = None


class QueueItem(FeedCard):
    seller: Optional[Seller] = None
    open_complaints: int = 0
    submitted_at: Optional[str] = None


class QueuePage(BaseModel):
    items: List[QueueItem]
    total: int
    page: int
    size: int


class ComplaintGroup(BaseModel):
    sale_car_id: UUID
    listing: Optional[FeedCard] = None
    complaints: List[ComplaintResponse]


class ComplaintPage(BaseModel):
    items: List[ComplaintGroup]
    total: int
    page: int
    size: int


class QueueCounts(BaseModel):
    waiting: int
    complained: int
    handled_today: int
