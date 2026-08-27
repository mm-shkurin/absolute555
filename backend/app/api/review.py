"""from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from uuid import UUID
from app.db.database import get_db
from app.models.users import Users
from app.utils.security import get_current_user
from app.permissions.dependencies import require_permission, require_any_permission
from app.permissions.permissions import Permission
from app.services.chromadb_service import ChromaService
from app.services.review_service import ReviewService
from app.schemas.review import ReviewCreate, ReviewRead, ReviewUpdate, ReviewWithComment,ReviewFull
from typing import List

review_router = APIRouter()

def get_chroma_service():
    return ChromaService(collection_name="reviews")

@review_router.post("/{repairs_id}", response_model=ReviewRead, status_code=status.HTTP_201_CREATED)
async def create_review(
    repairs_id: UUID,
    review: ReviewCreate,
    current_user: Users = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
    chroma: ChromaService = Depends(get_chroma_service)
):
    service = ReviewService(db, chroma)
    return await service.create_review(
        user_id=current_user.id,
        repairs_id=repairs_id,
        review_in=review
    )

@review_router.get("/reviews/{review_id}", response_model=ReviewWithComment)
async def get_review_with_comment(
    review_id: UUID,
    current_user: Users = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
    chroma: ChromaService = Depends(get_chroma_service)
):
    service = ReviewService(db, chroma)
    review = await service.get_review_with_comment(review_id)
    if not review:
        raise HTTPException(status_code=404, detail="Review not found")
    if review.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized")
    return review

@review_router.get("/{repairs_id}", response_model=List[ReviewFull])
async def list_reviews_with_user_and_comment(
    repairs_id: UUID,
    db: AsyncSession = Depends(get_db),
    chroma: ChromaService = Depends(get_chroma_service)
):
    service = ReviewService(db, chroma)
    return await service.get_reviews_with_user_and_comment(repairs_id)

@review_router.put("/reviews/{review_id}", response_model=ReviewRead)
async def update_review(
    review_id: UUID,
    review: ReviewUpdate,
    current_user: Users = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
    chroma: ChromaService = Depends(get_chroma_service)
):
    service = ReviewService(db, chroma)
    existing = await service.get_review_by_id(review_id)
    if not existing:
        raise HTTPException(status_code=404, detail="Review not found")
    if existing.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized")

    updated = await service.update_review(review_id, review)
    return updated

@review_router.delete("/reviews/{review_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_review(
    review_id: UUID,
    current_user: Users = Depends(require_any_permission([
        Permission.DELETE_OWN_REVIEW,
        Permission.DELETE_ANY_REVIEW
    ])),
    db: AsyncSession = Depends(get_db),
    chroma: ChromaService = Depends(get_chroma_service)
):
    service = ReviewService(db, chroma)
    existing = await service.get_review_by_id(review_id)
    if not existing:
        raise HTTPException(status_code=404, detail="Review not found")
    if (current_user.role != "admin" and current_user.role != "owner" and 
        existing.user_id != current_user.id):
        raise HTTPException(status_code=403, detail="Not authorized to delete this review")

    success = await service.delete_review(review_id)
    if not success:
        raise HTTPException(status_code=500, detail="Failed to delete review")"""