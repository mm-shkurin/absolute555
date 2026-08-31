"""The chat over HTTP, and the live channel beside it.

Every route answers only to a participant. A stranger is told the dialogue does not
exist, which is also what an unknown identifier gets — the two are indistinguishable on
purpose.
"""

from typing import List

from fastapi import APIRouter, Depends, Query, WebSocket, WebSocketDisconnect
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.database import get_db
from app.schemas.chat import (
    DialogResponse,
    MessagePage,
    MessageResponse,
    MessageWrite,
    ReadRequest,
    ReadResult,
    UnreadCount,
)
from app.services.chat_errors import ChatError
from app.services.chat_service import ChatService
from app.sse.chat_socket import chat_hub, listener_of
from app.utils.security import get_current_user

from .chat_http import to_http
from .chat_view import dialog_view, message_view

chat_router = APIRouter()


@chat_router.get("/dialogs", response_model=List[DialogResponse])
async def list_dialogs(
    db: AsyncSession = Depends(get_db),
    current_user=Depends(get_current_user),
):
    service = ChatService(db)
    dialogs = await service.mine(str(current_user.id))
    last = await service.last_messages(dialogs)
    return [
        dialog_view(
            dialog,
            current_user.id,
            await service.unread_in(dialog, str(current_user.id)),
            last.get(dialog.dialog_id),
        )
        for dialog in dialogs
    ]


@chat_router.get("/unread", response_model=UnreadCount)
async def unread_badge(
    db: AsyncSession = Depends(get_db),
    current_user=Depends(get_current_user),
):
    """One number, because the badge is drawn on every screen."""
    return {"unread": await ChatService(db).unread_total(str(current_user.id))}


@chat_router.get("/dialogs/{dialog_id}/messages", response_model=MessagePage)
async def read_messages(
    dialog_id: str,
    page: int = Query(default=1, ge=1),
    size: int = Query(default=50, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
    current_user=Depends(get_current_user),
):
    service = ChatService(db)
    try:
        dialog = await service.dialog_of(dialog_id, str(current_user.id))
    except ChatError as error:
        raise to_http(error)

    messages, total = await service.messages(dialog, page, size)
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
    db: AsyncSession = Depends(get_db),
    current_user=Depends(get_current_user),
):
    """The kind is not a field a client may set: a system line has no human author."""
    service = ChatService(db)
    try:
        dialog = await service.dialog_of(dialog_id, str(current_user.id))
        message = await service.say(dialog, body.text, author_id=current_user.id)
    except ChatError as error:
        raise to_http(error)

    await db.commit()
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
    db: AsyncSession = Depends(get_db),
    current_user=Depends(get_current_user),
):
    service = ChatService(db)
    try:
        dialog = await service.dialog_of(dialog_id, str(current_user.id))
    except ChatError as error:
        raise to_http(error)

    marked = await service.mark_read(dialog, str(current_user.id), body.message_ids)
    return {"marked": marked, "unread": await service.unread_in(dialog, str(current_user.id))}


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
