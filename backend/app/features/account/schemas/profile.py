"""Профиль на проводе: то, что человек про себя видит и правит."""

from datetime import datetime
from typing import Optional
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field


class ProfilePatch(BaseModel):
    """Пустая строка возвращает профиль к имени провайдера."""

    model_config = ConfigDict(extra="forbid")

    name: str = Field(max_length=60)


class Profile(BaseModel):
    id: UUID
    name: Optional[str] = None
    avatar_url: Optional[str] = None
    role: Optional[str] = None
    is_guest: bool = False
    is_verified: bool = False
    rating: Optional[float] = None
    reviews_count: int = 0
    deals_count: int = 0
    created_at: Optional[datetime] = None
