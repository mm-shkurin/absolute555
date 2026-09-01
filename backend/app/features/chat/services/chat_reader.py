"""Reading conversations for the screens: the list, the messages, the counts.

Split from `chat_service` when that file passed the 200-line limit, along the line
already in it: that one changes conversations, this one only asks about them.

Every count here asks the same question — messages this person has not read and did not
write — and asks it in one query per screen rather than one per row. Twenty conversations
should not be twenty round trips of the same question.
"""

import uuid
from typing import List, Tuple

from sqlalchemy import func, or_, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.features.chat.models.chat import Dialog, Message
from app.features.listing.models.sale_car import SaleCars

WITH_LISTING_AND_PEOPLE = (
    selectinload(Dialog.listing).selectinload(SaleCars.brand),
    selectinload(Dialog.listing).selectinload(SaleCars.model),
    selectinload(Dialog.buyer),
    selectinload(Dialog.seller),
)


def unread_for(person) -> tuple:
    """Messages this person has not read, and did not write themselves.

    Stated once because three counts asked it three ways: a badge that disagrees with the
    dialogue it is drawn on is worse than no badge. A system line has no author and is
    therefore unread for both sides until each of them opens the conversation.
    """
    return (
        Message.read_at.is_(None),
        or_(Message.author_id.is_(None), Message.author_id != person),
    )


class ChatReader:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def mine(self, user_id: str) -> List[Dialog]:
        person = uuid.UUID(str(user_id))
        found = await self.db.execute(
            select(Dialog)
            .options(*WITH_LISTING_AND_PEOPLE)
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
    async def unread_by_dialog(self, dialogs: List[Dialog], user_id: str) -> dict:
        """Unread counts for a whole list, in one query.

        Asked per row instead, a screen of twenty conversations is twenty round trips of
        the same question -- the shape moderation already avoids for complaints.
        """
        if not dialogs:
            return {}

        person = uuid.UUID(str(user_id))
        found = await self.db.execute(
            select(Message.dialog_id, func.count())
            .where(
                Message.dialog_id.in_([dialog.dialog_id for dialog in dialogs]),
                *unread_for(person),
            )
            .group_by(Message.dialog_id)
        )
        return {row[0]: row[1] for row in found}
    async def unread_in(self, dialog: Dialog, user_id: str) -> int:
        person = uuid.UUID(str(user_id))
        counted = await self.db.execute(
            select(func.count())
            .select_from(Message)
            .where(Message.dialog_id == dialog.dialog_id, *unread_for(person))
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
            .where(Message.dialog_id.in_(mine), *unread_for(person))
        )
        return counted.scalar_one()

