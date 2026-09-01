"""What a guest account may not do.

A guest is a real user row created from a device id, so every one of these is a check on
the caller rather than on what they are reaching for.
"""

from fastapi import Depends

from app.core.exceptions import AuthorizationError
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.database import get_db
from app.features.listing.models.sale_car import SaleCars
from app.features.account.models.users import Users
from app.features.account.services.user_service import UserService
from app.utils.security import get_current_user


async def require_guest_can_create_car(
    current_user: Users = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
) -> Users:
    if not current_user.is_guest:
        return current_user  
    
    user_service = UserService(db)
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
    db: AsyncSession = Depends(get_db)
) -> Users:
    if not current_user.is_guest:
        return current_user
    
    # Counts listings, not garage entries: the Cars model went with story 1, and a
    # guest's one allowed object is now the one listing they may publish.
    result = await db.execute(
        select(func.count()).where(SaleCars.user_id == current_user.id)
    )
    listing_count = result.scalar_one()

    if listing_count >= 1:
        raise AuthorizationError(
            "Guest users can only create 1 listing. Verify your account to create more.",
            code="GUEST_LIMIT_REACHED",
            details={"limit": 1},
        )
    return current_user
