from datetime import datetime, timedelta

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_

from app.core.config import OfferSettings
from app.models.sale_car import SaleCars, SaleCarStatus
from app.models.offer import LIVE, Offer, OfferStatus
from app.services.offer_notices import OfferNotices
from app.services.offer_errors import (
    DuplicatePendingOffer,
    NotOfferAuthor,
    MalformedIdentifier,
    NotCarOwner,
    OfferAlreadySettled,
    OfferNotFound,
    OfferOnOwnCar,
    SaleCarNotFound,
)
from typing import List
import uuid

offer_settings = OfferSettings()


class OfferService:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def _get_sale_car_or_404(self, sale_car_id: str, published_only: bool = False) -> SaleCars:
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
        if published_only and car.status != SaleCarStatus.PUBLISHED:
            # Bargaining over what is not in the feed leads nowhere, and saying "it is
            # not published" would confirm the listing exists to whoever walks ids.
            raise SaleCarNotFound(sale_car_id)
        return car

    async def create_offer(self, user_id: str, sale_car_id: str, price: float) -> Offer:
        car = await self._get_sale_car_or_404(sale_car_id, published_only=True)

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
            status=OfferStatus.PENDING.value,
            expires_at=datetime.utcnow() + timedelta(hours=offer_settings.offer_life_hours),
        )
        self.db.add(offer)

        # The conversation opens with the offer rather than from the card: the talk
        # begins with a price. A second offer on the same car joins the same room.
        await OfferNotices(self.db).offered(car, user_id, price)

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
        result = await self.db.execute(
            select(Offer).where(Offer.user_id == user_uuid).order_by(Offer.created_at.desc())
        )
        return result.scalars().all()

    async def get_offers_received(self, user_id: str) -> List[Offer]:
        """Offers other people sent about this person's listings.

        Two queries rather than one list the screen sorts out: an offer carries the buyer
        and not the seller, so a caller could not tell the sides apart without reading
        every listing behind them.
        """
        try:
            user_uuid = uuid.UUID(user_id)
        except ValueError:
            raise MalformedIdentifier("user_id")

        mine = select(SaleCars.sale_car_id).where(SaleCars.user_id == user_uuid)
        result = await self.db.execute(
            select(Offer).where(Offer.sale_car_id.in_(mine)).order_by(Offer.created_at.desc())
        )
        return result.scalars().all()

    async def withdraw(self, offer_id: str, user_id: str) -> Offer:
        """The buyer takes their own offer back, while it is still unanswered."""
        offer = await self.get_offer_by_id(offer_id)
        if not offer:
            raise OfferNotFound(offer_id)
        if str(offer.user_id) != str(user_id):
            raise NotOfferAuthor()
        if offer.status not in LIVE:
            raise OfferAlreadySettled(offer.status)

        offer.status = OfferStatus.WITHDRAWN.value
        await self.db.commit()
        await self.db.refresh(offer)
        return offer

    async def update_offer_status(self, offer_id: str, new_status: str, owner_id: str) -> Offer:
        """The seller answers one offer.

        Accepting is the whole sale in one transaction: this offer accepted, the listing
        sold, every other live offer closed as car_sold. Split in two it leaves either a
        sold car with offers still waiting, or closed offers on a car nobody bought.
        """
        offer = await self.get_offer_by_id(offer_id)
        if not offer:
            raise OfferNotFound(offer_id)

        car = await self._get_sale_car_or_404(str(offer.sale_car_id))
        if str(car.user_id) != owner_id:
            raise NotCarOwner()

        if offer.status not in LIVE:
            raise OfferAlreadySettled(offer.status)

        if new_status == OfferStatus.ACCEPTED.value:
            if car.status != SaleCarStatus.PUBLISHED:
                raise SaleCarNotFound(str(car.sale_car_id))
            await self._sell(car, offer)
        else:
            offer.status = OfferStatus.REJECTED.value

        await self.db.commit()
        await self.db.refresh(offer)
        return offer

    async def _sell(self, car: SaleCars, accepted: Offer) -> None:
        others = await self.db.execute(
            select(Offer).where(
                Offer.sale_car_id == car.sale_car_id,
                Offer.offer_id != accepted.offer_id,
                Offer.status == OfferStatus.PENDING.value,
            )
        )
        closed = list(others.scalars())
        for other in closed:
            # car_sold, not rejected: the seller turned nobody down, somebody else simply
            # bought the car first, and the screen says exactly that.
            other.status = OfferStatus.CAR_SOLD.value

        accepted.status = OfferStatus.ACCEPTED.value
        car.status = SaleCarStatus.SOLD

        await OfferNotices(self.db).sold(
            car, accepted.user_id, [other.user_id for other in closed]
        )