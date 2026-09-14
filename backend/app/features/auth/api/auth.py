"""Sign-in.

Yandex OAuth lives in auth_yandex.py; what stays here is what belongs to no provider --
refreshing a token and the guest account a device gets before it has signed in with
anything.

VK is out of the repository, not merely disabled: the flow needs a VK business account
this project does not have, so the code could never be run or tested here and an
unreachable provider wired into the router is a route that answers 500. The files are
listed in .gitignore so a local copy does not drift back in.
"""

from typing import Optional

from fastapi import APIRouter, Body, Depends, status

from app.core.config_getters import get_jwt_settings
from app.features.auth.deps import get_access_service, get_guest_auth_service
from app.features.auth.schemas.token import Token
from app.features.auth.services import token_revocation
from app.features.auth.services.access_service import AccessService
from app.features.auth.services.guest_auth_service import GuestAuthService
from app.utils.security import auth_scheme

from .auth_yandex import yandex_router

auth_router = APIRouter()


@auth_router.post("/refresh", response_model=Token)
async def refresh(
    refresh_token: str = Body(..., embed=True),
    access: AccessService = Depends(get_access_service),
):
    new_access_token = await access.refresh(refresh_token)
    return Token(access_token=new_access_token, refresh_token=refresh_token)


@auth_router.post("/logout", status_code=status.HTTP_204_NO_CONTENT)
async def logout(
    refresh_token: Optional[str] = Body(None, embed=True),
    token: Optional[str] = Depends(auth_scheme),
):
    """Отозвать оба токена: тот, что в заголовке, и тот, что прислан телом.

    Ответ один и тот же, был токен действителен или нет: иначе ручка отвечает на вопрос
    «жив ли этот токен» кому угодно, кто его подобрал.
    """
    if token:
        await token_revocation.revoke_if_valid(
            token.removeprefix("Bearer "), get_jwt_settings().secret_key
        )
    if refresh_token:
        await token_revocation.revoke_if_valid(
            refresh_token, get_jwt_settings().refresh_token_secret_key
        )


@auth_router.post("/guest/login", response_model=Token)
async def guest_login(
    device_id: str = Body(..., embed=True),
    guests: GuestAuthService = Depends(get_guest_auth_service),
):
    return await guests.login(device_id)


auth_router.include_router(yandex_router)
