from typing import List, Optional
from uuid import UUID
from pydantic import BaseModel
from datetime import datetime
from app.permissions.roles import UserRole

class UserRoleUpdate(BaseModel):
    new_role: UserRole
    reason: str

class UserRoleInfo(BaseModel):
    user_id: UUID
    current_role: str
    is_verified: bool

class RoleStats(BaseModel):
    total_users: int
    users_by_role: dict  
    verified_users: int
    unverified_users: int

class RoleRequestCreate(BaseModel):
    requested_role: UserRole
    reason: str
    additional_info: Optional[str] = None

class RoleRequestResponse(BaseModel):
    id: UUID
    user_id: UUID
    requested_role: UserRole
    reason: str
    additional_info: Optional[str] = None
    status: str 
    created_at: datetime
    updated_at: datetime
    reviewed_by: Optional[UUID] = None
    reviewed_at: Optional[datetime] = None
    review_comment: Optional[str] = None
    
    class Config:
        from_attributes = True

class RoleRequestListResponse(BaseModel):
    id: UUID
    user_id: UUID
    user_name: str
    requested_role: UserRole
    reason: str
    status: str
    created_at: datetime
    
    class Config:
        from_attributes = True

class RoleRequestUpdate(BaseModel):
    status: str  
    review_comment: Optional[str] = None
