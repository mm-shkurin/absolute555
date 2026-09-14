"""Профиль поставщика: заполнение, отправка на модерацию и опубликованные витрины.

Профиль заводится при первом чтении, а не при выдаче роли: заявку на роль одобряет
модератор, и вешать на его действие создание чужой строки значит связать две истории
там, где хватает ленивого создания.
"""

from datetime import datetime
from typing import List, Tuple

from sqlalchemy import desc, func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.features.importing.models.supplier import (
    REQUIRED_TO_SUBMIT,
    SupplierProfile,
    SupplierStatus,
)
from app.features.importing.services.supplier_errors import (
    ProfileFrozen,
    ProfileIncomplete,
    SupplierNotFound,
)
from app.features.importing.services.supplier_records import find_profile, save_profile

EDITABLE_IN = frozenset({SupplierStatus.DRAFT.value, SupplierStatus.REJECTED.value})
PENDING = SupplierStatus.PENDING.value
PUBLISHED = SupplierStatus.PUBLISHED.value


class SupplierProfileService:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def mine(self, user_id: str) -> SupplierProfile:
        held = await find_profile(self.db, user_id)
        if held is None:
            held = SupplierProfile(user_id=user_id, countries=[], brands=[])
            self.db.add(held)
            await self.db.commit()
            await self.db.refresh(held)
        return held

    async def published(self, user_id: str) -> SupplierProfile:
        held = await find_profile(self.db, user_id)
        if held is None or held.status != SupplierStatus.PUBLISHED.value:
            # Неопубликованный профиль и отсутствующий — один ответ: другой сказал бы
            # читателю, кто подал заявку и ещё не прошёл проверку.
            raise SupplierNotFound(user_id)
        return held

    async def edit(self, user_id: str, fields: dict) -> SupplierProfile:
        held = await self.mine(user_id)
        if held.status == PUBLISHED:
            return await self._revise(held, fields)
        if held.status not in EDITABLE_IN:
            raise ProfileFrozen(held.status)

        for name, value in fields.items():
            setattr(held, name, value)
        # Правка после отказа возвращает профиль в черновик: иначе модератор снова видел
        # бы «отклонён» рядом с уже исправленным текстом.
        held.status = SupplierStatus.DRAFT.value
        held.reject_reason = None
        await save_profile(self.db, held)
        return held

    async def submit(self, user_id: str) -> SupplierProfile:
        held = await self.mine(user_id)
        if held.status == PUBLISHED:
            return await self._submit_revision(held)
        missing = [name for name in REQUIRED_TO_SUBMIT if not getattr(held, name)]
        if missing:
            raise ProfileIncomplete(missing)

        held.status = SupplierStatus.PENDING.value
        held.submitted_at = datetime.utcnow()
        held.reject_reason = None
        await save_profile(self.db, held)
        return held

    async def storefronts(self, page: int, size: int) -> Tuple[List[SupplierProfile], int]:
        """Опубликованные витрины страницей — лента вкладки «Поставщики».

        Только published: черновик и отклонённый профиль — это работа над витриной, а не
        витрина. Порядок по моменту решения, свежие сверху: одобренный вчера успел
        меньше, чем работающий год, и прятать его в конце значит не дать начать.
        """
        where = SupplierProfile.status == SupplierStatus.PUBLISHED.value
        total = await self.db.scalar(
            select(func.count()).select_from(SupplierProfile).where(where)
        )
        found = await self.db.execute(
            select(SupplierProfile)
            .where(where)
            .order_by(desc(SupplierProfile.moderated_at), SupplierProfile.user_id)
            .offset((page - 1) * size)
            .limit(size)
        )
        return list(found.scalars().all()), total or 0

    async def _revise(self, held: SupplierProfile, fields: dict) -> SupplierProfile:
        if held.revision_status == PENDING:
            raise ProfileFrozen(PENDING)
        # Новый словарь, а не правка на месте: JSONB не замечает изменений внутри.
        held.pending_changes = {**(held.pending_changes or {}), **fields}
        held.revision_status = SupplierStatus.DRAFT.value
        held.reject_reason = None
        await save_profile(self.db, held)
        return held

    async def _submit_revision(self, held: SupplierProfile) -> SupplierProfile:
        if not held.pending_changes or held.revision_status == PENDING:
            raise ProfileFrozen(held.revision_status or PUBLISHED)
        merged = {**{name: getattr(held, name) for name in REQUIRED_TO_SUBMIT}, **held.pending_changes}
        missing = [name for name in REQUIRED_TO_SUBMIT if not merged.get(name)]
        if missing:
            raise ProfileIncomplete(missing)
        held.revision_status = PENDING
        held.submitted_at = datetime.utcnow()
        await save_profile(self.db, held)
        return held
