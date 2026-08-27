from pydantic import BaseModel, Field
from typing import Optional
from uuid import UUID
from datetime import datetime
from app.schemas.user import User_Data  
class ReviewCreate(BaseModel):
    rating: float = Field(..., ge=1, le=5)
    comment: Optional[str] = None

class ReviewRead(BaseModel):
    review_id: UUID
    rating: float
    chroma_document_id: Optional[str] = None
    repairs_id: UUID
    user_id: UUID
    created_at: datetime

    class Config:
        from_attributes = True

class ReviewUpdate(BaseModel):
    rating: Optional[float] = Field(None, ge=1, le=5)
    comment: Optional[str] = None

    class Config:
        from_attributes = True

class ReviewWithComment(ReviewRead):
    comment: Optional[str] = None

class ReviewReadBase(BaseModel):
    review_id: UUID
    rating: float
    chroma_document_id: Optional[str] = None
    repairs_id: UUID
    created_at: datetime

class ReviewWithUser(ReviewReadBase):
    user: User_Data  

class ReviewFull(ReviewReadBase):
    comment: Optional[str] = None
    user: User_Data