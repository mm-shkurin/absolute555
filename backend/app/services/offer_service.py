from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, delete, and_
from app.models.sale_car import SaleCars
from app.models.offer import Offer, OfferStatus
from app.services.offer_errors import (
    DuplicatePendingOffer,
    MalformedIdentifier,
    NotCarOwner,
    OfferAlreadySettled,
    OfferNotFound,
    OfferOnOwnCar,
    SaleCarNotFound,
)
from typing import List
import uuid

class OfferService:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def _get_sale_car_or_404(self, sale_car_id: str) -> SaleCars:
        try:
            car_uuid = uuid.UUID(sale_car_id)
        except ValueError:
            raise MalformedIdentifier("sale_car_id")
        result = await self.db.execute(
            select(SaleCars).where(SaleCars.sale_car_id == car_uuid)
        )
        car = result.scalar_one_or_none()
        if not car:
            raise SaleCarNotFound(sale_car_id)
        return car

    async def create_offer(self, user_id: str, sale_car_id: str, price: float) -> Offer:
        car = await self._get_sale_car_or_404(sale_car_id)

        if str(car.user_id) == user_id:
            raise OfferOnOwnCar()

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
            raise DuplicatePendingOffer()

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
            raise MalformedIdentifier("offer_id")
        result = await self.db.execute(select(Offer).where(Offer.offer_id == uuid_))
        return result.scalar_one_or_none()

    async def get_offers_by_sale_car(self, sale_car_id: str) -> List[Offer]:
        try:
            car_uuid = uuid.UUID(sale_car_id)
        except ValueError:
            raise MalformedIdentifier("sale_car_id")
        result = await self.db.execute(select(Offer).where(Offer.sale_car_id == car_uuid))
        return result.scalars().all()

    async def get_offers_by_user(self, user_id: str) -> List[Offer]:
        try:
            user_uuid = uuid.UUID(user_id)
        except ValueError:
            raise MalformedIdentifier("user_id")
        result = await self.db.execute(select(Offer).where(Offer.user_id == user_uuid))
        return result.scalars().all()

    async def update_offer_status(self, offer_id: str, new_status: OfferStatus, owner_id: str) -> Offer:
        offer = await self.get_offer_by_id(offer_id)
        if not offer:
            raise OfferNotFound(offer_id)

        car = await self._get_sale_car_or_404(str(offer.sale_car_id))
        if str(car.user_id) != owner_id:
            raise NotCarOwner()

        if offer.status != OfferStatus.PENDING:
            raise OfferAlreadySettled(offer.status)

        offer.status = new_status
        await self.db.commit()
        await self.db.refresh(offer)
        return offer