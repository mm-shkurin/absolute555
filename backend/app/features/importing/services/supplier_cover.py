"""Фото витрины поставщика: поставить, заменить, снять.

Проверки те же, что у аватара и фотографий объявления: настоящее изображение и лимит
размера. У опубликованной витрины фото — такая же правка, как текст: ложится в черновик
и попадает к покупателям только одобрением модератора. У неопубликованной оно и так
проверяется вместе со всем профилем.
"""

from sqlalchemy.ext.asyncio import AsyncSession

from app.features.importing.models.supplier import SupplierProfile, SupplierStatus
from app.features.importing.services.supplier_errors import ProfileFrozen
from app.features.importing.services.supplier_service import SupplierProfileService
from app.features.listing.services.photo_image import require_image
from app.shared.storage.s3_service import s3_service


class SupplierCoverService:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def set(self, user_id: str, body: bytes, content_type: str) -> SupplierProfile:
        require_image("cover", body)
        held = await SupplierProfileService(self.db).mine(user_id)
        if held.revision_status == SupplierStatus.PENDING.value:
            raise ProfileFrozen(SupplierStatus.PENDING.value)

        key = await s3_service.upload_file_get_key_from_bytes(
            user_id, body, filename="cover", content_type=content_type, folder="storefronts"
        )
        if held.status == SupplierStatus.PUBLISHED.value:
            previous = (held.pending_changes or {}).get("cover_key")
            # Новый словарь, а не правка на месте: JSONB не замечает изменений внутри.
            held.pending_changes = {**(held.pending_changes or {}), "cover_key": key}
            held.revision_status = SupplierStatus.DRAFT.value
            held.reject_reason = None
        else:
            previous = held.cover_key
            held.cover_key = key
        await self.db.commit()
        await self.db.refresh(held)

        # Прежний файл — после коммита: удалить до него значит остаться без картинки,
        # если запись не сохранится.
        if previous:
            await s3_service.delete_file(previous)
        return held

    async def drop(self, user_id: str) -> SupplierProfile:
        held = await SupplierProfileService(self.db).mine(user_id)
        key, held.cover_key = held.cover_key, None
        await self.db.commit()
        await self.db.refresh(held)
        if key:
            await s3_service.delete_file(key)
        return held
