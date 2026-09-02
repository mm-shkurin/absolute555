"""dialogues and messages

Revision ID: b8d3c05e6119
Revises: a7f4e2b90c15
Create Date: 2026-08-31

The pair and the listing are unique together: a second offer on the same car has to land
in the same conversation, and two rows would split one negotiation into two screens with
half the history each.

No dialogue is created for offers made before this revision. A conversation invented
around an offer nobody ever discussed would show both sides a room they never entered.
"""

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

revision: str = "b8d3c05e6119"
down_revision: Union[str, Sequence[str], None] = "a7f4e2b90c15"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "dialogs",
        sa.Column("dialog_id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column(
            "sale_car_id",
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey("sale_cars.sale_car_id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column("buyer_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False),
        sa.Column("seller_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False),
        sa.Column("last_message_at", sa.DateTime(), server_default=sa.func.now(), nullable=False),
        sa.Column("created_at", sa.DateTime(), server_default=sa.func.now(), nullable=False),
        sa.UniqueConstraint("sale_car_id", "buyer_id", name="dialogs_one_per_pair_and_listing"),
    )
    op.create_index("ix_dialogs_buyer_id", "dialogs", ["buyer_id"])
    op.create_index("ix_dialogs_seller_id", "dialogs", ["seller_id"])
    op.create_index("ix_dialogs_last_message_at", "dialogs", ["last_message_at"])

    op.create_table(
        "messages",
        sa.Column("message_id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column(
            "dialog_id",
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey("dialogs.dialog_id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column("author_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("users.id", ondelete="SET NULL"), nullable=True),
        sa.Column("kind", sa.String(), nullable=False, server_default="text"),
        sa.Column("text", sa.Text(), nullable=False),
        sa.Column("read_at", sa.DateTime(), nullable=True),
        sa.Column("created_at", sa.DateTime(), server_default=sa.func.now(), nullable=False),
    )
    op.create_index("ix_messages_dialog_id", "messages", ["dialog_id"])
    # The unread badge asks for exactly this: messages of a dialogue somebody else wrote
    # that carry no read mark.
    op.create_index("ix_messages_unread", "messages", ["dialog_id", "author_id", "read_at"])


def downgrade() -> None:
    op.drop_index("ix_messages_unread", table_name="messages")
    op.drop_index("ix_messages_dialog_id", table_name="messages")
    op.drop_table("messages")
    op.drop_index("ix_dialogs_last_message_at", table_name="dialogs")
    op.drop_index("ix_dialogs_seller_id", table_name="dialogs")
    op.drop_index("ix_dialogs_buyer_id", table_name="dialogs")
    op.drop_table("dialogs")
