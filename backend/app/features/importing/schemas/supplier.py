"""Провод профиля поставщика."""

from datetime import datetime
from typing import Any, Dict, List, Optional
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field, computed_field

from app.features.importing.models.supplier import SupplierStatus
from app.shared.storage.s3_service import s3_service


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
    # Ключ читается из строки, но на провод не едет: наружу уходит собранный адрес.
    cover_key: Optional[str] = Field(default=None, exclude=True)

    @computed_field
    @property
    def cover_url(self) -> Optional[str]:
        # Адрес, который открывает браузер, а не внутренний адрес хранилища: с `make_url`
        # приходило `minio:9000`, и фото не показывалось нигде.
        return s3_service.get_public_photo_url(self.cover_key) if self.cover_key else None

    class Config:
        from_attributes = True


class SupplierOwnProfileResponse(SupplierProfileResponse):
    """Профиль глазами владельца и модератора: с правкой, которая ждёт проверки.

    Отдельная схема, а не поля в общей: публичная витрина не должна показывать текст,
    который модератор ещё не одобрил.
    """

    pending_changes: Optional[Dict[str, Any]] = None
    revision_status: Optional[SupplierStatus] = None

    @computed_field
    @property
    def pending_cover_url(self) -> Optional[str]:
        """Фото из правки — его видят владелец и модератор до решения."""
        key = (self.pending_changes or {}).get("cover_key")
        return s3_service.get_public_photo_url(key) if key else None


class SupplierPage(BaseModel):
    items: List[SupplierProfileResponse]
    total: int
    page: int
    size: int


class SupplierQueue(BaseModel):
    items: List[SupplierOwnProfileResponse]
    total: int


class SupplierRejection(BaseModel):
    reason: str = Field(min_length=1, max_length=1000)
