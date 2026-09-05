"""Провод профиля поставщика."""

from datetime import datetime
from typing import List, Optional
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field

from app.features.importing.models.supplier import SupplierStatus


class SupplierProfileUpdate(BaseModel):
    model_config = ConfigDict(extra="forbid")

    company_name: Optional[str] = Field(default=None, max_length=120)
    countries: Optional[List[str]] = None
    brands: Optional[List[str]] = None
    delivery_days_min: Optional[int] = Field(default=None, ge=1, le=365)
    delivery_days_max: Optional[int] = Field(default=None, ge=1, le=365)
    terms: Optional[str] = Field(default=None, max_length=4000)
    description: Optional[str] = Field(default=None, max_length=4000)


class SupplierProfileResponse(BaseModel):
    user_id: UUID
    company_name: Optional[str] = None
    countries: List[str] = []
    brands: List[str] = []
    delivery_days_min: Optional[int] = None
    delivery_days_max: Optional[int] = None
    terms: Optional[str] = None
    description: Optional[str] = None
    status: SupplierStatus
    reject_reason: Optional[str] = None
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class SupplierPage(BaseModel):
    items: List[SupplierProfileResponse]
    total: int
    page: int
    size: int


class SupplierQueue(BaseModel):
    items: List[SupplierProfileResponse]
    total: int


class SupplierRejection(BaseModel):
    reason: str = Field(min_length=1, max_length=1000)
