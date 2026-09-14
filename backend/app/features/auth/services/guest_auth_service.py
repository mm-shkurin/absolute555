from app.features.account.services.user_service import UserService
from app.features.auth.schemas.token import Token
from app.utils.security import create_access_token, create_refresh_token


class GuestAuthService:
    """The account a device gets before it has signed in with anything."""

    def __init__(self, users: UserService):
        self.users = users

    async def login(self, device_id: str) -> Token:
        user_id = await self.users.create_or_get_guest_user(device_id=device_id)
        claims = {"id": str(user_id), "is_guest": True}
        return Token(
            access_token=await create_access_token(claims),
            refresh_token=await create_refresh_token(claims),
        )
