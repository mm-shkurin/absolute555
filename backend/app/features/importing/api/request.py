"""Заявки покупателя и отклики поставщиков, по HTTP."""

from typing import List

from fastapi import APIRouter, Depends, Query, status
from app.shared.http.paging import page_size as page_size_query
from app.features.importing.services.request_service import BuyerRequestService

from app.features.importing.deps import get_buyer_request_service
from app.features.importing.schemas.request import (
    BuyerRequestCreate,
    BuyerRequestPage,
    BuyerRequestResponse,
    SupplierResponseCreate,
    SupplierResponseView,
)
from app.features.chat.api.chat_view import message_view
from app.features.chat.schemas.chat import MessageResponse
from app.permissions.dependencies import require_permission
from app.permissions.permissions import Permission
from app.shared.realtime.chat_socket import chat_hub
from app.features.auth.deps import get_current_user

from .request_view import request_view, request_views

request_router = APIRouter()

IMPORTER = require_permission(Permission.MANAGE_SUPPLIER_PROFILE)


@request_router.post("", response_model=BuyerRequestResponse, status_code=status.HTTP_201_CREATED)
async def open_request(
    body: BuyerRequestCreate,
    buyer_request_service: BuyerRequestService = Depends(get_buyer_request_service),
    current_user=Depends(get_current_user),
):
    opened = await buyer_request_service.open(
        str(current_user.id), body.model_dump(exclude_unset=True)
    )
    return request_view(opened)


@request_router.get("/my", response_model=List[BuyerRequestResponse])
async def read_my_requests(
    buyer_request_service: BuyerRequestService = Depends(get_buyer_request_service), current_user=Depends(get_current_user)
):
    return request_views(await buyer_request_service.mine(str(current_user.id)))


@request_router.get("", response_model=BuyerRequestPage)
async def read_open_requests(
    page: int = Query(default=1, ge=1),
    size: int = Depends(page_size_query()),
    buyer_request_service: BuyerRequestService = Depends(get_buyer_request_service),
    importer=Depends(IMPORTER),
):
    """Лента спроса. Открыта поставщику: покупателю она сказала бы, с кем он в очереди."""
    found, total = await buyer_request_service.open_ones(page, size)
    return {"items": request_views(found), "total": total, "page": page, "size": size}


@request_router.post("/{request_id}/close", response_model=BuyerRequestResponse)
async def close_request(
    request_id: str,
    buyer_request_service: BuyerRequestService = Depends(get_buyer_request_service),
    current_user=Depends(get_current_user),
):
    closed = await buyer_request_service.close(str(current_user.id), request_id)
    return request_view(closed)


@request_router.put("/{request_id}/response", response_model=SupplierResponseView)
async def respond(
    request_id: str,
    body: SupplierResponseCreate,
    buyer_request_service: BuyerRequestService = Depends(get_buyer_request_service),
    importer=Depends(IMPORTER),
):
    """Идемпотентно: один отклик на поставщика, повторный вызов правит свой."""
    answered, dialog, said = await buyer_request_service.respond(
        str(importer.id), request_id, body.model_dump()
    )

    # Автор заявки читает отклик в переписке, а не в списке заявок: если он смотрит на
    # чаты прямо сейчас, строка должна прийти без перезагрузки.
    live = MessageResponse(**message_view(said)).model_dump(mode="json")
    await chat_hub.deliver(
        [str(dialog.buyer_id), str(dialog.seller_id)], {"type": "message", "message": live}
    )
    return {**SupplierResponseView.model_validate(answered).model_dump(), "dialog_id": dialog.dialog_id}


@request_router.get("/{request_id}/responses", response_model=List[SupplierResponseView])
async def read_responses(
    request_id: str,
    buyer_request_service: BuyerRequestService = Depends(get_buyer_request_service),
    current_user=Depends(get_current_user),
):
    return await buyer_request_service.responses_for(str(current_user.id), request_id)
