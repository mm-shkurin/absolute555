"""Люди глазами консоли: страница списка и карточка одного.

Отдельно от `RoleService`: тот отвечает за роли и заявки, а здесь читают учётные записи.
Разделение не косметическое — сборка списка раньше жила прямо в роутере, что история 19
уже разбирала как нарушение слоёв.
"""

from typing import List, Optional, Tuple
from uuid import UUID

from sqlalchemy import Text, desc, func, or_, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.features.account.models.users import Users
from app.features.listing.models.sale_car import SaleCars
from app.features.moderation.models.complaint import Complaint

MAX_PAGE_SIZE = 100


class PeopleService:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def page(
        self,
        query: Optional[str] = None,
        role: Optional[str] = None,
        blocked: Optional[bool] = None,
        page: int = 1,
        page_size: int = 20,
    ) -> Tuple[List[Users], int, int, int]:
        page = max(page, 1)
        page_size = min(max(page_size, 1), MAX_PAGE_SIZE)
        conditions = self._conditions(query, role, blocked)

        total = await self.db.scalar(select(func.count()).select_from(Users).where(*conditions))
        rows = await self.db.execute(
            select(Users)
            .where(*conditions)
            .order_by(desc(Users.created_at))
            .offset((page - 1) * page_size)
            .limit(page_size)
        )
        return list(rows.scalars().all()), total or 0, page, page_size

    async def card(self, user_id: UUID) -> Optional[Tuple[Users, int, int]]:
        """Человек и два числа, по которым модератор о нём судит."""
        user = await self.db.scalar(select(Users).where(Users.id == user_id))
        if user is None:
            return None
        listings = await self.db.scalar(
            select(func.count()).select_from(SaleCars).where(SaleCars.user_id == user_id)
        )
        complaints = await self.db.scalar(
            select(func.count())
            .select_from(Complaint)
            .join(SaleCars, SaleCars.sale_car_id == Complaint.sale_car_id)
            .where(SaleCars.user_id == user_id)
        )
        return user, listings or 0, complaints or 0

    def _conditions(self, query: Optional[str], role: Optional[str], blocked: Optional[bool]):
        conditions = []
        if role:
            conditions.append(Users.role == role)
        if blocked is not None:
            conditions.append(Users.is_blocked.is_(blocked))
        if query:
            # Имя живёт внутри профиля провайдера, а не отдельной колонкой, поэтому
            # ищется по тексту профиля. Кандидат на отдельную колонку, когда список
            # людей станет горячим — записано в BACKLOG.
            like = f"%{query.lower()}%"
            conditions.append(
                or_(
                    func.lower(Users.yandex_json.cast(Text)).like(like),
                    func.lower(Users.vk_json.cast(Text)).like(like),
                )
            )
        return conditions
