"""Решение модератора по профилю поставщика и по правке уже опубликованной витрины."""

from datetime import datetime
from typing import List, Optional

from sqlalchemy import or_, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.features.importing.models.supplier import SupplierProfile, SupplierStatus
from app.features.importing.services.supplier_errors import RejectionNeedsReason, SupplierNotFound
from app.features.importing.services.supplier_records import find_profile, save_profile
from app.shared.storage.s3_service import s3_service

PENDING = SupplierStatus.PENDING.value
PUBLISHED = SupplierStatus.PUBLISHED.value


class SupplierModerationService:
    def __init__(self, db: AsyncSession):
        self.db = db

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
        return await self._decide(user_id, PUBLISHED, None)

    async def reject(self, user_id: str, reason: Optional[str]) -> SupplierProfile:
        if not (reason or "").strip():
            raise RejectionNeedsReason()
        return await self._decide(user_id, SupplierStatus.REJECTED.value, reason)

    async def _decide(self, user_id: str, status: str, reason) -> SupplierProfile:
        held = await find_profile(self.db, user_id)
        if held is not None and held.revision_status == PENDING:
            return await self._decide_revision(held, status == PUBLISHED, reason)
        if held is None or held.status != PENDING:
            raise SupplierNotFound(user_id)

        held.status = status
        held.reject_reason = reason
        held.moderated_at = datetime.utcnow()
        await save_profile(self.db, held)
        return held

    async def _decide_revision(self, held: SupplierProfile, approved: bool, reason) -> SupplierProfile:
        """Одобрение переносит правку в витрину; отказ оставляет витрину прежней."""
        if approved:
            replaced = held.cover_key
            for name, value in (held.pending_changes or {}).items():
                setattr(held, name, value)
            # Прежнее фото уходит из хранилища только после того, как новое стало витриной.
            if replaced and replaced != held.cover_key:
                await s3_service.delete_file(replaced)
            held.pending_changes = None
            held.revision_status = None
            held.reject_reason = None
        else:
            held.revision_status = SupplierStatus.REJECTED.value
            held.reject_reason = reason
        held.moderated_at = datetime.utcnow()
        await save_profile(self.db, held)
        return held
