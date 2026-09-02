import json
from typing import Annotated
from urllib.parse import urlencode

from fastapi import APIRouter, Body, Depends, Query, status
from fastapi.requests import Request
from fastapi.responses import HTMLResponse, RedirectResponse
import httpx
from loguru import logger
import pkce
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select

from app.db.database import get_db
from app.features.auth.schemas.token import Token
from app.features.account.schemas.user import User_Data
from app.features.account.services.user_service import UserService
from app.utils.security import (
    create_access_token,
    create_refresh_token,
    refresh_access_token,
    get_current_user,
)
import json
from app.permissions.dependencies import CurrentUser

user_router = APIRouter()

@user_router.get("/profile", response_model=User_Data)
async def get_profile(current_user: CurrentUser):
    
    
    yandex_json_parsed = None
    if current_user.yandex_json:
        try:
            yandex_json_parsed = json.loads(current_user.yandex_json)
        except json.JSONDecodeError:
            yandex_json_parsed = None
    
    vk_json_parsed = None
    if current_user.vk_json:
        try:
            if isinstance(current_user.vk_json, dict):
                vk_json_parsed = current_user.vk_json
            else:
                vk_json_parsed = json.loads(current_user.vk_json)
        except (json.JSONDecodeError, TypeError):
            vk_json_parsed = None
    guest_json_parsed = None
    if current_user.guest_json:
        try:
            guest_json_parsed = current_user.guest_json if isinstance(current_user.guest_json, dict) else json.loads(current_user.guest_json)
        except (json.JSONDecodeError, TypeError):
            guest_json_parsed = None

    user_type = "guest" if current_user.is_guest else "regular"

    return User_Data(
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