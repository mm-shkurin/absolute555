"""Свой профиль: имя, фотография, удаление.

Отдельно от `user.py` — тот про чтение профиля и наследие входа через провайдеров, здесь
про то, что человек меняет сам.
"""

from fastapi import APIRouter, Depends, File, UploadFile, status
from app.features.account.deps import get_profile_service
from app.features.account.schemas.profile import Profile, ProfilePatch
from app.features.account.services.profile_service import ProfileService
from app.features.listing.services.photo_image import read_limited
from app.permissions.dependencies import CurrentUser

from app.features.account.api.account_view import profile_view

profile_router = APIRouter()


@profile_router.patch("/profile", response_model=Profile)
async def rename(
    body: ProfilePatch,
    current_user: CurrentUser,
    profile_service: ProfileService = Depends(get_profile_service),
):
    """Своё имя перекрывает имя провайдера; пустая строка возвращает провайдерское."""
    return profile_view(await profile_service.rename(current_user, body.name))


@profile_router.put("/avatar", response_model=Profile)
async def upload_avatar(
    current_user: CurrentUser,
    file: UploadFile = File(...),
    profile_service: ProfileService = Depends(get_profile_service),
):
    updated = await profile_service.set_avatar(current_user, await read_limited(file))
    return profile_view(updated)


@profile_router.delete("/avatar", response_model=Profile)
async def drop_avatar(current_user: CurrentUser, profile_service: ProfileService = Depends(get_profile_service)):
    return profile_view(await profile_service.drop_avatar(current_user))


@profile_router.delete("", status_code=status.HTTP_204_NO_CONTENT)
async def delete_account(current_user: CurrentUser, profile_service: ProfileService = Depends(get_profile_service)):
    """Вход закрывается немедленно и неотличимо от несуществующей записи.

    Объявления, офферы, отзывы и диалоги остаются — почему, сказано в сервисе.
    """
    await profile_service.delete_account(current_user)
