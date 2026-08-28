"""The listing lifecycle: what a listing may become, and from where.

Every transition goes through `_move`, which consults the table on the model rather than
a branch per case. The seller-facing actions differ only in their target status; the two
boundaries that carry a rule of their own -- submit, which checks completeness, and
reject, which requires a reason -- say so explicitly.
"""

import uuid
from datetime import datetime
from typing import Optional

from loguru import logger
from sqlalchemy import func, select
from sqlalchemy.orm import selectinload
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.sale_car import (
    ALLOWED_TRANSITIONS,
    MAX_DRAFTS_PER_USER,
    REQUIRED_TO_SUBMIT,
    SaleCars,
    SaleCarStatus,
)
from app.services.listing_errors import (
    ListingFrozen,
    ListingIncomplete,
    ListingNotFound,
    RejectionNeedsReason,
    TooManyDrafts,
    TransitionNotAllowed,
)
from app.services.webhook_service import WebhookService

EDITABLE_IN = frozenset({SaleCarStatus.DRAFT, SaleCarStatus.REJECTED})


class ListingLifecycleService:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def create_draft(self, user_id: str) -> SaleCars:
        owner = uuid.UUID(user_id)
        drafts = await self.db.execute(
            select(func.count())
            .select_from(SaleCars)
            .where(SaleCars.user_id == owner, SaleCars.status == SaleCarStatus.DRAFT)
        )
        if drafts.scalar_one() >= MAX_DRAFTS_PER_USER:
            raise TooManyDrafts(MAX_DRAFTS_PER_USER)

        draft = SaleCars(user_id=owner, status=SaleCarStatus.DRAFT)
        self.db.add(draft)
        await self.db.commit()
        return await self.get(str(draft.sale_car_id))

    async def get(self, listing_id: str) -> SaleCars:
        try:
            key = uuid.UUID(listing_id)
        except ValueError:
            raise ListingNotFound(listing_id)
        found = await self.db.execute(
            select(SaleCars)
            .options(selectinload(SaleCars.brand), selectinload(SaleCars.model))
            .where(SaleCars.sale_car_id == key)
        )
        listing = found.scalar_one_or_none()
        if listing is None:
            raise ListingNotFound(listing_id)
        return listing

    async def edit(self, listing_id: str, fields: dict) -> SaleCars:
        listing = await self.get(listing_id)
        if listing.status not in EDITABLE_IN:
            # A listing under review is frozen: otherwise a moderator reads one text and
            # a different one is published.
            raise ListingFrozen(listing.status)

        for name, value in fields.items():
            setattr(listing, name, value)
        await self.db.commit()
        await self._reload(listing)
        return listing

    async def submit(self, listing_id: str) -> SaleCars:
        listing = await self.get(listing_id)
        missing = self._missing(listing)
        if missing and listing.status == SaleCarStatus.DRAFT:
            raise ListingIncomplete(missing)
        return await self._move(listing, SaleCarStatus.MODERATION)

    async def withdraw(self, listing_id: str) -> SaleCars:
        return await self._move(await self.get(listing_id), SaleCarStatus.WITHDRAWN)

    async def mark_sold(self, listing_id: str) -> SaleCars:
        return await self._move(await self.get(listing_id), SaleCarStatus.SOLD)

    async def republish(self, listing_id: str) -> SaleCars:
        return await self._move(await self.get(listing_id), SaleCarStatus.MODERATION)

    async def approve(self, listing_id: str) -> SaleCars:
        listing = await self._move(await self.get(listing_id), SaleCarStatus.PUBLISHED)
        listing.published_at = datetime.utcnow()
        listing.reject_reason = None
        await self.db.commit()
        await self._reload(listing)
        return listing

    async def reject(self, listing_id: str, reason: Optional[str]) -> SaleCars:
        if not reason or not reason.strip():
            raise RejectionNeedsReason()
        listing = await self._move(await self.get(listing_id), SaleCarStatus.REJECTED)
        listing.reject_reason = reason.strip()
        await self.db.commit()
        await self._reload(listing)
        return listing

    async def revise(self, listing_id: str) -> SaleCars:
        listing = await self._move(await self.get(listing_id), SaleCarStatus.DRAFT)
        listing.reject_reason = None
        await self.db.commit()
        await self._reload(listing)
        return listing

    async def _reload(self, listing: SaleCars) -> None:
        # Only the columns. A full refresh expires the eagerly loaded make and model, and
        # the next attribute read would try to lazy-load them outside the greenlet.
        await self.db.refresh(
            listing,
            attribute_names=["status", "updated_at", "reject_reason", "published_at"],
        )

    @staticmethod
    def _missing(listing: SaleCars) -> list[str]:
        missing = [name for name in REQUIRED_TO_SUBMIT if getattr(listing, name) in (None, "")]
        if not (listing.s3_photo_car_keys or []):
            missing.append("photos")
        return missing

    async def _move(self, listing: SaleCars, target: str) -> SaleCars:
        allowed = ALLOWED_TRANSITIONS.get(listing.status, frozenset())
        if target not in allowed:
            raise TransitionNotAllowed(listing.status, sorted(allowed))

        previous = listing.status
        listing.status = target
        await self.db.commit()
        await self._reload(listing)
        await self._announce(listing, previous)
        return listing

    async def _announce(self, listing: SaleCars, previous: str) -> None:
        # The listing has already moved. An announcement that cannot be delivered is a
        # lost notification, never an undone sale.
        try:
            await WebhookService(self.db).send_tg_webhook_status_change(
                sale_car_id=str(listing.sale_car_id),
                old_status=previous,
                new_status=listing.status,
            )
        except Exception as error:
            logger.warning(f"status webhook failed for {listing.sale_car_id}: {error}")
