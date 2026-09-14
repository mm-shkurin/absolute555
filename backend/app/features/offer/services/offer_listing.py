"""Объявление глазами торга: найти его и спросить, открыт ли он.

Отдельно от `offer_service`, потому что это два вопроса про чужую сущность, а не про
предложение: сервис офферов подрос до лимита в 200 строк ровно тогда, когда к поиску
объявления добавилась его настройка видимости. Разрез идёт по границе, которая была:
здесь — чтение объявления, там — жизнь предложения.
"""

import uuid

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.features.listing.models.sale_car import SaleCars, SaleCarStatus
from app.features.offer.services.offer_errors import MalformedIdentifier, SaleCarNotFound


class OfferListingReader:
    db: AsyncSession

    async def _get_sale_car_or_404(self, sale_car_id: str, published_only: bool = False) -> SaleCars:
        try:
            car_uuid = uuid.UUID(sale_car_id)
        except ValueError:
            raise MalformedIdentifier("sale_car_id") from None
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

    async def offers_shown(self, sale_car_id: str) -> bool:
        """Открыл ли продавец торг по этому объявлению посторонним.

        Правило истории 10 — предложения видит владелец — осталось умолчанием; настройка
        позволяет продавцу открыть их, а не отменяет запрет для всех.
        """
        shown = await self.db.scalar(
            select(SaleCars.offers_visible).where(SaleCars.sale_car_id == sale_car_id)
        )
        return bool(shown)
