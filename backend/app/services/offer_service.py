from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, delete, and_
from app.models.sale_car import SaleCars
from app.models.offer import Offer, OfferStatus
from typing import List
import uuid
from fastapi import HTTPException, status

class OfferService:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def _get_sale_car_or_404(self, sale_car_id: str) -> SaleCars:
        try:
            car_uuid = uuid.UUID(sale_car_id)
        except ValueError:
            raise HTTPException(status_code=422, detail="Invalid sale_car_id format")
        result = await self.db.execute(
            select(SaleCars).where(SaleCars.sale_car_id == car_uuid)
        )
        car = result.scalar_one_or_none()
        if not car:
            raise HTTPException(status_code=404, detail="Sale car not found")
        return car

    async def create_offer(self, user_id: str, sale_car_id: str, price: float) -> Offer:
        car = await self._get_sale_car_or_404(sale_car_id)

        if str(car.user_id) == user_id:
            raise HTTPException(status_code=400, detail="Cannot make offer on your own car")

        existing = await self.db.execute(
            select(Offer).where(
                and_(
                    Offer.sale_car_id == car.sale_car_id,
                    Offer.user_id == uuid.UUID(user_id),
                    Offer.status == OfferStatus.PENDING
                )
            )
        )
        if existing.scalar_one_or_none():
            raise HTTPException(status_code=400, detail="You already have a pending offer for this car")

        offer = Offer(
            user_id=uuid.UUID(user_id),
            sale_car_id=car.sale_car_id,
            price=price,
            status=OfferStatus.PENDING
        )
        self.db.add(offer)
        await self.db.commit()
        await self.db.refresh(offer)
        return offer

    async def get_offer_by_id(self, offer_id: str) -> Offer | None:
        try:
            uuid_ = uuid.UUID(offer_id)
        except ValueError:
            raise HTTPException(status_code=422, detail="Invalid offer_id format")
        result = await self.db.execute(select(Offer).where(Offer.offer_id == uuid_))
        return result.scalar_one_or_none()

    async def get_offers_by_sale_car(self, sale_car_id: str) -> List[Offer]:
        try:
            car_uuid = uuid.UUID(sale_car_id)
        except ValueError:
            raise HTTPException(status_code=422, detail="Invalid sale_car_id format")
        result = await self.db.execute(select(Offer).where(Offer.sale_car_id == car_uuid))
        return result.scalars().all()

    async def get_offers_by_user(self, user_id: str) -> List[Offer]:
        try:
            user_uuid = uuid.UUID(user_id)
        except ValueError:
            raise HTTPException(status_code=422, detail="Invalid user_id format")
        result = await self.db.execute(select(Offer).where(Offer.user_id == user_uuid))
        return result.scalars().all()

    async def update_offer_status(self, offer_id: str, new_status: OfferStatus, owner_id: str) -> Offer:
        offer = await self.get_offer_by_id(offer_id)
        if not offer:
            raise HTTPException(status_code=404, detail="Offer not found")

        car = await self._get_sale_car_or_404(str(offer.sale_car_id))
        if str(car.user_id) != owner_id:
            raise HTTPException(status_code=403, detail="Only car owner can change offer status")

        if offer.status != OfferStatus.PENDING:
            raise HTTPException(status_code=400, detail="Only pending offers can be updated")

        offer.status = new_status
        await self.db.commit()
        await self.db.refresh(offer)
        return offer