from typing import Optional

from app.core.exceptions import ValidationError
from app.utils.security import create_access_token, create_refresh_token


async def guest_auth(user_service, device_id: Optional[str] = None) -> dict[str,str]:
    if not device_id :
         raise ValidationError(
            "device_id is required for guest authentication",
            code="DEVICE_ID_REQUIRED",
        )
    
    user_id = await user_service.create_or_get_guest_user(device_id = device_id)

    access_token = await create_access_token({"id": str(user_id), "is_guest": True})
    refresh_token = await create_refresh_token({"id": str(user_id), "is_guest": True})

    return refresh_token, access_token