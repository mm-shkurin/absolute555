import json
from typing import Annotated
from urllib.parse import urlencode

from fastapi import APIRouter, Body, Depends, HTTPException, Query, status
from fastapi.requests import Request
from fastapi.responses import HTMLResponse, RedirectResponse
from fastapi.templating import Jinja2Templates
import httpx
from loguru import logger
import pkce
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select

from app.core.config import  YandexSettings, VKSettings
from app.core.config import JWTSettings, CookieSettings, FrontendSettings
from app.db.database import get_db
from app.models.users import Users
from app.schemas.token import Token
from app.schemas.user import User_Data
from app.services import user_service
from app.services.user_service import UserService
from app.utils.security import (
    create_access_token,
    create_refresh_token,
    refresh_access_token,
)
from app.utils.vk_auth import generate_auth_url, validate_callback, get_vk_user_info, vk_auth
from app.utils.yandex_auth import verify_yandex_user, yandex_auth
from fastapi import FastAPI, Request
from fastapi_sso.sso.yandex import YandexSSO

auth_router = APIRouter()
yandex_auth_settings = YandexSettings()
vk_auth_settings = VKSettings()
templates = Jinja2Templates(directory="app/templates")
jwt_settings = JWTSettings()
cookie_settings = CookieSettings()
frontend_settings = FrontendSettings()

@auth_router.get("/vk/login", response_class=RedirectResponse)
async def button_placeholders_vk():
    auth_url, session_id = await generate_auth_url()
    return RedirectResponse(auth_url)

@auth_router.get("/vk/callback")
async def vk_oauth_callback(
    request: Request, 
    db: AsyncSession = Depends(get_db)
):
    code = request.query_params.get("code")
    state = request.query_params.get("state")
    
    if not code or not state:
        raise HTTPException(status_code=400, detail="Missing code or state")
    
    try:
        device_id = request.query_params.get("device_id")
        
        code_verifier, vk_access_token, vk_user_id = await validate_callback(code, state, device_id)
        
        vk_user_info = await get_vk_user_info(vk_access_token, vk_user_id)
        
        if not vk_user_info or not vk_user_info.get("id"):
            raise HTTPException(status_code=400, detail="Could not get user info from VK")
        vk_json = json.dumps(vk_user_info)
        
        user_service = UserService(db)
        user_id = await user_service.create_or_get_vk_user(
            vk_id=str(vk_user_info["id"]), 
            vk_json=vk_json
        )
        
        refresh_token, jwt_access_token = await vk_auth(vk_user_info, user_id, db)
        
        return Token(
            access_token=jwt_access_token,
            refresh_token=refresh_token,
            token_type="bearer"
        )
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@auth_router.post("/refresh", response_model=Token)
async def refresh(refresh_token: str = Body(..., embed=True), db: AsyncSession = Depends(get_db)):
    new_access_token = await refresh_access_token(refresh_token)
    
    return Token(
        access_token=new_access_token,
        refresh_token=refresh_token,
        token_type="bearer"
    )


yandex_sso = YandexSSO(
    client_id=yandex_auth_settings.yandex_clientid,
    client_secret=yandex_auth_settings.yandex_client_secret,
    redirect_uri=yandex_auth_settings.yandex_redirect_uri,
    scope=["login:info", "login:avatar"] 
)

@auth_router.get("/yandex/login")
async def yandex_login():
    async with yandex_sso:
        return await yandex_sso.get_login_redirect()

@auth_router.get("/yandex/callback", response_model=Token)
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
@auth_router.get("/yandex/login/web")
async def yandex_login():
    async with yandex_sso_web:
        return await yandex_sso_web.get_login_redirect()

@auth_router.get("/yandex/callback/web")
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

@auth_router.post("/guest/login", response_model=Token)
async def guest_login(
    device_id: str = Body(..., embed=True),
    db: AsyncSession = Depends(get_db)
):
    try:
        user_service = UserService(db)
        user_id = await user_service.create_or_get_guest_user(device_id=device_id)
        
        if not user_id:
            raise HTTPException(status_code=400, detail="Failed to create guest user")
        
        access_token = await create_access_token({"id": str(user_id), "is_guest": True})
        refresh_token = await create_refresh_token({"id": str(user_id), "is_guest": True})
        
        logger.info(f"Guest login successful: user_id={user_id}, device_id={device_id}")
        
        return Token(
            access_token=access_token,
            refresh_token=refresh_token,
            token_type="bearer"
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Guest login error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))