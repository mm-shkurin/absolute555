"""Свой профиль: имя, фотография, удаление.

Отдельно от `user.py` — тот про чтение профиля и наследие входа через провайдеров, здесь
про то, что человек меняет сам. Роутер решает только статус: правила живут в сервисе.
"""

from fastapi import APIRouter, Depends, File, UploadFile, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.exceptions import PayloadTooLarge, ValidationError
from app.db.database import get_db
from app.features.account.schemas.profile import Profile, ProfilePatch
from app.features.account.services.profile_service import NameNotAllowed, ProfileService
from app.features.listing.services.photo_errors import NotAnImage, PhotoTooLarge
from app.permissions.dependencies import CurrentUser

from .account_view import profile_view

profile_router = APIRouter()


@profile_router.patch("/profile", response_model=Profile)
async def rename(
    body: ProfilePatch,
    current_user: CurrentUser,
    db: AsyncSession = Depends(get_db),
):
    """Своё имя перекрывает имя провайдера; пустая строка возвращает провайдерское."""
    try:
        renamed = await ProfileService(db).rename(current_user, body.name)
    except NameNotAllowed as error:
        raise ValidationError(str(error), code="NAME_NOT_ALLOWED")
    return profile_view(renamed)


@profile_router.put("/avatar", response_model=Profile)
async def upload_avatar(
    current_user: CurrentUser,
    file: UploadFile = File(...),
    db: AsyncSession = Depends(get_db),
):
    try:
        updated = await ProfileService(db).set_avatar(
            current_user, await file.read(), file.content_type or "image/jpeg"
        )
    except PhotoTooLarge as error:
        raise PayloadTooLarge(
            str(error),
            code="PHOTO_TOO_LARGE",
            details={"limit_bytes": error.limit, "size_bytes": error.size},
        )
    except NotAnImage as error:
        raise ValidationError(str(error), code="NOT_AN_IMAGE", details={"filename": "avatar"})
    return profile_view(updated)


@profile_router.delete("/avatar", response_model=Profile)
async def drop_avatar(current_user: CurrentUser, db: AsyncSession = Depends(get_db)):
    return profile_view(await ProfileService(db).drop_avatar(current_user))


@profile_router.delete("", status_code=status.HTTP_204_NO_CONTENT)
async def delete_account(current_user: CurrentUser, db: AsyncSession = Depends(get_db)):
    """Вход закрывается немедленно и неотличимо от несуществующей записи.

    Объявления, офферы, отзывы и диалоги остаются — почему, сказано в сервисе.
    """
    await ProfileService(db).delete_account(current_user)
