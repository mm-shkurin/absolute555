from datetime import datetime
from typing import Any, Dict, Optional
from uuid import UUID

from pydantic import BaseModel
from pydantic import BaseModel, validator
from app.permissions.roles import UserRole
import json

class User_Data(BaseModel):
    id: UUID
    tg_id: Optional[str] = None
    vk_id: Optional[str] = None
    yandex_id: Optional[str] = None
    device_id: Optional[str] = None 
    
    tg_json: Optional[Dict[str, Any]] = None  
    yandex_json: Optional[Dict[str, Any]] = None   
    vk_json: Optional[Dict[str, Any]] = None
    guest_json: Optional[Dict[str, Any]] = None   
    
    user_type: str = "regular"
    role: Optional[str] = None
    is_verified: Optional[bool] = None
    is_guest: Optional[bool] = False
    
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None
    
    class Config:
        from_attributes = True