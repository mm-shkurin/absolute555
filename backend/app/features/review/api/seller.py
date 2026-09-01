"""The public profile of a seller. Open to a visitor who has not signed in."""

from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.features.review.api.review_http import to_http
from app.features.review.api.review_view import profile_view, review_view
from app.features.listing.api.sale_car_view import to_card
from app.db.database import get_db
from app.features.review.schemas.review import (
    ReviewPage,
    SellerListingPage,
    SellerProfileResponse,
)
from app.features.review.services.review_errors import ReviewError
from app.features.review.services.seller_profile import SellerProfileService

seller_router = APIRouter()


@seller_router.get("/{user_id}", response_model=SellerProfileResponse)
async def get_seller(user_id: str, db: AsyncSession = Depends(get_db)):
    """The aggregate and how much is on sale. No phone number: that stays on the card."""
    try:
        seller, listings_count = await SellerProfileService(db).profile(user_id)
    except ReviewError as error:
        raise to_http(error)
    return profile_view(seller, listings_count)


@seller_router.get("/{user_id}/reviews", response_model=ReviewPage)
async def get_seller_reviews(
    user_id: str,
    page: int = Query(default=1, ge=1),
    size: int = Query(default=20, ge=1, le=50),
    db: AsyncSession = Depends(get_db),
):
    try:
        reviews, total = await SellerProfileService(db).reviews(user_id, page, size)
    except ReviewError as error:
        raise to_http(error)
    return {
        "items": [review_view(review) for review in reviews],
        "total": total,
        "page": page,
        "size": size,
    }


@seller_router.get("/{user_id}/listings", response_model=SellerListingPage)
async def get_seller_listings(
    user_id: str,
    page: int = Query(default=1, ge=1),
    size: int = Query(default=20, ge=1, le=50),
    db: AsyncSession = Depends(get_db),
):
    """Published only: a draft or a rejected listing belongs to its owner's screens."""
    try:
        listings, total = await SellerProfileService(db).listings(user_id, page, size)
    except ReviewError as error:
        raise to_http(error)
    return {
        "items": [to_card(listing) for listing in listings],
        "total": total,
        "page": page,
        "size": size,
    }
