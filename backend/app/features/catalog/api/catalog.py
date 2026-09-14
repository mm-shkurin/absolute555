from typing import List
from uuid import UUID

from fastapi import APIRouter, Depends
from app.features.catalog.deps import get_catalog_service

from app.core.exceptions import ResourceNotFoundError
from app.features.catalog.schemas.catalog import BrandResponse, CarModelResponse
from app.features.catalog.services.catalog_service import CatalogService

catalog_router = APIRouter()


# Public: the feed filter and the landing page are readable by a guest, and both need the
# brand list before anyone has signed in.
@catalog_router.get("/brands", response_model=List[BrandResponse])
async def list_brands(catalog_service: CatalogService = Depends(get_catalog_service)):
    return await catalog_service.list_brands()


@catalog_router.get("/brands/{brand_id}/models", response_model=List[CarModelResponse])
async def list_models(brand_id: UUID, catalog_service: CatalogService = Depends(get_catalog_service)):
    if await catalog_service.get_brand(brand_id) is None:
        raise ResourceNotFoundError("Brand not found", code="BRAND_NOT_FOUND")
    return await catalog_service.list_models(brand_id)
