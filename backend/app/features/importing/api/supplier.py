"""Профиль поставщика, по HTTP: свой профиль, публичная страница, очередь модератора."""

from fastapi import APIRouter, Depends, File, Query, UploadFile
from app.shared.http.paging import page_size as page_size_query
from app.features.importing.deps import get_supplier_cover_service
from app.features.importing.deps import get_supplier_profile_service

from app.core.exceptions import ValidationError
from app.features.importing.schemas.supplier import (
    SupplierOwnProfileResponse,
    SupplierPage,
    SupplierProfileResponse,
    SupplierProfileUpdate,
    SupplierQueue,
    SupplierRejection,
)
from app.features.importing.services.supplier_cover import SupplierCoverService
from app.features.importing.services.supplier_service import SupplierProfileService
from app.features.listing.api.image_upload import image_upload
from app.features.listing.services.photo_image import read_limited
from app.permissions.dependencies import require_permission
from app.permissions.permissions import Permission


supplier_router = APIRouter()

IMPORTER = require_permission(Permission.MANAGE_SUPPLIER_PROFILE)
MODERATOR = require_permission(Permission.EDIT_ANY_SALE_CAR)


@supplier_router.get("/me", response_model=SupplierOwnProfileResponse)
async def read_my_profile(supplier_profile_service: SupplierProfileService = Depends(get_supplier_profile_service), importer=Depends(IMPORTER)):
    return await supplier_profile_service.mine(str(importer.id))


@supplier_router.put("/me", response_model=SupplierOwnProfileResponse)
async def edit_my_profile(
    update: SupplierProfileUpdate,
    supplier_profile_service: SupplierProfileService = Depends(get_supplier_profile_service),
    importer=Depends(IMPORTER),
):
    fields = update.model_dump(exclude_unset=True)
    if not fields:
        raise ValidationError("No data to update", code="EMPTY_PATCH")
    return await supplier_profile_service.edit(str(importer.id), fields)


@supplier_router.post("/me/submit", response_model=SupplierOwnProfileResponse)
async def submit_my_profile(supplier_profile_service: SupplierProfileService = Depends(get_supplier_profile_service), importer=Depends(IMPORTER)):
    return await supplier_profile_service.submit(str(importer.id))


@supplier_router.put("/me/cover", response_model=SupplierOwnProfileResponse)
async def upload_cover(
    file: UploadFile = File(...),
    supplier_cover_service: SupplierCoverService = Depends(get_supplier_cover_service),
    importer=Depends(IMPORTER),
):
    with image_upload("cover"):
        return await supplier_cover_service.set(str(importer.id), await read_limited(file))


@supplier_router.delete("/me/cover", response_model=SupplierOwnProfileResponse)
async def drop_cover(supplier_cover_service: SupplierCoverService = Depends(get_supplier_cover_service), importer=Depends(IMPORTER)):
    return await supplier_cover_service.drop(str(importer.id))


@supplier_router.get("", response_model=SupplierPage)
async def list_storefronts(
    page: int = Query(default=1, ge=1),
    size: int = Depends(page_size_query()),
    supplier_profile_service: SupplierProfileService = Depends(get_supplier_profile_service),
):
    """Витрины одобренных поставщиков. Открыты всем, включая гостя.

    Витрина и есть публичная страница: прятать её от того, кто выбирает, кому доверить
    привоз, значит прятать сам выбор. Стоит выше `/{user_id}`, иначе пустой путь ушёл бы
    в него параметром.
    """
    found, total = await supplier_profile_service.storefronts(page, size)
    return {"items": found, "total": total, "page": page, "size": size}


@supplier_router.get("/{user_id}", response_model=SupplierProfileResponse)
async def read_public_profile(user_id: str, supplier_profile_service: SupplierProfileService = Depends(get_supplier_profile_service)):
    """Публичная витрина: гость читает опубликованный профиль, остальные — 404."""
    return await supplier_profile_service.published(user_id)


moderation_supplier_router = APIRouter()


@moderation_supplier_router.get("/suppliers", response_model=SupplierQueue)
async def read_queue(supplier_profile_service: SupplierProfileService = Depends(get_supplier_profile_service), moderator=Depends(MODERATOR)):
    waiting = await supplier_profile_service.queue()
    return {"items": waiting, "total": len(waiting)}


@moderation_supplier_router.post(
    "/suppliers/{user_id}/approve", response_model=SupplierOwnProfileResponse
)
async def approve(user_id: str, supplier_profile_service: SupplierProfileService = Depends(get_supplier_profile_service), moderator=Depends(MODERATOR)):
    return await supplier_profile_service.approve(user_id)


@moderation_supplier_router.post(
    "/suppliers/{user_id}/reject", response_model=SupplierOwnProfileResponse
)
async def reject(
    user_id: str,
    rejection: SupplierRejection,
    supplier_profile_service: SupplierProfileService = Depends(get_supplier_profile_service),
    moderator=Depends(MODERATOR),
):
    return await supplier_profile_service.reject(user_id, rejection.reason)
