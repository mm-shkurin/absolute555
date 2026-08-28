"""Yandex OAuth, in two flavours.

The mobile client and the web client are given different redirect URIs, which is why
there are two SSO objects and two pairs of routes rather than one parameterised pair.
"""

import json

from fastapi import APIRouter, Depends, HTTPException
from fastapi.requests import Request
from fastapi.responses import RedirectResponse
from fastapi_sso.sso.yandex import YandexSSO
from loguru import logger
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import CookieSettings, FrontendSettings, JWTSettings, YandexSettings
from app.db.database import get_db
from app.schemas.token import Token
from app.services.user_service import UserService
from app.utils.security import create_access_token, create_refresh_token
from app.utils.yandex_auth import verify_yandex_user, yandex_auth

yandex_router = APIRouter()
yandex_auth_settings = YandexSettings()
jwt_settings = JWTSettings()
cookie_settings = CookieSettings()
frontend_settings = FrontendSettings()

yandex_sso = YandexSSO(
    client_id=yandex_auth_settings.yandex_clientid,
    client_secret=yandex_auth_settings.yandex_client_secret,
    redirect_uri=yandex_auth_settings.yandex_redirect_uri,
    scope=["login:info", "login:avatar"] 
)

@yandex_router.get("/yandex/login")
async def yandex_login():
    async with yandex_sso:
        return await yandex_sso.get_login_redirect()

@yandex_router.get("/yandex/callback", response_model=Token)
async def yandex_callback(request: Request, db: AsyncSession = Depends(get_db)):
    async with yandex_sso:
        user = await yandex_sso.verify_and_process(request)

    yandex_data = getattr(user, "__dict__", {})
    
    is_valid = await verify_yandex_user(yandex_data)
    if not is_valid:
        raise HTTPException(status_code=400, detail="Invalid user data")
    
    yandex_json = json.dumps(yandex_data)

    user_service = UserService(db)
    yandex_id = str(user.id)
    id = await user_service.create_or_get_yandex_user(
        yandex_id=yandex_id,
        yandex_json=yandex_json
    )

    refresh_token, access_token = await yandex_auth(id=id, db=db)
    return Token(
        access_token=access_token,
        refresh_token=refresh_token,
        token_type="bearer"
    )
yandex_sso_web = YandexSSO(
    client_id=yandex_auth_settings.yandex_clientid,
    client_secret=yandex_auth_settings.yandex_client_secret,
    redirect_uri=yandex_auth_settings.yandex_redirect_uri_web,
    scope=["login:info", "login:avatar"] 
)
@yandex_router.get("/yandex/login/web")
async def yandex_login_web():
    async with yandex_sso_web:
        return await yandex_sso_web.get_login_redirect()

@yandex_router.get("/yandex/callback/web")
async def yandex_callback_web(request: Request, db: AsyncSession = Depends(get_db)):
    async with yandex_sso_web:
        user = await yandex_sso_web.verify_and_process(request)

    yandex_data = getattr(user, "__dict__", {})

    is_valid = await verify_yandex_user(yandex_data)
    if not is_valid:
        raise HTTPException(status_code=400, detail="Invalid user data")

    yandex_json = json.dumps(yandex_data)

    user_service = UserService(db)
    yandex_id = str(user.id)
    id = await user_service.create_or_get_yandex_user(
        yandex_id=yandex_id,
        yandex_json=yandex_json
    )

    refresh_token, access_token = await yandex_auth(id=id, db=db)

    response = RedirectResponse(url=str(frontend_settings.frontend_url))

    response.set_cookie(
        key=cookie_settings.access_cookie_name,
        value=access_token,
        httponly=True,
        secure=cookie_settings.cookie_secure,
        samesite=cookie_settings.cookie_samesite,
        domain=cookie_settings.cookie_domain,
        path=cookie_settings.cookie_path,
        max_age=jwt_settings.access_token_expire_minutes * 60,
    )
    response.set_cookie(
        key=cookie_settings.refresh_cookie_name,
        value=refresh_token,
        httponly=True,
        secure=cookie_settings.cookie_secure,
        samesite=cookie_settings.cookie_samesite,
        domain=cookie_settings.cookie_domain,
        path=cookie_settings.cookie_path,
        max_age=jwt_settings.refresh_token_expire_minutes * 60,
    )

    return response
