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


class RequestCard(BaseModel):
    """Заявка, на которую откликнулся поставщик, — шапка такой переписки."""

    request_id: UUID
    brand: Optional[str] = None
    model: Optional[str] = None
    year_from: Optional[int] = None
    budget_max: Optional[float] = None
    status: str


class DialogResponse(BaseModel):
    dialog_id: UUID
    # Пусто у переписки по заявке: спрос — не объявление, машины за ним ещё нет.
    sale_car_id: Optional[UUID] = None
    listing: Optional[FeedCard] = None
    request: Optional[RequestCard] = None
    counterpart: Optional[Seller] = None
    last_message: Optional[MessageResponse] = None
    unread: int = 0
    # Оценивает спрашивавший: покупатель — продавца, автор заявки — поставщика. Отвечающему
    # кнопка не нужна, и сервер говорит это сам, а не оставляет экрану угадывать по ролям.
    can_review: bool = False
    review_id: Optional[UUID] = None


class ReadResult(BaseModel):
    marked: int
    unread: int


class UnreadCount(BaseModel):
    unread: int
