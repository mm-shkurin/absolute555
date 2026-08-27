"""Load car_catalog.json into the catalogue tables.

A seeder rather than a migration, and idempotent, because the catalogue grows: every
approved suggestion and every hand addition would otherwise be a new migration, and a
migration that has already run on production cannot be edited.

Run it from the repo root inside the backend container:

    docker compose exec backend python -m app.data.seed_catalog

Existing rows are updated, never deleted. A brand or model removed from the JSON stays
in the database on purpose — listings point at it, and dropping it would orphan them.
"""

import asyncio
import json
from pathlib import Path

from loguru import logger
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.database import get_db_session
from app.models.catalog import Brand, BrandAlias, CarModel, ModelAlias
from app.services.catalog_normalize import normalize, slugify

CATALOG_PATH = Path(__file__).with_name("car_catalog.json")


async def _sync_brand(db: AsyncSession, entry: dict) -> Brand:
    result = await db.execute(select(Brand).where(Brand.slug == entry["slug"]))
    brand = result.scalar_one_or_none()
    if brand is None:
        brand = Brand(slug=entry["slug"])
        db.add(brand)
    brand.name_ru = entry["name_ru"]
    brand.name_en = entry["name_en"]
    brand.is_popular = entry.get("is_popular", False)
    await db.flush()
    return brand


async def _sync_aliases(db: AsyncSession, brand: Brand, entry: dict) -> None:
    # The brand's own names are aliases too. OCR reads what is printed on the СТС, which
    # is the full name, not the slug we invented.
    wanted = {normalize(a) for a in entry.get("aliases", [])}
    wanted |= {normalize(entry["name_ru"]), normalize(entry["name_en"])}
    wanted.discard("")

    existing = await db.execute(select(BrandAlias).where(BrandAlias.brand_id == brand.brand_id))
    have = {a.alias_norm for a in existing.scalars().all()}
    for alias in wanted - have:
        db.add(BrandAlias(brand_id=brand.brand_id, alias_norm=alias))


async def _sync_models(db: AsyncSession, brand: Brand, entry: dict) -> int:
    existing = await db.execute(select(CarModel).where(CarModel.brand_id == brand.brand_id))
    by_slug = {m.slug: m for m in existing.scalars().all()}

    added = 0
    for name in entry.get("models", []):
        slug = slugify(name)
        model = by_slug.get(slug)
        if model is None:
            model = CarModel(brand_id=brand.brand_id, slug=slug, name=name)
            db.add(model)
            await db.flush()
            added += 1
        else:
            model.name = name

        alias = normalize(name)
        found = await db.execute(
            select(ModelAlias).where(
                ModelAlias.brand_id == brand.brand_id, ModelAlias.alias_norm == alias
            )
        )
        if found.scalar_one_or_none() is None:
            db.add(ModelAlias(model_id=model.model_id, brand_id=brand.brand_id, alias_norm=alias))
    return added


async def seed() -> None:
    payload = json.loads(CATALOG_PATH.read_text(encoding="utf-8"))
    brands = payload["brands"]

    async with get_db_session() as db:
        new_models = 0
        for entry in brands:
            brand = await _sync_brand(db, entry)
            await _sync_aliases(db, brand, entry)
            new_models += await _sync_models(db, brand, entry)
        await db.commit()

    logger.info(f"catalog seeded: {len(brands)} brands, {new_models} models added")


if __name__ == "__main__":
    asyncio.run(seed())
