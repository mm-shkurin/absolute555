"""Профиль поставщика: заполнение, отправка на модерацию, решение модератора.

Профиль заводится при первом чтении, а не при выдаче роли: заявку на роль одобряет
модератор, и вешать на его действие создание чужой строки значит связать две истории
там, где хватает ленивого создания.
"""

from datetime import datetime
from typing import List, Optional, Tuple

from sqlalchemy import desc, func, or_, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.features.importing.models.supplier import (
    REQUIRED_TO_SUBMIT,
    SupplierProfile,
    SupplierStatus,
)
from app.features.importing.services.supplier_errors import (
    ProfileFrozen,
    ProfileIncomplete,
    RejectionNeedsReason,
    SupplierNotFound,
)

EDITABLE_IN = frozenset({SupplierStatus.DRAFT.value, SupplierStatus.REJECTED.value})
PENDING = SupplierStatus.PENDING.value
PUBLISHED = SupplierStatus.PUBLISHED.value


class SupplierProfileService:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def mine(self, user_id: str) -> SupplierProfile:
        held = await self._find(user_id)
        if held is None:
            held = SupplierProfile(user_id=user_id, countries=[], brands=[])
            self.db.add(held)
            await self.db.commit()
            await self.db.refresh(held)
        return held

    async def published(self, user_id: str) -> SupplierProfile:
        held = await self._find(user_id)
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
        await self._save(held)
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
        await self._save(held)
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

    async def queue(self) -> List[SupplierProfile]:
        found = await self.db.execute(
            select(SupplierProfile)
            .where(
                or_(
                    SupplierProfile.status == PENDING,
                    SupplierProfile.revision_status == PENDING,
                )
            )
            .order_by(SupplierProfile.submitted_at)
        )
        return list(found.scalars().all())

    async def approve(self, user_id: str) -> SupplierProfile:
        return await self._decide(user_id, SupplierStatus.PUBLISHED.value, None)

    async def reject(self, user_id: str, reason: Optional[str]) -> SupplierProfile:
        if not (reason or "").strip():
            raise RejectionNeedsReason()
        return await self._decide(user_id, SupplierStatus.REJECTED.value, reason)

    async def _decide(self, user_id: str, status: str, reason) -> SupplierProfile:
        held = await self._find(user_id)
        if held is not None and held.revision_status == PENDING:
            return await self._decide_revision(held, status == PUBLISHED, reason)
        if held is None or held.status != PENDING:
            raise SupplierNotFound(user_id)

        held.status = status
        held.reject_reason = reason
        held.moderated_at = datetime.utcnow()
        await self._save(held)
        return held

    async def _revise(self, held: SupplierProfile, fields: dict) -> SupplierProfile:
        if held.revision_status == PENDING:
            raise ProfileFrozen(PENDING)
        # Новый словарь, а не правка на месте: JSONB не замечает изменений внутри.
        held.pending_changes = {**(held.pending_changes or {}), **fields}
        held.revision_status = SupplierStatus.DRAFT.value
        held.reject_reason = None
        await self._save(held)
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
        await self._save(held)
        return held

    async def _decide_revision(self, held: SupplierProfile, approved: bool, reason) -> SupplierProfile:
        """Одобрение переносит правку в витрину; отказ оставляет витрину прежней."""
        if approved:
            for name, value in (held.pending_changes or {}).items():
                setattr(held, name, value)
            held.pending_changes = None
            held.revision_status = None
            held.reject_reason = None
        else:
            held.revision_status = SupplierStatus.REJECTED.value
            held.reject_reason = reason
        held.moderated_at = datetime.utcnow()
        await self._save(held)
        return held

    async def _find(self, user_id: str) -> Optional[SupplierProfile]:
        found = await self.db.execute(
            select(SupplierProfile).where(SupplierProfile.user_id == user_id)
        )
        return found.scalar_one_or_none()

    async def _save(self, profile: SupplierProfile) -> None:
        await self.db.commit()
        await self.db.refresh(profile)
