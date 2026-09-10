"""Фото витрины поставщика: поставить, заменить, снять.

Проверки те же, что у аватара и фотографий объявления: настоящее изображение и лимит
размера. Фото меняется в любом статусе профиля — оно не текст, который читает
модератор, а лицо витрины, и заморозка на время проверки оставила бы её без него.
"""

from sqlalchemy.ext.asyncio import AsyncSession

from app.features.importing.models.supplier import SupplierProfile
from app.features.importing.services.supplier_service import SupplierProfileService
from app.features.listing.services.photo_image import require_image
from app.shared.storage.s3_service import s3_service


class SupplierCoverService:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def set(self, user_id: str, body: bytes, content_type: str) -> SupplierProfile:
        require_image("cover", body)
        held = await SupplierProfileService(self.db).mine(user_id)

        previous = held.cover_key
        held.cover_key = await s3_service.upload_file_get_key_from_bytes(
            user_id, body, filename="cover", content_type=content_type, folder="storefronts"
        )
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
