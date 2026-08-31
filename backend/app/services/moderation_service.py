"""The moderation queue: what is waiting, what was complained about, what was decided.

Ordered oldest first, which is the whole of what makes it a queue: by any other order a
listing sent in the morning waits longer than one sent at night, and the person who
waited longest is the person least likely to come back.
"""

from datetime import datetime, time
from typing import List, Tuple

from sqlalchemy import Select, func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models.complaint import Complaint, ComplaintStatus
from app.models.sale_car import SaleCars, SaleCarStatus

WAITING = "waiting"
COMPLAINED = "complained"
HANDLED_TODAY = "handled_today"


class ModerationService:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def queue(self, tab: str, page: int, size: int, moderator_id: str) -> Tuple[List[SaleCars], int]:
        wanted = self._tab(tab, moderator_id)

        counted = await self.db.execute(select(func.count()).select_from(wanted.subquery()))
        total = counted.scalar_one()

        listings = await self.db.execute(
            wanted.options(
                selectinload(SaleCars.brand),
                selectinload(SaleCars.model),
                selectinload(SaleCars.owner),
            )
            .offset((page - 1) * size)
            .limit(size)
        )
        return list(listings.scalars().all()), total

    async def counts(self, moderator_id: str) -> dict:
        return {
            WAITING: await self._count(self._tab(WAITING, moderator_id)),
            COMPLAINED: await self._count(self._tab(COMPLAINED, moderator_id)),
            HANDLED_TODAY: await self._count(self._tab(HANDLED_TODAY, moderator_id)),
        }

    async def open_complaint_counts(self, listing_ids: list) -> dict:
        """How many open complaints each listing carries.

        One query for the page rather than one per row: a queue of twenty listings is
        twenty round trips otherwise, all of them the same question.
        """
        if not listing_ids:
            return {}

        found = await self.db.execute(
            select(Complaint.sale_car_id, func.count())
            .where(
                Complaint.sale_car_id.in_(listing_ids),
                Complaint.status == ComplaintStatus.OPEN.value,
            )
            .group_by(Complaint.sale_car_id)
        )
        return {row[0]: row[1] for row in found}

    async def _count(self, wanted: Select) -> int:
        counted = await self.db.execute(select(func.count()).select_from(wanted.subquery()))
        return counted.scalar_one()

    @staticmethod
    def _tab(tab: str, moderator_id: str) -> Select:
        if tab == COMPLAINED:
            # Published listings somebody objected to. Complaints about listings already
            # taken down are settled by that decision, so they are not here.
            complained_about = (
                select(Complaint.sale_car_id)
                .where(Complaint.status == ComplaintStatus.OPEN.value)
                .subquery()
            )
            return (
                select(SaleCars)
                .where(
                    SaleCars.status == SaleCarStatus.PUBLISHED,
                    SaleCars.sale_car_id.in_(select(complained_about.c.sale_car_id)),
                )
                .order_by(SaleCars.published_at.asc().nullsfirst(), SaleCars.sale_car_id.asc())
            )

        if tab == HANDLED_TODAY:
            # This moderator's own decisions since midnight: the tab tells them what they
            # have done today, not what the team has.
            since = datetime.combine(datetime.utcnow().date(), time.min)
            return (
                select(SaleCars)
                .where(SaleCars.moderated_at >= since, SaleCars.moderated_by == moderator_id)
                .order_by(SaleCars.moderated_at.desc(), SaleCars.sale_car_id.asc())
            )

        return (
            select(SaleCars)
            .where(SaleCars.status == SaleCarStatus.MODERATION)
            .order_by(
                SaleCars.submitted_at.asc().nullsfirst(),
                SaleCars.created_at.asc(),
                SaleCars.sale_car_id.asc(),
            )
        )
