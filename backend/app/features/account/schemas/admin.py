"""Что консоль показывает и что принимает.

Список людей отдаётся страницей, а не массивом всех: при плановых тысячах учётных
записей прежняя форма читала всю таблицу ради одного экрана.
"""

from datetime import datetime
from typing import List, Optional
from uuid import UUID

from pydantic import BaseModel, Field


class UserSummary(BaseModel):
    id: UUID
    role: str
    is_verified: bool
    is_blocked: bool
    created_at: datetime
    name: Optional[str] = None
    avatar_url: Optional[str] = None
    platform: Optional[str] = None
    # Ушедший человек виден консоли ушедшим: иначе модератор пишет тому, кого нет, и не
    # понимает, почему тот молчит.
    deleted_at: Optional[datetime] = None


class UserPage(BaseModel):
    items: List[UserSummary]
    total: int
    page: int
    page_size: int


class UserCard(BaseModel):
    id: UUID
    role: str
    is_verified: bool
    is_blocked: bool
    blocked_reason: Optional[str] = None
    blocked_at: Optional[datetime] = None
    created_at: datetime
    name: Optional[str] = None
    avatar_url: Optional[str] = None
    platform: Optional[str] = None
    deleted_at: Optional[datetime] = None
    listings_total: int
    complaints_total: int


class UserAccess(BaseModel):
    id: UUID
    is_blocked: bool
    blocked_reason: Optional[str] = None
    blocked_at: Optional[datetime] = None


class AccessChange(BaseModel):
    # Пустая причина отсекается схемой, а не сервисом: то же правило, что у отклонения
    # объявления и отказа по заявке — человеку нужно то, что можно оспорить.
    reason: str = Field(min_length=1)


class AuditEntry(BaseModel):
    id: UUID
    action: str
    actor_id: UUID
    actor_name: Optional[str] = None
    reason: str
    details: Optional[str] = None
    created_at: datetime
