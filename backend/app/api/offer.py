from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List, Optional
from loguru import logger

from app.db.database import get_db
from app.models.users import Users
from app.models.offer import OfferStatus as OfferStatusEnum
from app.services.offer_service import OfferService
from app.schemas.offer import (
    OfferCreate,
    OfferResponse,
    OfferStatusUpdate,
    OfferWithCarResponse
)
from app.core.exceptions import AuthorizationError, ResourceNotFoundError
from app.services.offer_errors import OfferError
from app.api.offer_http import to_http
from app.utils.security import get_current_user
from app.permissions.dependencies import require_permission
from app.permissions.guests import check_guest_car_limit, forbid_guest
from app.permissions.ownership import can_manage_offer, can_manage_offer_as_owner
offer_router = APIRouter()
@offer_router.post("/", response_model=OfferResponse, status_code=status.HTTP_201_CREATED)
async def create_offer(
    offer_in: OfferCreate,
    db: AsyncSession = Depends(get_db),
    current_user: Users = Depends(forbid_guest)
):
    """A guest does not bargain: they cannot read the offers on their own listing either,
    so leaving this route open to them was an inconsistency rather than a decision."""
    service = OfferService(db)
    try:
        offer = await service.create_offer(
            user_id=str(current_user.id),
            sale_car_id=str(offer_in.sale_car_id),
            price=offer_in.price
        )
        return offer
    except OfferError as error:
        raise to_http(error)

@offer_router.get("/my", response_model=List[OfferResponse])
async def get_my_offers(
    side: str = Query(default="sent", pattern="^(sent|received)$"),
    db: AsyncSession = Depends(get_db),
    current_user: Users = Depends(get_current_user)
):
    """Two tabs, two queries: an offer carries the buyer and not the seller, so one
    combined list could not be split by the client that received it."""
    service = OfferService(db)
    if side == "received":
        return await service.get_offers_received(str(current_user.id))
    return await service.get_offers_by_user(str(current_user.id))


@offer_router.post("/{offer_id}/withdraw", response_model=OfferResponse)
async def withdraw_offer(
    offer_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: Users = Depends(get_current_user)
):
    """The buyer takes an unanswered offer back. They may send another afterwards."""
    try:
        return await OfferService(db).withdraw(offer_id, str(current_user.id))
    except OfferError as error:
        raise to_http(error)

@offer_router.get("/car/{sale_car_id}", response_model=List[OfferResponse])
async def get_offers_for_car(
    sale_car_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: Users = Depends(forbid_guest)
):
    service = OfferService(db)
    if not await can_manage_offer_as_owner(current_user, sale_car_id, db):
        raise AuthorizationError("Only the car owner may see every offer", code="NOT_CAR_OWNER")

    try:
        return await service.get_offers_by_sale_car(sale_car_id)
    except OfferError as error:
        raise to_http(error)

@offer_router.get("/{offer_id}", response_model=OfferResponse)
async def get_offer_by_id(
    offer_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: Users = Depends(get_current_user)
):
    service = OfferService(db)
    try:
        # Inside the guard: an identifier that is not one is a refusal the service
        # states, and reading it outside turned "not-a-uuid" into a 500.
        offer = await service.get_offer_by_id(offer_id)
    except OfferError as error:
        raise to_http(error)

    if not offer:
        raise ResourceNotFoundError("Offer not found", code="OFFER_NOT_FOUND")

    if not await can_manage_offer(current_user, offer, db):
        raise AuthorizationError("Access denied", code="NOT_OFFER_PARTY")

    return offer

@offer_router.patch("/{offer_id}/status", response_model=OfferResponse)
async def update_offer_status(
    offer_id: str,
    status_update: OfferStatusUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: Users = Depends(get_current_user)
):
    service = OfferService(db)
    try:
        offer = await service.get_offer_by_id(offer_id)
    except OfferError as error:
        raise to_http(error)

    if not offer:
        raise ResourceNotFoundError("Offer not found", code="OFFER_NOT_FOUND")

    if not await can_manage_offer_as_owner(current_user, str(offer.sale_car_id), db):
        raise AuthorizationError("Only the car owner may change an offer's status", code="NOT_CAR_OWNER")

    try:
        updated_offer = await service.update_offer_status(
            offer_id=offer_id,
            new_status=status_update.status.value,
            owner_id=str(current_user.id) 
        )
        return updated_offer
    except OfferError as error:
        raise to_http(error)
"""
@router.delete("/{offer_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_offer(
    offer_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: Users = Depends(get_current_user)
):
    service = OfferService(db)
    offer = await service.get_offer_by_id(offer_id)
    if not offer:
        raise ResourceNotFoundError("Offer not found", code="OFFER_NOT_FOUND")
    if str(offer.user_id) != str(current_user.id):
        raise AuthorizationError("Only the author may delete this offer", code="NOT_OFFER_AUTHOR")

    try:
        await service.delete_offer(offer_id)
        return None


@router.get("/{offer_id}/with-details", response_model=OfferWithCarResponse)
async def get_offer_with_car_details(
    offer_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: Users = Depends(get_current_user)
):
    service = OfferService(db)
    offer = await service.get_offer_by_id(offer_id)
    if not offer:
        raise ResourceNotFoundError("Offer not found", code="OFFER_NOT_FOUND")

    if not await can_manage_offer(current_user, offer, db):
        raise AuthorizationError("Access denied", code="NOT_OFFER_PARTY")

    car_data = {}  
    return {
        **offer.__dict__,
        "car": car_data
    }
"""