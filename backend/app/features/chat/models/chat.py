"""A conversation about one listing, between one buyer and one seller.

The pair and the listing identify it, held by a unique constraint: a second offer on the
same car must land in the same conversation, and two rows would split one negotiation
into two screens with half the history each.
"""

import uuid
from enum import Enum as PyEnum

from sqlalchemy import Column, DateTime, ForeignKey, String, Text, UniqueConstraint, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship

from app.db.database import Base


class MessageKind(str, PyEnum):
    TEXT = "text"
    SYSTEM = "system"


class Dialog(Base):
    __tablename__ = "dialogs"
    __table_args__ = (
        UniqueConstraint("sale_car_id", "buyer_id", name="dialogs_one_per_pair_and_listing"),
    )

    dialog_id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    sale_car_id = Column(
        UUID(as_uuid=True),
        ForeignKey("sale_cars.sale_car_id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    buyer_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)

    # Denormalised from the listing so that "my dialogues" is one query rather than a
    # join per row -- and so that a listing changing hands would not silently move the
    # conversation to somebody who never had it.
    seller_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)

    # Moved by every message, so the list can be ordered by what was last said without
    # reading the messages themselves.
    last_message_at = Column(DateTime, server_default=func.now(), nullable=False, index=True)
    created_at = Column(DateTime, server_default=func.now(), nullable=False)

    listing = relationship("SaleCars")
    buyer = relationship("Users", foreign_keys=[buyer_id])
    seller = relationship("Users", foreign_keys=[seller_id])
    messages = relationship("Message", back_populates="dialog", cascade="all, delete-orphan")


class Message(Base):
    __tablename__ = "messages"

    message_id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    dialog_id = Column(
        UUID(as_uuid=True), ForeignKey("dialogs.dialog_id", ondelete="CASCADE"), nullable=False, index=True
    )

    # Null for a system line: nobody wrote it, the server did. A client that could set
    # this could sign "the offer was accepted" as the seller.
    author_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    kind = Column(String, default=MessageKind.TEXT.value, nullable=False)
    text = Column(Text, nullable=False)

    # Per message rather than a high-water mark on the dialogue: the screen has no ticks
    # today, but the decision at interview was per message, and a mark cannot be
    # reconstructed from a pointer once it is lost.
    read_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, server_default=func.now(), nullable=False, index=True)

    dialog = relationship("Dialog", back_populates="messages")
    author = relationship("Users", foreign_keys=[author_id])
