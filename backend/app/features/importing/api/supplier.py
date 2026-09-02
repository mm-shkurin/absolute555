"""Профиль поставщика, по HTTP: свой профиль, публичная страница, очередь модератора."""

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.exceptions import ValidationError
from app.db.database import get_db
from app.features.importing.schemas.supplier import (
    SupplierProfileResponse,
    SupplierProfileUpdate,
    SupplierQueue,
    SupplierRejection,
)
from app.features.importing.services.supplier_errors import SupplierError
from app.features.importing.services.supplier_service import SupplierProfileService
from app.permissions.dependencies import require_permission
from app.permissions.permissions import Permission

from .supplier_http import to_http

supplier_router = APIRouter()

IMPORTER = require_permission(Permission.MANAGE_SUPPLIER_PROFILE)
MODERATOR = require_permission(Permission.EDIT_ANY_SALE_CAR)


@supplier_router.get("/me", response_model=SupplierProfileResponse)
async def read_my_profile(db: AsyncSession = Depends(get_db), importer=Depends(IMPORTER)):
    return await SupplierProfileService(db).mine(str(importer.id))


@supplier_router.put("/me", response_model=SupplierProfileResponse)
async def edit_my_profile(
    update: SupplierProfileUpdate,
    db: AsyncSession = Depends(get_db),
    importer=Depends(IMPORTER),
):
    fields = update.model_dump(exclude_unset=True)
    if not fields:
        raise ValidationError("No data to update", code="EMPTY_PATCH")
    try:
        return await SupplierProfileService(db).edit(str(importer.id), fields)
    except SupplierError as error:
        raise to_http(error)


@supplier_router.post("/me/submit", response_model=SupplierProfileResponse)
async def submit_my_profile(db: AsyncSession = Depends(get_db), importer=Depends(IMPORTER)):
    try:
        return await SupplierProfileService(db).submit(str(importer.id))
    except SupplierError as error:
        raise to_http(error)


@supplier_router.get("/{user_id}", response_model=SupplierProfileResponse)
async def read_public_profile(user_id: str, db: AsyncSession = Depends(get_db)):
    """Публичная витрина: гость читает опубликованный профиль, остальные — 404."""
    try:
        return await SupplierProfileService(db).published(user_id)
    except SupplierError as error:
        raise to_http(error)


moderation_supplier_router = APIRouter()


@moderation_supplier_router.get("/suppliers", response_model=SupplierQueue)
async def read_queue(db: AsyncSession = Depends(get_db), moderator=Depends(MODERATOR)):
    waiting = await SupplierProfileService(db).queue()
    return {"items": waiting, "total": len(waiting)}


@moderation_supplier_router.post(
    "/suppliers/{user_id}/approve", response_model=SupplierProfileResponse
)
async def approve(user_id: str, db: AsyncSession = Depends(get_db), moderator=Depends(MODERATOR)):
    try:
        return await SupplierProfileService(db).approve(user_id)
    except SupplierError as error:
        raise to_http(error)


@moderation_supplier_router.post(
    "/suppliers/{user_id}/reject", response_model=SupplierProfileResponse
)
async def reject(
    user_id: str,
    rejection: SupplierRejection,
    db: AsyncSession = Depends(get_db),
    moderator=Depends(MODERATOR),
):
    try:
        return await SupplierProfileService(db).reject(user_id, rejection.reason)
    except SupplierError as error:
        raise to_http(error)
