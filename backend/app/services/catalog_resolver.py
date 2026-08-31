"""Applying a catalogue match to a listing, and queueing what did not resolve.

Split from `catalog_service` on purpose: that one only reads the catalogue, this one
writes to a listing and to the moderation queue. Keeping the read side free of writes is
what lets the decode task and the wizard share it without sharing side effects.
"""

from dataclasses import dataclass
from typing import Optional
from uuid import UUID

from loguru import logger
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.catalog import CatalogSuggestion, SuggestionKind, SuggestionStatus
from app.models.sale_car import FieldSource, SaleCars
from app.services.catalog_normalize import normalize
from app.services.catalog_service import CatalogService


@dataclass(frozen=True)
class ResolveOutcome:
    brand_id: Optional[UUID]
    model_id: Optional[UUID]
    suggested: Optional[str]  # None | "brand" | "model"


class CatalogResolver:
    def __init__(self, db: AsyncSession):
        self.db = db
        self.catalog = CatalogService(db)

    async def resolve_into(self, sale_car: SaleCars, mark_raw: str | None, model_raw: str | None) -> ResolveOutcome:
        """Write what OCR read onto the listing, resolving what can be resolved.

        The raw spellings are always stored, even when both matched. Without them a bad
        fuzzy hit is invisible and unrecoverable: the row says `Toyota Camry` with
        nothing to say the document said `Carina`.

        A listing is never rejected for an unknown make or model. It keeps the raw text,
        publishes, and simply does not appear under that filter until a moderator
        resolves the spelling.

        A field the seller filled in themselves is left alone, and no spelling is queued
        for it: they have seen the car, and this has seen a photograph of a document.
        """
        sale_car.mark_raw = mark_raw
        sale_car.model_raw = model_raw

        brand_owned = sale_car.brand_source == FieldSource.SELLER.value
        model_owned = sale_car.model_source == FieldSource.SELLER.value
        if brand_owned and model_owned:
            return ResolveOutcome(sale_car.brand_id, sale_car.model_id, None)

        brand_match = await self.catalog.match_brand(mark_raw)
        if brand_match.value is None and not brand_owned:
            sale_car.brand_id = None
            sale_car.brand_source = None
            if not model_owned:
                sale_car.model_id = None
                sale_car.model_source = None
            if normalize(mark_raw):
                await self._suggest(SuggestionKind.BRAND, None, mark_raw)
                return ResolveOutcome(None, sale_car.model_id, "brand")
            return ResolveOutcome(None, sale_car.model_id, None)

        if brand_owned:
            # The model is looked up under the make the seller stands behind, not under
            # the one the document was read as: a model only means anything inside a make.
            brand_id = sale_car.brand_id
        else:
            brand = brand_match.value
            brand_id = brand.brand_id
            sale_car.brand_id = brand_id
            sale_car.brand_source = FieldSource.OCR.value
            logger.info(f"catalog: brand {mark_raw!r} -> {brand.slug} via {brand_match.step}")

        if model_owned:
            return ResolveOutcome(brand_id, sale_car.model_id, None)

        model_match = await self.catalog.match_model(brand_id, model_raw)
        if model_match.value is None:
            sale_car.model_id = None
            sale_car.model_source = None
            if normalize(model_raw):
                await self._suggest(SuggestionKind.MODEL, brand_id, model_raw)
                return ResolveOutcome(brand_id, None, "model")
            return ResolveOutcome(brand_id, None, None)

        sale_car.model_id = model_match.value.model_id
        sale_car.model_source = FieldSource.OCR.value
        logger.info(f"catalog: model {model_raw!r} -> {model_match.value.slug} via {model_match.step}")
        return ResolveOutcome(brand_id, model_match.value.model_id, None)

    async def _suggest(self, kind: SuggestionKind, brand_id: Optional[UUID], raw: str) -> None:
        """Queue one spelling, once.

        Deduplicated on (kind, brand, normalised spelling) rather than per listing: ten
        listings spelling Prado the same way are one decision for a moderator, not ten.
        A suggestion already resolved or rejected is not re-opened — that would undo the
        moderator's call every time another listing arrives with the same text.
        """
        raw_norm = normalize(raw)
        existing = await self.db.execute(
            select(CatalogSuggestion).where(
                CatalogSuggestion.kind == kind.value,
                CatalogSuggestion.brand_id == brand_id,
                CatalogSuggestion.raw_norm == raw_norm,
            )
        )
        if existing.scalar_one_or_none() is not None:
            return

        self.db.add(
            CatalogSuggestion(
                kind=kind.value,
                brand_id=brand_id,
                raw_value=raw,
                raw_norm=raw_norm,
                status=SuggestionStatus.PENDING.value,
            )
        )
