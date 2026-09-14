"""Service providers of the review feature: where its routers get services, wired with their collaborators."""

from fastapi import Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.database import get_db
from app.features.review.services.seller_profile_service import SellerProfileService
from app.features.review.services.review_service import ReviewService
from app.features.review.services.dialog_review_service import DialogReviewService


def get_dialog_review_service(db: AsyncSession = Depends(get_db)) -> DialogReviewService:
    return DialogReviewService(db, ReviewService(db))


def get_review_service(db: AsyncSession = Depends(get_db)) -> ReviewService:
    return ReviewService(db)


def get_seller_profile_service(db: AsyncSession = Depends(get_db)) -> SellerProfileService:
    return SellerProfileService(db)
