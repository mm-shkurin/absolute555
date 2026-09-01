from uuid import UUID

from pydantic import BaseModel, ConfigDict


class BrandResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    brand_id: UUID
    slug: str
    name_ru: str
    name_en: str
    is_popular: bool


class CarModelResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    model_id: UUID
    brand_id: UUID
    slug: str
    name: str
