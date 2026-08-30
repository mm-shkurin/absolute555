"""VK OAuth: the login redirect and the callback it comes back to."""

import json

from fastapi import APIRouter, Depends

from app.core.exceptions import BaseErrorApp, ExternalServiceError, ValidationError
from fastapi.requests import Request
from fastapi.responses import RedirectResponse
from loguru import logger
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import CookieSettings, FrontendSettings, JWTSettings
from app.db.database import get_db
from app.schemas.token import Token
from app.services.user_service import UserService
from app.utils.security import create_access_token, create_refresh_token
from app.utils.vk_auth import generate_auth_url, get_vk_user_info, validate_callback, vk_auth

vk_router = APIRouter()
cookie_settings = CookieSettings()
frontend_settings = FrontendSettings()

@vk_router.get("/vk/login", response_class=RedirectResponse)
async def button_placeholders_vk():
    auth_url, session_id = await generate_auth_url()
    return RedirectResponse(auth_url)

@vk_router.get("/vk/callback")
async def vk_oauth_callback(
    request: Request, 
    db: AsyncSession = Depends(get_db)
):
    code = request.query_params.get("code")
    state = request.query_params.get("state")
    
    if not code or not state:
        raise ValidationError("Missing code or state", code="OAUTH_CALLBACK_INCOMPLETE")
    
    try:
        device_id = request.query_params.get("device_id")
        
        code_verifier, vk_access_token, vk_user_id = await validate_callback(code, state, device_id)
        
        vk_user_info = await get_vk_user_info(vk_access_token, vk_user_id)
        
        if not vk_user_info or not vk_user_info.get("id"):
            raise ExternalServiceError("Could not get user info from VK", code="VK_USERINFO_FAILED")
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
        
    except BaseErrorApp:
        raise
    except Exception as e:
        logger.error(f"VK callback failed: {e}")
        raise ExternalServiceError("VK sign-in failed", code="VK_LOGIN_FAILED")
