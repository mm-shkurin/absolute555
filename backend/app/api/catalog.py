from typing import List
from uuid import UUID

from fastapi import APIRouter, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.exceptions import ResourceNotFoundError
from app.db.database import get_db
from app.schemas.catalog import BrandResponse, CarModelResponse
from app.services.catalog_service import CatalogService

catalog_router = APIRouter()


# Public: the feed filter and the landing page are readable by a guest, and both need the
# brand list before anyone has signed in.
@catalog_router.get("/brands", response_model=List[BrandResponse])
async def list_brands(db: AsyncSession = Depends(get_db)):
    return await CatalogService(db).list_brands()


@catalog_router.get("/brands/{brand_id}/models", response_model=List[CarModelResponse])
async def list_models(brand_id: UUID, db: AsyncSession = Depends(get_db)):
    service = CatalogService(db)
    if await service.get_brand(brand_id) is None:
        raise ResourceNotFoundError("Brand not found", code="BRAND_NOT_FOUND")
    return await service.list_models(brand_id)
