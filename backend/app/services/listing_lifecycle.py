"""The listing lifecycle as the seller drives it: what a listing may become, and from where.

Every transition goes through `_move`, which consults the table on the model rather than
a branch per case. The one boundary carrying a rule of its own is submit, which checks
completeness.

The moderator's side -- publishing, turning a listing back with a reason, and taking a
published one down over complaints -- lives in `listing_review.py`: it needs the reason
labels and the complaint queue, and neither belongs to the seller's path.
"""

import uuid
from datetime import datetime
from typing import Optional

from loguru import logger
from sqlalchemy import func, select, update
from sqlalchemy.orm import selectinload
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import PhotoSettings
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
    TooManyDrafts,
    TransitionNotAllowed,
)
from app.services.listing_autofill import ListingAutofillService
from app.services.webhook_service import WebhookService

EDITABLE_IN = frozenset({SaleCarStatus.DRAFT, SaleCarStatus.REJECTED})
MIN_PHOTOS_TO_SUBMIT = PhotoSettings().min_photos_to_submit


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
            .options(
                selectinload(SaleCars.brand),
                selectinload(SaleCars.model),
                selectinload(SaleCars.owner),
            )
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

        # A make or model in the payload is the seller's own answer: it outranks the
        # reading from here on, and it settles the spelling a moderator was queued.
        await ListingAutofillService(self.db).claim(listing, fields)
        await self.db.commit()
        await self._reload(listing)
        return listing

    async def submit(self, listing_id: str) -> SaleCars:
        listing = await self.get(listing_id)
        missing = self._missing(listing)
        if missing and listing.status == SaleCarStatus.DRAFT:
            raise ListingIncomplete(missing)
        moved = await self.move_to(listing, SaleCarStatus.MODERATION)
        # Stamped here rather than read off updated_at: the queue is ordered by when the
        # seller sent the listing in, and any later edit moves updated_at.
        moved.submitted_at = datetime.utcnow()
        await self.db.commit()
        # Re-read rather than return the committed instance: the commit expired every
        # attribute on it, and the router reads updated_at outside the greenlet.
        return await self.get(listing_id)

    async def withdraw(self, listing_id: str) -> SaleCars:
        return await self.move_to(await self.get(listing_id), SaleCarStatus.WITHDRAWN)

    async def mark_sold(self, listing_id: str) -> SaleCars:
        return await self.move_to(await self.get(listing_id), SaleCarStatus.SOLD)

    async def republish(self, listing_id: str) -> SaleCars:
        moved = await self.move_to(await self.get(listing_id), SaleCarStatus.MODERATION)
        moved.submitted_at = datetime.utcnow()
        await self.db.commit()
        return await self.get(listing_id)

    async def revise(self, listing_id: str) -> SaleCars:
        listing = await self.move_to(await self.get(listing_id), SaleCarStatus.DRAFT)
        listing.reject_reason = None
        await self.db.commit()
        await self._reload(listing)
        return listing

    async def _reload(self, listing: SaleCars) -> None:
        # Only the columns. A full refresh expires the eagerly loaded make and model, and
        # the next attribute read would try to lazy-load them outside the greenlet.
        await self.db.refresh(
            listing,
            attribute_names=["status", "updated_at", "reject_reason", "published_at", "sts_key"],
        )

    @staticmethod
    def _missing(listing: SaleCars) -> list[str]:
        missing = [name for name in REQUIRED_TO_SUBMIT if getattr(listing, name) in (None, "")]
        if len(listing.photos or []) < MIN_PHOTOS_TO_SUBMIT:
            # One photograph is nearly useless to a buyer, so the gate asks for three
            # (story 5). It reports the same "photos" either way: the wizard highlights a
            # step, not a count.
            missing.append("photos")
        return missing

    async def move_to(self, listing: SaleCars, target: str) -> SaleCars:
        """One transition, checked against the table. Public because the review service
        drives the moderator's three transitions through the same gate."""
        previous = listing.status
        allowed = ALLOWED_TRANSITIONS.get(previous, frozenset())
        if target not in allowed:
            raise TransitionNotAllowed(previous, sorted(allowed))

        # The status the check read has to be the status the write finds. Two actions on
        # one listing arrive on different workers, and a plain assignment would let both
        # pass the check against `published` and both apply.
        moved = await self.db.execute(
            update(SaleCars)
            .where(SaleCars.sale_car_id == listing.sale_car_id, SaleCars.status == previous)
            .values(status=target)
        )
        await self.db.commit()
        current = await self.get(str(listing.sale_car_id))
        if moved.rowcount == 0:
            raise TransitionNotAllowed(
                current.status, sorted(ALLOWED_TRANSITIONS.get(current.status, frozenset()))
            )

        await self._announce(current, previous)
        return current

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
