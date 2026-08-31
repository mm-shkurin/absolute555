"""Complaints: recording one, reading them grouped, and settling them.

Nothing here takes a listing down. A count of complaints is a signal for a moderator to
look, never a decision — the screen says so outright, and a threshold that hides a
listing automatically is a threshold competitors learn to reach.
"""

import uuid
from datetime import datetime
from typing import List, Optional, Tuple

from sqlalchemy import func, select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models.complaint import Complaint, ComplaintStatus
from app.models.sale_car import SaleCars, SaleCarStatus
from app.services.complaint_errors import (
    AlreadyComplained,
    ComplaintAlreadyHandled,
    ComplaintNotFound,
    ComplaintOnOwnListing,
)
from app.services.listing_errors import ListingNotFound


class ComplaintService:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def complain(self, listing_id: str, user_id: str, reason: str, text: Optional[str]) -> Complaint:
        """Record one complaint about a published listing.

        Only about what is visible: a draft has nothing anyone outside could object to,
        and answering anything but "not found" would confirm it exists.
        """
        listing = await self._published(listing_id)
        if str(listing.user_id) == str(user_id):
            raise ComplaintOnOwnListing()

        complaint = Complaint(
            sale_car_id=listing.sale_car_id,
            user_id=uuid.UUID(str(user_id)),
            reason=reason,
            text=text,
            status=ComplaintStatus.OPEN.value,
        )
        self.db.add(complaint)
        try:
            await self.db.commit()
        except IntegrityError:
            # The database holds the rule, so a second complaint racing the first is
            # refused here rather than counted.
            await self.db.rollback()
            raise AlreadyComplained()

        await self.db.refresh(complaint)
        return complaint

    async def grouped(self, status: str, page: int, size: int) -> Tuple[list, int]:
        """Complaints of one kind, gathered under the listing they are about."""
        listings = (
            select(Complaint.sale_car_id)
            .where(Complaint.status == status)
            .group_by(Complaint.sale_car_id)
            .order_by(func.max(Complaint.created_at).desc())
        )
        counted = await self.db.execute(select(func.count()).select_from(listings.subquery()))
        total = counted.scalar_one()

        page_of = await self.db.execute(listings.offset((page - 1) * size).limit(size))
        wanted = [row[0] for row in page_of]
        if not wanted:
            return [], total

        found = await self.db.execute(
            select(Complaint)
            .options(
                selectinload(Complaint.author),
                # The listing's make and model come with it: the screen shows the card,
                # and a lazy load here happens outside the request's greenlet.
                selectinload(Complaint.listing).selectinload(SaleCars.brand),
                selectinload(Complaint.listing).selectinload(SaleCars.model),
            )
            .where(Complaint.sale_car_id.in_(wanted), Complaint.status == status)
            .order_by(Complaint.created_at.desc())
        )
        by_listing: dict = {listing_id: [] for listing_id in wanted}
        for complaint in found.scalars():
            by_listing[complaint.sale_car_id].append(complaint)
        return [(listing_id, by_listing[listing_id]) for listing_id in wanted], total

    async def dismiss(self, complaint_id: str, moderator_id: str) -> Complaint:
        complaint = await self.get(complaint_id)
        if complaint.status != ComplaintStatus.OPEN.value:
            raise ComplaintAlreadyHandled()

        self._settle(complaint, moderator_id)
        await self.db.commit()
        await self.db.refresh(complaint)
        return complaint

    async def settle_all(self, listing_id, moderator_id: str) -> int:
        """Close every open complaint about one listing, in one decision.

        Left open, they would show the moderator the same card again tomorrow with the
        decision already made.
        """
        open_ones = await self.db.execute(
            select(Complaint).where(
                Complaint.sale_car_id == listing_id,
                Complaint.status == ComplaintStatus.OPEN.value,
            )
        )
        settled = list(open_ones.scalars())
        for complaint in settled:
            self._settle(complaint, moderator_id)
        return len(settled)

    async def get(self, complaint_id: str) -> Complaint:
        try:
            key = uuid.UUID(complaint_id)
        except ValueError:
            raise ComplaintNotFound(complaint_id)

        found = await self.db.execute(
            select(Complaint)
            .options(selectinload(Complaint.author))
            .where(Complaint.complaint_id == key)
        )
        complaint = found.scalar_one_or_none()
        if complaint is None:
            raise ComplaintNotFound(complaint_id)
        return complaint

    async def _published(self, listing_id: str) -> SaleCars:
        try:
            key = uuid.UUID(listing_id)
        except ValueError:
            raise ListingNotFound(listing_id)

        found = await self.db.execute(
            select(SaleCars).where(
                SaleCars.sale_car_id == key, SaleCars.status == SaleCarStatus.PUBLISHED
            )
        )
        listing = found.scalar_one_or_none()
        if listing is None:
            raise ListingNotFound(listing_id)
        return listing

    @staticmethod
    def _settle(complaint: Complaint, moderator_id: str) -> None:
        complaint.status = ComplaintStatus.HANDLED.value
        complaint.handled_at = datetime.utcnow()
        complaint.handled_by = uuid.UUID(str(moderator_id))
