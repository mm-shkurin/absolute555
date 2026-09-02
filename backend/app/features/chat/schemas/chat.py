"""The wire contract of the chat."""

from datetime import datetime
from typing import List, Optional
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field

from app.features.chat.models.chat import MessageKind
from app.features.listing.schemas.feed import FeedCard, Seller


class MessageWrite(BaseModel):
    model_config = ConfigDict(extra="forbid")

    # Only the text. The kind is not a field a client may set: a system line has no human
    # author, and one that could be sent would let anyone write "the offer was accepted".
    text: str = Field(..., min_length=1, max_length=4000)


class ReadRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")

    message_ids: List[UUID] = Field(..., min_length=1)


class MessageResponse(BaseModel):
    message_id: UUID
    dialog_id: UUID
    author_id: Optional[UUID] = None
    kind: MessageKind
    text: str
    read_at: Optional[datetime] = None
    created_at: datetime


class MessagePage(BaseModel):
    items: List[MessageResponse]
    total: int
    page: int
    size: int


class DialogResponse(BaseModel):
    dialog_id: UUID
    sale_car_id: UUID
    listing: Optional[FeedCard] = None
    counterpart: Optional[Seller] = None
    last_message: Optional[MessageResponse] = None
    unread: int = 0


class ReadResult(BaseModel):
    marked: int
    unread: int


class UnreadCount(BaseModel):
    unread: int
