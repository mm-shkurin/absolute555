from datetime import datetime
from typing import List
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field


class Photo(BaseModel):
    photo_id: str
    url: str
    preview_url: str


class GalleryResponse(BaseModel):
    sale_car_id: UUID
    photos: List[Photo]
    limit: int


class PhotoOrder(BaseModel):
    model_config = ConfigDict(extra="forbid")

    photo_ids: List[str] = Field(..., min_length=1)


class DocumentLink(BaseModel):
    url: str
    expires_at: datetime
