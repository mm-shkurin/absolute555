"""What the СТС reading did to a listing, and who owns each field it touched.

Two rules live here and nowhere else. A reading never overwrites what the seller chose:
the seller has seen the car and the document, and the reading has seen a photograph. And
the outcome the seller is shown is a column, not a message — a status pushed down a
stream that nobody was listening to is an outcome nobody can recover by reloading.
"""

from datetime import datetime

from loguru import logger
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.features.catalog.models.catalog import CatalogSuggestion, SuggestionKind, SuggestionStatus
from app.features.listing.models.sale_car import AutofillState, FieldSource, SaleCars
from app.features.catalog.services.catalog_normalize import normalize
from app.features.listing.services.listing_errors import ListingFrozen
from app.features.listing.services.listing_document import ListingDocumentService
from app.queue import enqueue

# The queue reports its own progress in its own vocabulary; this is the translation into
# the three outcomes a seller can act on. Anything not named here leaves the state alone,
# because a step of the pipeline is not an outcome.
STATE_OF_TASK = {
    "Pending": AutofillState.PENDING,
    "Started": AutofillState.PENDING,
    "OcrStarted": AutofillState.PENDING,
    "OcrFailed": AutofillState.UNREADABLE,
    "DecodeFailed": AutofillState.UNDECODED,
    "DecodeSuccess": AutofillState.DONE,
}

EDITABLE_IN = frozenset({"draft", "rejected"})


class ListingAutofillService:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def attach_scan(self, listing: SaleCars, body: bytes, content_type: str) -> SaleCars:
        """Store a new registration scan and put the listing back in the reading state.

        Allowed exactly where editing is allowed: a listing under review must not change
        under the moderator reading it, and a published one must not change under buyers.
        """
        if listing.status not in EDITABLE_IN:
            raise ListingFrozen(listing.status)

        await ListingDocumentService(self.db).attach(listing, body, content_type)
        listing.autofill_state = AutofillState.PENDING.value
        listing.autofill_updated_at = datetime.utcnow()
        await self.db.commit()

        # The job is handed the key, not the bytes: a photograph base64-encoded into a
        # Redis job is megabytes sitting in the broker for something already in object
        # storage. Queued after the commit, so the worker cannot read the row before the
        # scan it is about to fetch is recorded on it.
        # Imported here rather than at module level: the task reports its progress
        # through status_updater, which asks this service to translate it, and the two
        # modules cannot both be importable first.
        from app.tasks.decode_vin import decode_vin_from_sts

        job = await enqueue(decode_vin_from_sts, str(listing.sale_car_id), listing.sts_key)
        listing.task_id = getattr(job, "job_id", None)
        listing.task_status = "Pending"
        await self.db.commit()
        return listing

    async def note_task_status(self, listing: SaleCars, task_status: str) -> None:
        """Translate one step of the queue into the outcome the seller sees."""
        state = STATE_OF_TASK.get(task_status)
        if state is None:
            return
        listing.autofill_state = state.value
        listing.autofill_updated_at = datetime.utcnow()

    def owns(self, listing: SaleCars, field: str) -> bool:
        """True when the seller chose this field themselves and a reading must not touch it."""
        return getattr(listing, f"{field}_source", None) == FieldSource.SELLER.value

    async def claim(self, listing: SaleCars, fields: dict) -> None:
        """Record a make or model in the payload as the seller's own choice.

        Their choice also answers the question the moderator was queued: whoever picks
        `Toyota Land Cruiser Prado` over the document's `LC PRADO 150` has already given
        the answer the queue was collecting.
        """
        if "brand_id" in fields:
            listing.brand_source = FieldSource.SELLER.value
            await self._close(listing, SuggestionKind.BRAND, None, listing.mark_raw)
        if "model_id" in fields:
            listing.model_source = FieldSource.SELLER.value
            await self._close(listing, SuggestionKind.MODEL, listing.brand_id, listing.model_raw)

    async def _close(self, listing: SaleCars, kind: SuggestionKind, brand_id, raw) -> None:
        raw_norm = normalize(raw)
        if not raw_norm:
            return

        found = await self.db.execute(
            select(CatalogSuggestion).where(
                CatalogSuggestion.kind == kind.value,
                CatalogSuggestion.brand_id == brand_id,
                CatalogSuggestion.raw_norm == raw_norm,
                CatalogSuggestion.status == SuggestionStatus.PENDING.value,
            )
        )
        suggestion = found.scalar_one_or_none()
        if suggestion is None:
            return

        if await self._still_wanted(listing, kind, raw):
            # One seller answering for their own listing does not answer for everyone
            # else's: the queue row is shared by every listing spelling it this way, and
            # closing it early would leave the others with no route into the catalogue.
            return

        # Closed as resolved rather than deleted: the queue is a record of what the
        # catalogue was missing, and a moderator reviewing it later can still see that
        # this spelling occurred and how it was settled.
        suggestion.status = SuggestionStatus.RESOLVED.value
        suggestion.resolved_at = datetime.utcnow()
        logger.info(f"catalog: seller settled the {kind.value} spelling {raw!r}")

    async def _still_wanted(self, listing: SaleCars, kind: SuggestionKind, raw) -> bool:
        """Whether another listing is still waiting on this spelling."""
        spelling = SaleCars.mark_raw if kind is SuggestionKind.BRAND else SaleCars.model_raw
        unresolved = SaleCars.brand_id if kind is SuggestionKind.BRAND else SaleCars.model_id
        others = await self.db.execute(
            select(SaleCars.sale_car_id).where(
                spelling == raw,
                unresolved.is_(None),
                SaleCars.sale_car_id != listing.sale_car_id,
            )
        )
        return others.first() is not None
