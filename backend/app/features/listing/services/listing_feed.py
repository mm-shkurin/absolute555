"""The feed: which published listings match, in what order, and how many there are.

The count is taken over the same condition as the page and not estimated: the screen
promises a number on its button, and an estimate makes that promise false.
"""

from typing import List, Tuple

from sqlalchemy import Select, func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.features.account.models.users import Users
from app.features.listing.models.sale_car import SaleCars, SaleCarStatus
from app.features.listing.models.thickness import ThicknessMeasurement
from app.features.listing.panels import TOTAL_PANELS
from app.features.listing.schemas.feed import FeedQuery, FeedSort


class ListingFeedService:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def page(self, query: FeedQuery) -> Tuple[List[SaleCars], int]:
        matching = self._matching(query)

        counted = await self.db.execute(
            select(func.count()).select_from(matching.subquery())
        )
        total = counted.scalar_one()

        listings = await self.db.execute(
            self._ordered(matching, query.sort)
            .options(selectinload(SaleCars.brand), selectinload(SaleCars.model))
            .offset((query.page - 1) * query.size)
            .limit(query.size)
        )
        return list(listings.scalars().all()), total

    @staticmethod
    def _matching(query: FeedQuery) -> Select:
        """Only published listings, narrowed by every filter that was given.

        Every filter applies at once rather than in turn: a reader asking for a make, a
        price ceiling and a year floor means all three, not whichever the query happened
        to reach last.
        """
        found = (
            select(SaleCars)
            .join(Users, Users.id == SaleCars.user_id)
            .where(SaleCars.status == SaleCarStatus.PUBLISHED)
            # Объявления того, кому закрыли доступ, из ленты уходят, но не удаляются:
            # видимость — правило ленты, а не судьба записи, и разблокировка вернёт их
            # такими, какими они были.
            .where(Users.is_blocked.is_(False))
        )

        if query.brand_id is not None:
            found = found.where(SaleCars.brand_id == query.brand_id)
        if query.model_id is not None:
            found = found.where(SaleCars.model_id == query.model_id)

        # Both ends inclusive: a reader asking for 2010 to 2015 means a car of 2015 too.
        for column, low, high in (
            (SaleCars.year, query.year_from, query.year_to),
            (SaleCars.price, query.price_from, query.price_to),
            (SaleCars.milleage, query.mileage_from, query.mileage_to),
        ):
            if low is not None:
                found = found.where(column >= low)
            if high is not None:
                found = found.where(column <= high)

        if query.transmission:
            found = found.where(SaleCars.transmission.in_(query.transmission))

        if query.kind is not None:
            found = found.where(SaleCars.listing_kind == query.kind.value)

        if query.with_thickness_map:
            # Полная карта — все панели набора. Считается подзапросом, а не хранимым
            # флагом: флаг разошёлся бы с таблицей на первом же снятом замере.
            measured = (
                select(func.count())
                .select_from(ThicknessMeasurement)
                .where(ThicknessMeasurement.sale_car_id == SaleCars.sale_car_id)
                .scalar_subquery()
            )
            found = found.where(measured >= TOTAL_PANELS)

        return found

    @staticmethod
    def _ordered(found: Select, sort: FeedSort) -> Select:
        """The order, with the tie broken explicitly.

        Two listings at the same price have no order of their own, and the database is
        free to return them differently between two queries — which is how one listing
        arrives on two consecutive pages and another on neither. The identifier is
        arbitrary but stable, and stability is the whole requirement.
        """
        if sort is FeedSort.PRICE_ASC:
            return found.order_by(SaleCars.price.asc(), SaleCars.sale_car_id.asc())
        if sort is FeedSort.PRICE_DESC:
            return found.order_by(SaleCars.price.desc(), SaleCars.sale_car_id.asc())
        return found.order_by(
            SaleCars.published_at.desc().nullslast(),
            SaleCars.created_at.desc(),
            SaleCars.sale_car_id.asc(),
        )
