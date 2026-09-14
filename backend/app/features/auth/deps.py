"""Service providers of the auth feature, and the caller resolved from a request's token."""

from fastapi import Depends, Request
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config_getters import get_cookie_settings
from app.core.exceptions import AuthenticationError
from app.db.database import get_db
from app.features.auth.services.access_service import AccessService
from app.utils.security import auth_scheme


def get_access_service(db: AsyncSession = Depends(get_db)) -> AccessService:
    return AccessService(db)


def _bearer(request: Request, token: str | None) -> str:
    token = token or request.cookies.get(get_cookie_settings().access_cookie_name)
    if not token:
        raise AuthenticationError("Could not validate credentials", code="CREDENTIALS_INVALID")
    return token[7:] if token.startswith("Bearer ") else token


async def get_current_user(
    request: Request,
    token: str = Depends(auth_scheme),
    access: AccessService = Depends(get_access_service),
):
    # Проверка стоит здесь, а не в каждой пишущей ручке: их полтора десятка, и
    # пропущенная — дыра, которую находит нарушитель.
    return await access.user_of(_bearer(request, token))


async def get_current_user_or_none(
    request: Request,
    token: str = Depends(auth_scheme),
    access: AccessService = Depends(get_access_service),
):
    """The caller, when there is one.

    A public listing is readable by a guest, but the same path must recognise its owner:
    an unpublished listing is visible to the person who wrote it and to nobody else.
    """
    try:
        return await get_current_user(request, token, access)
    except AuthenticationError:
        return None
    # AuthorizationError не перехватывается намеренно: заблокированный, пришедший с
    # токеном, получает закрытую дверь и на публичном маршруте.
