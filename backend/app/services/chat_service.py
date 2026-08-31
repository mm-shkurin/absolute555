"""Conversations: opening one, writing in it, and counting what is unread.

A dialogue is reached only by the two people in it. Everyone else is told it does not
exist rather than that it is forbidden — a refusal would confirm the conversation is
there, and with it that somebody is bargaining over that car.
"""

import uuid
from datetime import datetime
from typing import List, Optional, Tuple

from sqlalchemy import func, or_, select, update
from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models.chat import Dialog, Message, MessageKind
from app.models.sale_car import SaleCars
from app.services.chat_errors import DialogNotFound, EmptyMessage


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

    async def mine(self, user_id: str) -> List[Dialog]:
        person = uuid.UUID(str(user_id))
        found = await self.db.execute(
            select(Dialog)
            .options(
                selectinload(Dialog.listing).selectinload(SaleCars.brand),
                selectinload(Dialog.listing).selectinload(SaleCars.model),
                selectinload(Dialog.buyer),
                selectinload(Dialog.seller),
            )
            .where(or_(Dialog.buyer_id == person, Dialog.seller_id == person))
            .order_by(Dialog.last_message_at.desc())
        )
        return list(found.scalars().all())

    async def last_messages(self, dialogs: List[Dialog]) -> dict:
        """The newest message of each dialogue, in one query.

        Read off the relationship instead, this is a lazy load per row -- outside the
        greenlet the request runs in, which is an error rather than a slow page.
        """
        if not dialogs:
            return {}

        keys = [dialog.dialog_id for dialog in dialogs]
        newest = (
            select(Message.dialog_id, func.max(Message.created_at).label("at"))
            .where(Message.dialog_id.in_(keys))
            .group_by(Message.dialog_id)
            .subquery()
        )
        found = await self.db.execute(
            select(Message).join(
                newest,
                (Message.dialog_id == newest.c.dialog_id) & (Message.created_at == newest.c.at),
            )
        )
        return {message.dialog_id: message for message in found.scalars()}

    async def messages(self, dialog: Dialog, page: int, size: int) -> Tuple[List[Message], int]:
        counted = await self.db.execute(
            select(func.count()).select_from(
                select(Message).where(Message.dialog_id == dialog.dialog_id).subquery()
            )
        )
        found = await self.db.execute(
            select(Message)
            .where(Message.dialog_id == dialog.dialog_id)
            .order_by(Message.created_at.asc(), Message.message_id.asc())
            .offset((page - 1) * size)
            .limit(size)
        )
        return list(found.scalars().all()), counted.scalar_one()

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
                Message.read_at.is_(None),
                or_(Message.author_id.is_(None), Message.author_id != person),
            )
            .values(read_at=datetime.utcnow())
        )
        await self.db.commit()
        return marked.rowcount

    async def unread_in(self, dialog: Dialog, user_id: str) -> int:
        person = uuid.UUID(str(user_id))
        counted = await self.db.execute(
            select(func.count())
            .select_from(Message)
            .where(
                Message.dialog_id == dialog.dialog_id,
                Message.read_at.is_(None),
                or_(Message.author_id.is_(None), Message.author_id != person),
            )
        )
        return counted.scalar_one()

    async def unread_total(self, user_id: str) -> int:
        """One number for the badge, over every dialogue this person is in."""
        person = uuid.UUID(str(user_id))
        mine = select(Dialog.dialog_id).where(
            or_(Dialog.buyer_id == person, Dialog.seller_id == person)
        )
        counted = await self.db.execute(
            select(func.count())
            .select_from(Message)
            .where(
                Message.dialog_id.in_(mine),
                Message.read_at.is_(None),
                or_(Message.author_id.is_(None), Message.author_id != person),
            )
        )
        return counted.scalar_one()
