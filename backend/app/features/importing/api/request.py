"""Заявки покупателя и отклики поставщиков, по HTTP."""

from typing import List

from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.database import get_db
from app.features.importing.schemas.request import (
    BuyerRequestCreate,
    BuyerRequestPage,
    BuyerRequestResponse,
    SupplierResponseCreate,
    SupplierResponseView,
)
from app.features.importing.services.request_service import BuyerRequestService
from app.features.importing.services.supplier_errors import SupplierError
from app.permissions.dependencies import require_permission
from app.permissions.permissions import Permission
from app.utils.security import get_current_user

from .request_http import to_http
from .request_view import request_view, request_views

request_router = APIRouter()

IMPORTER = require_permission(Permission.MANAGE_SUPPLIER_PROFILE)


@request_router.post("", response_model=BuyerRequestResponse, status_code=status.HTTP_201_CREATED)
async def open_request(
    body: BuyerRequestCreate,
    db: AsyncSession = Depends(get_db),
    current_user=Depends(get_current_user),
):
    try:
        opened = await BuyerRequestService(db).open(
            str(current_user.id), body.model_dump(exclude_unset=True)
        )
    except SupplierError as error:
        raise to_http(error)
    return request_view(opened)


@request_router.get("/my", response_model=List[BuyerRequestResponse])
async def read_my_requests(
    db: AsyncSession = Depends(get_db), current_user=Depends(get_current_user)
):
    return request_views(await BuyerRequestService(db).mine(str(current_user.id)))


@request_router.get("", response_model=BuyerRequestPage)
async def read_open_requests(
    page: int = Query(default=1, ge=1),
    size: int = Query(default=20, ge=1, le=60),
    db: AsyncSession = Depends(get_db),
    importer=Depends(IMPORTER),
):
    """Лента спроса. Открыта поставщику: покупателю она сказала бы, с кем он в очереди."""
    found, total = await BuyerRequestService(db).open_ones(page, size)
    return {"items": request_views(found), "total": total, "page": page, "size": size}


@request_router.post("/{request_id}/close", response_model=BuyerRequestResponse)
async def close_request(
    request_id: str,
    db: AsyncSession = Depends(get_db),
    current_user=Depends(get_current_user),
):
    try:
        closed = await BuyerRequestService(db).close(str(current_user.id), request_id)
    except SupplierError as error:
        raise to_http(error)
    return request_view(closed)


@request_router.put("/{request_id}/response", response_model=SupplierResponseView)
async def respond(
    request_id: str,
    body: SupplierResponseCreate,
    db: AsyncSession = Depends(get_db),
    importer=Depends(IMPORTER),
):
    """Идемпотентно: один отклик на поставщика, повторный вызов правит свой."""
    try:
        answered = await BuyerRequestService(db).respond(
            str(importer.id), request_id, body.model_dump()
        )
    except SupplierError as error:
        raise to_http(error)
    return answered


@request_router.get("/{request_id}/responses", response_model=List[SupplierResponseView])
async def read_responses(
    request_id: str,
    db: AsyncSession = Depends(get_db),
    current_user=Depends(get_current_user),
):
    try:
        return await BuyerRequestService(db).responses_for(str(current_user.id), request_id)
    except SupplierError as error:
        raise to_http(error)
