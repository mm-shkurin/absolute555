from typing import List

from fastapi import APIRouter, Depends, Query, status

from app.core.exceptions import AuthorizationError
from app.features.offer.deps import get_offer_access_service, get_offer_service
from app.features.offer.services.offer_access_service import OfferAccessService
from app.features.offer.schemas.offer import (
    OfferCreate,
    OfferResponse,
    OfferStatusUpdate,
)
from app.features.offer.services.offer_errors import NotOfferParty
from app.features.offer.services.offer_service import OfferService
from app.features.offer.domain.statuses import OfferStatus
from app.features.review.deps import get_review_service
from app.features.review.services.review_service import ReviewService
from app.permissions.guests import forbid_guest
from app.features.review.api.review_view import offer_view
from app.features.auth.deps import get_current_user

offer_router = APIRouter()


@offer_router.post("/", response_model=OfferResponse, status_code=status.HTTP_201_CREATED)
async def create_offer(
    offer_in: OfferCreate,
    offer_service: OfferService = Depends(get_offer_service),
    current_user=Depends(forbid_guest)
):
    """A guest does not bargain: they cannot read the offers on their own listing either,
    so leaving this route open to them was an inconsistency rather than a decision."""
    return await offer_service.create_offer(
        user_id=str(current_user.id),
        sale_car_id=str(offer_in.sale_car_id),
        price=offer_in.price
    )


@offer_router.get("/my", response_model=List[OfferResponse])
async def get_my_offers(
    side: str = Query(default="sent", pattern="^(sent|received)$"),
    offer_service: OfferService = Depends(get_offer_service),
    review_service: ReviewService = Depends(get_review_service),
    current_user=Depends(get_current_user)
):
    """Two tabs, two queries: an offer carries the buyer and not the seller, so one
    combined list could not be split by the client that received it.

    An offer of one's own also says whether the deal it closed may be reviewed, and which
    review already stands: the screen draws one button from those two answers.
    """
    if side == "received":
        return [offer_view(offer, None, False) for offer in await offer_service.get_offers_received(str(current_user.id))]

    offers = await offer_service.get_offers_by_user(str(current_user.id))
    written = await review_service.reviews_by_offer([offer.offer_id for offer in offers])
    return [
        offer_view(
            offer,
            written.get(str(offer.offer_id)),
            offer.status == OfferStatus.ACCEPTED.value,
        )
        for offer in offers
    ]


@offer_router.post("/{offer_id}/withdraw", response_model=OfferResponse)
async def withdraw_offer(
    offer_id: str,
    offer_service: OfferService = Depends(get_offer_service),
    current_user=Depends(get_current_user)
):
    """The buyer takes an unanswered offer back. They may send another afterwards."""
    return await offer_service.withdraw(offer_id, str(current_user.id))


@offer_router.get("/car/{sale_car_id}", response_model=List[OfferResponse])
async def get_offers_for_car(
    sale_car_id: str,
    access: OfferAccessService = Depends(get_offer_access_service),
    offer_service: OfferService = Depends(get_offer_service),
    current_user=Depends(forbid_guest)
):
    if not await access.manages_as_owner(current_user, sale_car_id):
        # Не владелец видит торг, только если продавец сам его открыл: до появления этой
        # настройки предложения были закрыты всем, и решение показать их принадлежит
        # тому, чью машину обсуждают.
        if not await offer_service.offers_shown(sale_car_id):
            raise AuthorizationError(
                "Only the car owner may see every offer", code="NOT_CAR_OWNER"
            )

    return await offer_service.get_offers_by_sale_car(sale_car_id)


@offer_router.get("/{offer_id}", response_model=OfferResponse)
async def get_offer_by_id(
    offer_id: str,
    access: OfferAccessService = Depends(get_offer_access_service),
    offer_service: OfferService = Depends(get_offer_service),
    current_user=Depends(get_current_user)
):
    offer = await offer_service.offer_of(offer_id)
    if not await access.manages(current_user, offer):
        raise NotOfferParty()
    return offer


@offer_router.patch("/{offer_id}/status", response_model=OfferResponse)
async def update_offer_status(
    offer_id: str,
    status_update: OfferStatusUpdate,
    access: OfferAccessService = Depends(get_offer_access_service),
    offer_service: OfferService = Depends(get_offer_service),
    current_user=Depends(get_current_user)
):
    offer = await offer_service.offer_of(offer_id)
    if not await access.manages_as_owner(current_user, str(offer.sale_car_id)):
        raise AuthorizationError("Only the car owner may change an offer's status", code="NOT_CAR_OWNER")

    return await offer_service.update_offer_status(
        offer_id=offer_id,
        new_status=status_update.status.value,
        owner_id=str(current_user.id)
    )
