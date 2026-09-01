"""Conversations: opening one, writing in it, and settling what has been read.

A dialogue is reached only by the two people in it. Everyone else is told it does not
exist rather than that it is forbidden — a refusal would confirm the conversation is
there, and with it that somebody is bargaining over that car.

Reading for the screens — the list, the messages, the counts — is `chat_reader.py`.
Split when this file passed the 200-line limit, along the line that was already there:
one side changes conversations, the other only asks about them.
"""

import uuid
from datetime import datetime
from typing import List

from sqlalchemy import or_, select, update
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.features.chat.models.chat import Dialog, Message, MessageKind
from app.features.listing.models.sale_car import SaleCars
from app.features.chat.services.chat_errors import DialogNotFound, EmptyMessage
from app.features.chat.services.chat_reader import unread_for


class ChatService:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def open_for_offer(self, listing: SaleCars, buyer_id) -> Dialog:
        """The conversation an offer starts, or the one it joins.

        A second offer on the same car belongs in the same room: two rows would split one
        negotiation into two screens with half the history each.
        """
        buyer = uuid.UUID(str(buyer_id))
        found = await self.db.execute(
            select(Dialog).where(
                Dialog.sale_car_id == listing.sale_car_id, Dialog.buyer_id == buyer
            )
        )
        dialog = found.scalar_one_or_none()
        if dialog is not None:
            return dialog

        dialog = Dialog(
            sale_car_id=listing.sale_car_id, buyer_id=buyer, seller_id=listing.user_id
        )
        self.db.add(dialog)
        await self.db.flush()
        return dialog

    async def say(self, dialog: Dialog, text: str, author_id=None, kind: str = MessageKind.TEXT.value) -> Message:
        body = (text or "").strip()
        if not body:
            raise EmptyMessage()

        message = Message(
            dialog_id=dialog.dialog_id,
            author_id=uuid.UUID(str(author_id)) if author_id else None,
            kind=kind,
            text=body,
        )
        self.db.add(message)
        dialog.last_message_at = datetime.utcnow()
        await self.db.flush()
        return message

    async def dialog_of(self, dialog_id: str, user_id: str) -> Dialog:
        try:
            key = uuid.UUID(dialog_id)
        except ValueError:
            raise DialogNotFound(dialog_id)

        person = uuid.UUID(str(user_id))
        found = await self.db.execute(
            select(Dialog)
            .options(
                selectinload(Dialog.listing).selectinload(SaleCars.brand),
                selectinload(Dialog.listing).selectinload(SaleCars.model),
                selectinload(Dialog.buyer),
                selectinload(Dialog.seller),
            )
            .where(
                Dialog.dialog_id == key,
                or_(Dialog.buyer_id == person, Dialog.seller_id == person),
            )
        )
        dialog = found.scalar_one_or_none()
        if dialog is None:
            raise DialogNotFound(dialog_id)
        return dialog

    async def mark_read(self, dialog: Dialog, user_id: str, message_ids: List[str]) -> int:
        """Mark the named messages read, if they were written to this person.

        Only the other side's unread messages move: marking your own read means nothing,
        and a second marking must not move the moment the first one recorded.
        """
        person = uuid.UUID(str(user_id))
        try:
            keys = [uuid.UUID(str(one)) for one in message_ids]
        except ValueError:
            return 0

        marked = await self.db.execute(
            update(Message)
            .where(
                Message.message_id.in_(keys),
                Message.dialog_id == dialog.dialog_id,
                *unread_for(person),
            )
            .values(read_at=datetime.utcnow())
        )
        await self.db.commit()
        return marked.rowcount
