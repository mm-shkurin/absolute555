"""The chat over HTTP, and the live channel beside it.

Every route answers only to a participant. A stranger is told the dialogue does not
exist, which is also what an unknown identifier gets — the two are indistinguishable on
purpose.
"""

from typing import List

from fastapi import APIRouter, Depends, Query, WebSocket, WebSocketDisconnect
from app.shared.http.paging import page_size as page_size_query
from app.features.chat.deps import get_chat_reader, get_chat_service
from app.features.review.deps import get_dialog_review_service

from app.features.chat.schemas.chat import (
    DialogResponse,
    MessagePage,
    MessageResponse,
    MessageWrite,
    ReadRequest,
    ReadResult,
    UnreadCount,
)
from app.features.chat.services.chat_errors import ChatError, DialogNotFound
from app.features.chat.services.chat_reader import ChatReader
from app.features.chat.services.chat_service import ChatService
from app.features.review.services.review_dialog import DialogReviewService
from app.shared.realtime.chat_socket import chat_hub, listener_of
from app.features.auth.deps import get_current_user

from app.features.chat.api.chat_view import dialog_view, message_view

chat_router = APIRouter()


@chat_router.get("/dialogs", response_model=List[DialogResponse])
async def list_dialogs(
    reader: ChatReader = Depends(get_chat_reader),
    dialog_review_service: DialogReviewService = Depends(get_dialog_review_service),
    current_user=Depends(get_current_user),
):
    dialogs = await reader.mine(str(current_user.id))
    last = await reader.last_messages(dialogs)
    unread = await reader.unread_by_dialog(dialogs, str(current_user.id))
    reviews = await dialog_review_service.by_dialog([dialog.dialog_id for dialog in dialogs])
    storefronts = await reader.storefronts(dialogs)
    return [
        dialog_view(
            dialog,
            current_user.id,
            unread.get(dialog.dialog_id, 0),
            last.get(dialog.dialog_id),
            reviews.get(str(dialog.dialog_id)),
            storefronts.get(str(dialog.seller_id)),
        )
        for dialog in dialogs
    ]


@chat_router.post("/dialogs/direct/{user_id}", response_model=DialogResponse)
async def open_direct(
    user_id: str,
    reader: ChatReader = Depends(get_chat_reader),
    chat_service: ChatService = Depends(get_chat_service),
    current_user=Depends(get_current_user),
):
    """Открыть или найти прямую переписку с человеком — со страницы поставщика."""
    try:
        opened = await chat_service.open_direct(current_user.id, user_id)
        dialog = await chat_service.dialog_of(str(opened.dialog_id), str(current_user.id))
    except (ChatError, ValueError) as refused:
        raise DialogNotFound(user_id) from refused
    storefronts = await reader.storefronts([dialog])
    return dialog_view(dialog, current_user.id, 0, storefront=storefronts.get(str(dialog.seller_id)))


@chat_router.get("/unread", response_model=UnreadCount)
async def unread_badge(
    reader: ChatReader = Depends(get_chat_reader),
    current_user=Depends(get_current_user),
):
    """One number, because the badge is drawn on every screen."""
    return {"unread": await reader.unread_total(str(current_user.id))}


@chat_router.get("/dialogs/{dialog_id}/messages", response_model=MessagePage)
async def read_messages(
    dialog_id: str,
    page: int = Query(default=1, ge=1),
    size: int = Depends(page_size_query(default=50, most=100)),
    reader: ChatReader = Depends(get_chat_reader),
    chat_service: ChatService = Depends(get_chat_service),
    current_user=Depends(get_current_user),
):
    dialog = await chat_service.dialog_of(dialog_id, str(current_user.id))

    messages, total = await reader.messages(dialog, page, size)
    return {
        "items": [message_view(message) for message in messages],
        "total": total,
        "page": page,
        "size": size,
    }


@chat_router.post("/dialogs/{dialog_id}/messages", response_model=MessageResponse, status_code=201)
async def write_message(
    dialog_id: str,
    body: MessageWrite,
    reader: ChatReader = Depends(get_chat_reader),
    chat_service: ChatService = Depends(get_chat_service),
    current_user=Depends(get_current_user),
):
    """The kind is not a field a client may set: a system line has no human author."""
    dialog = await chat_service.dialog_of(dialog_id, str(current_user.id))
    message = await chat_service.post(dialog, body.text, author_id=current_user.id)
    written = message_view(message)

    # Serialised through the schema before it goes down the socket: a WebSocket frame is
    # JSON text, and identifiers and timestamps are objects until something converts them.
    live = MessageResponse(**written).model_dump(mode="json")
    await chat_hub.deliver(
        [str(dialog.buyer_id), str(dialog.seller_id)], {"type": "message", "message": live}
    )
    return written


@chat_router.post("/dialogs/{dialog_id}/read", response_model=ReadResult)
async def mark_read(
    dialog_id: str,
    body: ReadRequest,
    reader: ChatReader = Depends(get_chat_reader),
    chat_service: ChatService = Depends(get_chat_service),
    current_user=Depends(get_current_user),
):
    dialog = await chat_service.dialog_of(dialog_id, str(current_user.id))

    marked = await chat_service.mark_read(dialog, str(current_user.id), body.message_ids)
    return {
        "marked": marked,
        "unread": await reader.unread_in(dialog, str(current_user.id)),
    }


@chat_router.websocket("/ws")
async def chat_socket(socket: WebSocket, token: str = Query(default="")):
    """The live channel, authenticated before it is accepted.

    A browser's WebSocket cannot send headers, so the token arrives as a parameter. A
    connection without a usable one is closed rather than accepted and left silent —
    silence is indistinguishable from "nothing has happened yet".
    """
    listener = await listener_of(token)
    if listener is None:
        await socket.close(code=4403)
        return

    await socket.accept()
    queue = chat_hub.join(listener)
    try:
        while True:
            await socket.send_json(await queue.get())
    except WebSocketDisconnect:
        pass
    finally:
        chat_hub.leave(listener, queue)
