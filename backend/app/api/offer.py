from fastapi import APIRouter, Depends, HTTPException, status
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
from app.utils.security import get_current_user
from app.permissions.dependencies import require_permission
from app.permissions.guests import check_guest_car_limit, forbid_guest
from app.permissions.ownership import can_manage_offer, can_manage_offer_as_owner
offer_router = APIRouter()
@offer_router.post("/", response_model=OfferResponse, status_code=status.HTTP_201_CREATED)
async def create_offer(
    offer_in: OfferCreate,
    db: AsyncSession = Depends(get_db),
    current_user: Users = Depends(get_current_user)
):
    service = OfferService(db)
    try:
        offer = await service.create_offer(
            user_id=str(current_user.id),
            sale_car_id=str(offer_in.sale_car_id),
            price=offer_in.price
        )
        return offer
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error creating offer: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")

@offer_router.get("/my", response_model=List[OfferResponse])
async def get_my_offers(
    db: AsyncSession = Depends(get_db),
    current_user: Users = Depends(get_current_user)
):
    service = OfferService(db)
    offers = await service.get_offers_by_user(str(current_user.id))
    return offers

@offer_router.get("/car/{sale_car_id}", response_model=List[OfferResponse])
async def get_offers_for_car(
    sale_car_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: Users = Depends(forbid_guest)
):
    service = OfferService(db)
    if not await can_manage_offer_as_owner(current_user, sale_car_id, db):
        raise HTTPException(status_code=403, detail="Access denied: only car owner can view all offers")

    offers = await service.get_offers_by_sale_car(sale_car_id)
    return offers

@offer_router.get("/{offer_id}", response_model=OfferResponse)
async def get_offer_by_id(
    offer_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: Users = Depends(get_current_user)
):
    service = OfferService(db)
    offer = await service.get_offer_by_id(offer_id)
    if not offer:
        raise HTTPException(status_code=404, detail="Offer not found")

    if not await can_manage_offer(current_user, offer, db):
        raise HTTPException(status_code=403, detail="Access denied")

    return offer

@offer_router.patch("/{offer_id}/status", response_model=OfferResponse)
async def update_offer_status(
    offer_id: str,
    status_update: OfferStatusUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: Users = Depends(get_current_user)
):
    service = OfferService(db)
    offer = await service.get_offer_by_id(offer_id)
    if not offer:
        raise HTTPException(status_code=404, detail="Offer not found")

    if not await can_manage_offer_as_owner(current_user, str(offer.sale_car_id), db):
        raise HTTPException(status_code=403, detail="Access denied: only car owner can change status")

    try:
        updated_offer = await service.update_offer_status(
            offer_id=offer_id,
            new_status=status_update.status,
            owner_id=str(current_user.id) 
        )
        return updated_offer
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"Error updating offer status: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")
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
        raise HTTPException(status_code=404, detail="Offer not found")
    if str(offer.user_id) != str(current_user.id):
        raise HTTPException(status_code=403, detail="Access denied: only the author can delete this offer")

    try:
        await service.delete_offer(offer_id)
        return None
    except Exception as e:
        logger.error(f"Error deleting offer: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")

@router.get("/{offer_id}/with-details", response_model=OfferWithCarResponse)
async def get_offer_with_car_details(
    offer_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: Users = Depends(get_current_user)
):
    service = OfferService(db)
    offer = await service.get_offer_by_id(offer_id)
    if not offer:
        raise HTTPException(status_code=404, detail="Offer not found")

    if not await can_manage_offer(current_user, offer, db):
        raise HTTPException(status_code=403, detail="Access denied")

    car_data = {}  
    return {
        **offer.__dict__,
        "car": car_data
    }
"""