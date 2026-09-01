"""Reading the catalogue and resolving what OCR read against it."""

from dataclasses import dataclass
from typing import Optional
from uuid import UUID

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.features.catalog.models.catalog import Brand, BrandAlias, CarModel, ModelAlias
from app.features.catalog.services.catalog_normalize import normalize

# Above this trigram similarity a make is taken as resolved; below it the spelling goes
# to a moderator. Chosen from the seeded catalogue rather than guessed: the most similar
# pair of distinct makes in it scores 0.333 (`gac`/`gaz`, `daihatsu`/`datsun`), while
# single-character OCR damage scores 0.40 and up (`toyata` 0.400, `nissian` 0.500,
# `hyundal` 0.600, `toyotta` 0.667). Raising this to be "safe" only means unknown makes
# pile up in the queue; lowering it past 0.35 starts merging real makes.
BRAND_FUZZY_ACCEPT = 0.40

# Models get no fuzzy step at all, and this is the important half of the design.
# Within one make, genuinely different models are far more similar to each other than a
# typo is to its target: `tiggo-7-pro` and `tiggo-8-pro` score 0.714, `land-cruiser` and
# `land-cruiser-80` score 0.813, `carina` and `carina-e` 0.778 — all different cars. OCR
# damage scores 0.40-0.67. The ranges are not merely overlapping, they are inverted, so
# any threshold that repaired a typo would first have merged two real models. An
# unmatched model spelling goes to the queue, where a human reads it once and writes an
# alias; a wrong model silently recorded is a listing nobody can find and nobody can
# spot.


@dataclass(frozen=True)
class Match:
    """What the ladder concluded. `value` is None when nothing was confidently resolved."""

    value: Optional[object]
    step: str  # exact | alias | fuzzy | none


class CatalogService:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def list_brands(self) -> list[Brand]:
        result = await self.db.execute(
            select(Brand).order_by(Brand.is_popular.desc(), Brand.name_en)
        )
        return list(result.scalars().all())

    async def list_models(self, brand_id: UUID) -> list[CarModel]:
        result = await self.db.execute(
            select(CarModel).where(CarModel.brand_id == brand_id).order_by(CarModel.name)
        )
        return list(result.scalars().all())

    async def get_brand(self, brand_id: UUID) -> Optional[Brand]:
        return await self.db.get(Brand, brand_id)

    async def match_brand(self, raw: str | None) -> Match:
        key = normalize(raw)
        if not key:
            return Match(None, "none")

        exact = await self.db.execute(select(Brand).where(Brand.slug == key.lower()))
        found = exact.scalar_one_or_none()
        if found:
            return Match(found, "exact")

        aliased = await self.db.execute(
            select(Brand).join(BrandAlias).where(BrandAlias.alias_norm == key)
        )
        found = aliased.scalar_one_or_none()
        if found:
            return Match(found, "alias")

        fuzzy = await self.db.execute(
            select(Brand, func.similarity(Brand.slug, key.lower()).label("sim"))
            .where(func.similarity(Brand.slug, key.lower()) >= BRAND_FUZZY_ACCEPT)
            .order_by(func.similarity(Brand.slug, key.lower()).desc())
            .limit(1)
        )
        row = fuzzy.first()
        return Match(row[0], "fuzzy") if row else Match(None, "none")

    async def match_model(self, brand_id: UUID, raw: str | None) -> Match:
        """Resolve a model spelling **within one brand**.

        Never search models globally: `Focus`, `Corolla` and `Note` are unremarkable
        strings that several manufacturers have used, and an unscoped match picks
        whichever row the index happened to reach first.
        """
        key = normalize(raw)
        if not key:
            return Match(None, "none")

        exact = await self.db.execute(
            select(CarModel).where(CarModel.brand_id == brand_id, CarModel.slug == key.lower())
        )
        found = exact.scalar_one_or_none()
        if found:
            return Match(found, "exact")

        aliased = await self.db.execute(
            select(CarModel)
            .join(ModelAlias, ModelAlias.model_id == CarModel.model_id)
            .where(ModelAlias.brand_id == brand_id, ModelAlias.alias_norm == key)
        )
        found = aliased.scalar_one_or_none()
        if found:
            return Match(found, "alias")

        # No fuzzy step here — see the note on BRAND_FUZZY_ACCEPT. The ladder ends at
        # aliases, and everything below it is a moderator's decision.
        return Match(None, "none")
