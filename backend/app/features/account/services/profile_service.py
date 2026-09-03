"""Своё имя, своя фотография и уход из сервиса.

Три действия над одной строкой, которых у аккаунта не было вовсе: имя вычислялось из
ответа провайдера при каждом чтении, фотографии не существовало, а удалиться было нельзя.
"""

from datetime import datetime

from sqlalchemy.ext.asyncio import AsyncSession

from app.features.account.models.users import Users
from app.features.listing.services.photo_image import require_image
from app.shared.storage.s3_service import s3_service

NAME_LIMIT = 60


class NameNotAllowed(Exception):
    """Имя пустое после обрезки пробелов или длиннее допустимого."""


class ProfileService:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def rename(self, user: Users, name: str) -> Users:
        """Своё имя вместо имени провайдера. Пустая строка возвращает провайдерское."""
        trimmed = (name or "").strip()
        if len(trimmed) > NAME_LIMIT:
            raise NameNotAllowed(f"имя длиннее {NAME_LIMIT} символов")

        user.profile_name = trimmed or None
        await self.db.commit()
        return user

    async def set_avatar(self, user: Users, body: bytes, content_type: str) -> Users:
        """Заменить фотографию профиля.

        Проверки те же, что у фотографий объявления: настоящее изображение и лимит
        размера. Превью не делается — аватар и так мал, а второй объект означал бы
        второй ключ, который надо чистить.
        """
        require_image("avatar", body)

        previous = user.avatar_key
        user.avatar_key = await s3_service.upload_file_get_key_from_bytes(
            str(user.id), body, filename="avatar", content_type=content_type, folder="avatars"
        )
        await self.db.commit()

        # Прежний файл удаляется после коммита: удалить до него значит остаться без
        # картинки, если запись не сохранится.
        if previous:
            await s3_service.delete_file(previous)
        return user

    async def drop_avatar(self, user: Users) -> Users:
        key, user.avatar_key = user.avatar_key, None
        await self.db.commit()
        if key:
            await s3_service.delete_file(key)
        return user

    async def delete_account(self, user: Users) -> None:
        """Пометить запись удалённой. Вход закрывается, строки остаются.

        Объявления, офферы, отзывы и диалоги не трогаются намеренно: вычеркнуть отзыв
        ушедшего покупателя значит задним числом переписать рейтинг чужого продавца.
        """
        user.deleted_at = datetime.utcnow()
        await self.db.commit()
