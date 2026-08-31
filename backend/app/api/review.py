"""Leaving a review, and correcting one.

There is no route that reviews a seller by name: the way in is the accepted offer, and
that is the whole defence against a rating anyone could raise without a deal.
"""

from fastapi import APIRouter, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.review_http import to_http
from app.api.review_view import review_view
from app.db.database import get_db
from app.permissions.guests import forbid_guest
from app.schemas.review import ReviewCreate, ReviewPatch, ReviewResponse
from app.services.review_errors import ReviewError
from app.services.review_service import ReviewService

review_router = APIRouter()


@review_router.post(
    "/offer/{offer_id}/review",
    response_model=ReviewResponse,
    status_code=status.HTTP_201_CREATED,
    tags=["review"],
)
async def create_review(
    offer_id: str,
    body: ReviewCreate,
    db: AsyncSession = Depends(get_db),
    current_user = Depends(forbid_guest),
):
    """A guest leaves no review: a guest does not bargain, so a guest has no deal."""
    try:
        review = await ReviewService(db).create(
            offer_id=offer_id,
            author_id=str(current_user.id),
            rating=body.rating,
            text=body.text,
        )
    except ReviewError as error:
        raise to_http(error)

    review.author = current_user
    return review_view(review)


@review_router.patch("/review/{review_id}", response_model=ReviewResponse, tags=["review"])
async def update_review(
    review_id: str,
    body: ReviewPatch,
    db: AsyncSession = Depends(get_db),
    current_user = Depends(forbid_guest),
):
    """Within a day of writing it. After that the review settles and the rating stands."""
    try:
        review = await ReviewService(db).update(
            review_id=review_id,
            author_id=str(current_user.id),
            rating=body.rating,
            text=body.text,
            text_given="text" in body.model_fields_set,
        )
    except ReviewError as error:
        raise to_http(error)

    review.author = current_user
    return review_view(review)
