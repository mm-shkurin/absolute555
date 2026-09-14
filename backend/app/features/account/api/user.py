
from fastapi import APIRouter

from app.features.account.schemas.user import User_Data
from app.permissions.dependencies import CurrentUser
from app.features.account.provider_profile import as_profile

from .account_view import avatar_url, name_of

user_router = APIRouter()

@user_router.get("/profile", response_model=User_Data)
async def get_profile(current_user: CurrentUser):
    
    
    # Разбор ответа провайдера — один на всё приложение (`Users._as_profile`): колонка
    # JSONB, но часть записей лежит в ней строкой,
    # а часть словарём, и разбирать их надо одинаково.
    yandex_json_parsed = as_profile(current_user.yandex_json) or None
    vk_json_parsed = as_profile(current_user.vk_json) or None
    guest_json_parsed = as_profile(current_user.guest_json) or None

    user_type = "guest" if current_user.is_guest else "regular"

    return User_Data(
        name=name_of(current_user),
        avatar_url=avatar_url(current_user),
        id=current_user.id,
        device_id=current_user.device_id,         
        vk_id=current_user.vk_id,
        yandex_id=current_user.yandex_id,
        yandex_json=yandex_json_parsed,
        vk_json=vk_json_parsed,
        guest_json=guest_json_parsed,             
        user_type=user_type,                      
        is_guest=current_user.is_guest,           
        role=current_user.role,
        is_verified=current_user.is_verified,
        created_at=current_user.created_at,
        updated_at=current_user.updated_at
    )