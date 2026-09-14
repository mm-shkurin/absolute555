"""What a guest account may not do.

A guest is a real user row created from a device id, so every one of these is a check on
the caller rather than on what they are reaching for.
"""

from typing import Annotated

from fastapi import Depends

from app.core.exceptions import AuthorizationError

from app.features.account.deps import get_user_service
from app.features.account.models.users import Users
from app.features.account.services.user_service import UserService
from app.features.auth.deps import get_current_user


async def require_guest_can_create_car(
    current_user: Users = Depends(get_current_user),
    user_service: UserService = Depends(get_user_service)
) -> Users:
    if not current_user.is_guest:
        return current_user

    limits = await user_service.check_guest_limits(current_user.id)

    if not limits["can_create_car"]:
        raise AuthorizationError(
            "Guest limit reached: only 1 car allowed. Verify your account to create more.",
            code="GUEST_LIMIT_REACHED",
            details={"limit": 1},
        )
    return current_user


async def forbid_guest_view_prices(
    current_user: Users = Depends(get_current_user)
) -> Users:
    if current_user.is_guest:
        raise AuthorizationError(
            "Price information is available only for verified users",
            code="GUEST_FORBIDDEN",
        )
    return current_user


async def forbid_guest_publish_sale(
    current_user: Users = Depends(get_current_user)
) -> Users:
    if current_user.is_guest:
        raise AuthorizationError(
            "Publishing cars for sale requires a verified account",
            code="GUEST_FORBIDDEN",
        )
    return current_user

async def forbid_guest(current_user: Users = Depends(get_current_user)) -> Users:
    if current_user.is_guest:
        raise AuthorizationError(
            "This action is not available for guest users",
            code="GUEST_FORBIDDEN",
        )
    return current_user


async def check_guest_car_limit(
    current_user: Users = Depends(get_current_user),
    user_service: UserService = Depends(get_user_service)
) -> Users:
    if not current_user.is_guest:
        return current_user

    limits = await user_service.check_guest_limits(current_user.id)
    if not limits["can_create_car"]:
        raise AuthorizationError(
            "Guest users can only create 1 listing. Verify your account to create more.",
            code="GUEST_LIMIT_REACHED",
            details={"limit": 1},
        )
    return current_user


# Тот же приём, что и у CurrentUser: роутеру нужен «вошедший не гостем», а не строка
# таблицы. Псевдоним живёт здесь, потому что здесь же и проверка.
SignedInUser = Annotated[Users, Depends(forbid_guest)]
