"""Люди глазами консоли: страница списка и карточка одного.

Отдельно от `RoleService`: тот отвечает за роли и заявки, а здесь читают учётные записи.
Разделение не косметическое: сборка списка — работа сервиса, а не роутера.
"""

from typing import List, Optional, Tuple
from uuid import UUID

from sqlalchemy import Text, desc, func, or_, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config_getters import get_admin_settings
from app.features.account.models.users import Users
from app.features.listing.models.sale_car import SaleCars
from app.features.moderation.models.complaint import Complaint



DEFAULT_PAGE_SIZE = 20


class PeopleService:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def page(
        self,
        query: Optional[str] = None,
        role: Optional[str] = None,
        blocked: Optional[bool] = None,
        deleted: Optional[bool] = None,
        page: int = 1,
        page_size: int = DEFAULT_PAGE_SIZE,
    ) -> Tuple[List[Users], int, int, int]:
        page = max(page, 1)
        page_size = min(max(page_size, 1), get_admin_settings().admin_max_page_size)
        conditions = self._conditions(query, role, blocked, deleted)

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

    def _conditions(
        self,
        query: Optional[str],
        role: Optional[str],
        blocked: Optional[bool],
        deleted: Optional[bool] = None,
    ):
        conditions = []
        if role:
            conditions.append(Users.role == role)
        if blocked is not None:
            conditions.append(Users.is_blocked.is_(blocked))
        if deleted is not None:
            # Ушедшие остаются в списке: история 21 удаляет пометкой, и объявления с
            # отзывами остаются вместе с ними. Фильтр — чтобы их можно было отделить,
            # а не чтобы спрятать.
            column = Users.deleted_at
            conditions.append(column.is_not(None) if deleted else column.is_(None))
        if query:
            # Три места, потому что имя живёт в трёх: своё в profile_name, остальные —
            # внутри профиля провайдера. Поиск только по провайдерам не находил того,
            # кто переименовал себя сам, — а это ровно тот человек, которого ищут
            # руками. Кандидат на индексируемую колонку, когда список станет горячим.
            like = f"%{query.lower()}%"
            names = (Users.profile_name, Users.yandex_json.cast(Text), Users.vk_json.cast(Text))
            conditions.append(or_(*(func.lower(name).like(like) for name in names)))
        return conditions
