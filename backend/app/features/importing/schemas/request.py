"""Провод заявок покупателя и откликов поставщиков."""

from datetime import datetime
from typing import List, Optional
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field

from app.features.importing.models.request import RequestStatus


class BuyerRequestCreate(BaseModel):
    model_config = ConfigDict(extra="forbid")

    brand_id: Optional[UUID] = None
    model_id: Optional[UUID] = None
    year_from: Optional[int] = Field(default=None, ge=1950, le=2100)
    budget_max: Optional[float] = Field(default=None, ge=0)
    comment: Optional[str] = Field(default=None, max_length=2000)


class BuyerRequestResponse(BaseModel):
    request_id: UUID
    user_id: UUID
    brand: Optional[str] = None
    model: Optional[str] = None
    year_from: Optional[int] = None
    budget_max: Optional[float] = None
    comment: Optional[str] = None
    status: RequestStatus
    responses_count: int = 0
    created_at: Optional[datetime] = None


class BuyerRequestPage(BaseModel):
    items: List[BuyerRequestResponse]
    total: int
    page: int
    size: int


class SupplierResponseCreate(BaseModel):
    model_config = ConfigDict(extra="forbid")

    price: float = Field(ge=0)
    delivery_days: int = Field(ge=1, le=365)
    comment: Optional[str] = Field(default=None, max_length=2000)


class SupplierResponseView(BaseModel):
    response_id: UUID
    request_id: UUID
    supplier_id: UUID
    price: float
    delivery_days: int
    comment: Optional[str] = None
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True
