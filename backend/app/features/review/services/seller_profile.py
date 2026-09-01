"""The public side of a seller: the aggregate, the reviews and what is on sale now.

Open to a visitor who has not signed in. The rating is part of deciding whether to buy,
and a wall on that screen would stop the reader coming from the feed. The phone number
is not here: it stays behind the reveal on the card (story 8).
"""

from typing import List, Optional, Tuple

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.features.review.models.review import Review
from app.features.listing.models.sale_car import SaleCars, SaleCarStatus
from app.features.account.models.users import Users
from app.features.review.services.review_errors import SellerNotFound
from app.features.review.services.review_service import as_uuid


class SellerProfileService:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def profile(self, user_id: str) -> Tuple[Users, int]:
        seller = await self._seller_or_404(user_id)
        published = await self.db.execute(
            select(func.count())
            .select_from(SaleCars)
            .where(SaleCars.user_id == seller.id, SaleCars.status == SaleCarStatus.PUBLISHED)
        )
        return seller, published.scalar_one()

    async def reviews(self, user_id: str, page: int, size: int) -> Tuple[List[Review], int]:
        seller = await self._seller_or_404(user_id)
        counted = await self.db.execute(
            select(func.count()).select_from(Review).where(Review.seller_id == seller.id)
        )
        found = await self.db.execute(
            select(Review)
            .where(Review.seller_id == seller.id)
            .options(selectinload(Review.author))
            .order_by(Review.created_at.desc())
            .offset((page - 1) * size)
            .limit(size)
        )
        return list(found.scalars().all()), counted.scalar_one()

    async def listings(self, user_id: str, page: int, size: int) -> Tuple[List[SaleCars], int]:
        """Published only: a draft or a rejected listing is the owner's business.

        A profile that showed them would publish what moderation has not passed.
        """
        seller = await self._seller_or_404(user_id)
        matching = select(SaleCars).where(
            SaleCars.user_id == seller.id, SaleCars.status == SaleCarStatus.PUBLISHED
        )
        counted = await self.db.execute(select(func.count()).select_from(matching.subquery()))
        found = await self.db.execute(
            matching.options(selectinload(SaleCars.brand), selectinload(SaleCars.model))
            .order_by(SaleCars.published_at.desc().nullslast())
            .offset((page - 1) * size)
            .limit(size)
        )
        return list(found.scalars().all()), counted.scalar_one()

    async def _seller_or_404(self, user_id: str) -> Users:
        seller: Optional[Users] = await self.db.get(Users, as_uuid(user_id, "user_id"))
        if seller is None:
            raise SellerNotFound(user_id)
        return seller
