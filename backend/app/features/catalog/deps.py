"""Service providers of the catalog feature: where its routers get services, wired with their collaborators."""

from fastapi import Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.database import get_db
from app.features.catalog.services.catalog_resolver import CatalogResolver
from app.features.catalog.services.catalog_service import CatalogService


def get_catalog_service(db: AsyncSession = Depends(get_db)) -> CatalogService:
    return CatalogService(db)


def build_catalog_resolver(db: AsyncSession) -> CatalogResolver:
    return CatalogResolver(db, CatalogService(db))
