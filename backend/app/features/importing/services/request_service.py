"""Заявки покупателя и отклики поставщиков на них."""

import uuid
from typing import List, Optional, Tuple

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.features.importing.models.request import (
    MAX_OPEN_REQUESTS,
    BuyerRequest,
    RequestStatus,
    SupplierResponse,
)
from app.features.importing.services.request_errors import (
    RequestClosed,
    RequestLimitReached,
    RequestNotFound,
)


class BuyerRequestService:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def open(self, user_id: str, fields: dict) -> BuyerRequest:
        held = await self.db.execute(
            select(func.count())
            .select_from(BuyerRequest)
            .where(
                BuyerRequest.user_id == uuid.UUID(user_id),
                BuyerRequest.status == RequestStatus.OPEN.value,
            )
        )
        if held.scalar_one() >= MAX_OPEN_REQUESTS:
            raise RequestLimitReached(MAX_OPEN_REQUESTS)

        request = BuyerRequest(user_id=uuid.UUID(user_id), **fields)
        self.db.add(request)
        await self.db.commit()
        return await self.get(str(request.request_id))

    async def get(self, request_id: str) -> BuyerRequest:
        try:
            key = uuid.UUID(request_id)
        except ValueError:
            raise RequestNotFound(request_id)

        found = await self.db.execute(
            select(BuyerRequest)
            .where(BuyerRequest.request_id == key)
            .options(
                selectinload(BuyerRequest.brand),
                selectinload(BuyerRequest.model),
                selectinload(BuyerRequest.responses),
            )
        )
        request = found.scalar_one_or_none()
        if request is None:
            raise RequestNotFound(request_id)
        return request

    async def mine(self, user_id: str) -> List[BuyerRequest]:
        return await self._page(BuyerRequest.user_id == uuid.UUID(user_id))

    async def open_ones(self, page: int, size: int) -> Tuple[List[BuyerRequest], int]:
        """Лента поставщика: только открытые заявки, свежие первыми."""
        condition = BuyerRequest.status == RequestStatus.OPEN.value
        counted = await self.db.execute(
            select(func.count()).select_from(BuyerRequest).where(condition)
        )
        return await self._page(condition, page, size), counted.scalar_one()

    async def close(self, user_id: str, request_id: str) -> BuyerRequest:
        request = await self.get(request_id)
        if str(request.user_id) != str(user_id):
            # Чужая заявка и несуществующая — один ответ: другой сказал бы перебирающему
            # идентификаторы, какие из них живые.
            raise RequestNotFound(request_id)

        request.status = RequestStatus.CLOSED.value
        await self.db.commit()
        return await self.get(request_id)

    async def respond(self, supplier_id: str, request_id: str, fields: dict) -> SupplierResponse:
        request = await self.get(request_id)
        if request.status != RequestStatus.OPEN.value:
            raise RequestClosed(request_id)

        held = await self._response_of(request_id, supplier_id)
        if held is None:
            held = SupplierResponse(
                request_id=request.request_id, supplier_id=uuid.UUID(supplier_id), **fields
            )
            self.db.add(held)
        else:
            for name, value in fields.items():
                setattr(held, name, value)

        await self.db.commit()
        await self.db.refresh(held)
        return held

    async def responses_for(self, reader_id: str, request_id: str) -> List[SupplierResponse]:
        """Автору заявки — все отклики, поставщику — только свой."""
        request = await self.get(request_id)
        if str(request.user_id) == str(reader_id):
            return sorted(request.responses, key=lambda one: one.created_at)

        mine = await self._response_of(request_id, reader_id)
        if mine is None:
            raise RequestNotFound(request_id)
        return [mine]

    async def _response_of(self, request_id: str, supplier_id: str) -> Optional[SupplierResponse]:
        found = await self.db.execute(
            select(SupplierResponse)
            .where(SupplierResponse.request_id == uuid.UUID(request_id))
            .where(SupplierResponse.supplier_id == uuid.UUID(supplier_id))
        )
        return found.scalar_one_or_none()

    async def _page(self, condition, page: int = 1, size: int = 100) -> List[BuyerRequest]:
        found = await self.db.execute(
            select(BuyerRequest)
            .where(condition)
            .options(
                selectinload(BuyerRequest.brand),
                selectinload(BuyerRequest.model),
                selectinload(BuyerRequest.responses),
            )
            .order_by(BuyerRequest.created_at.desc())
            .offset((page - 1) * size)
            .limit(size)
        )
        return list(found.scalars().all())
