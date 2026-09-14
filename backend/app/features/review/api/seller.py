"""The public profile of a seller. Open to a visitor who has not signed in."""

from fastapi import APIRouter, Depends, Query
from app.shared.http.paging import page_size as page_size_query
from app.features.review.deps import get_seller_profile_service

from app.features.review.api.review_http import to_http
from app.shared.http.review_view import profile_view, review_view
from app.shared.http.sale_car_view import to_card
from app.features.review.schemas.review import (
    ReviewPage,
    SellerListingPage,
    SellerProfileResponse,
)
from app.features.review.services.review_errors import ReviewError
from app.features.review.services.seller_profile import SellerProfileService

seller_router = APIRouter()


@seller_router.get("/{user_id}", response_model=SellerProfileResponse)
async def get_seller(user_id: str, seller_profile_service: SellerProfileService = Depends(get_seller_profile_service)):
    """The aggregate and how much is on sale. No phone number: that stays on the card."""
    try:
        seller, listings_count = await seller_profile_service.profile(user_id)
    except ReviewError as error:
        raise to_http(error)
    return profile_view(seller, listings_count)


@seller_router.get("/{user_id}/reviews", response_model=ReviewPage)
async def get_seller_reviews(
    user_id: str,
    page: int = Query(default=1, ge=1),
    size: int = Depends(page_size_query(most=50)),
    seller_profile_service: SellerProfileService = Depends(get_seller_profile_service),
):
    try:
        reviews, total = await seller_profile_service.reviews(user_id, page, size)
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
    size: int = Depends(page_size_query(most=50)),
    seller_profile_service: SellerProfileService = Depends(get_seller_profile_service),
):
    """Published only: a draft or a rejected listing belongs to its owner's screens."""
    try:
        listings, total = await seller_profile_service.listings(user_id, page, size)
    except ReviewError as error:
        raise to_http(error)
    return {
        "items": [to_card(listing) for listing in listings],
        "total": total,
        "page": page,
        "size": size,
    }
