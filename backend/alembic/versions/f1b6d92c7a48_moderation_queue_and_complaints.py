"""complaints, rejection labels, and the two moments the queue is ordered by

Revision ID: f1b6d92c7a48
Revises: e5c1a7d3f204
Create Date: 2026-08-31

The unique constraint on (listing, person) is the rule itself, not a safeguard behind
one: two workers both reading "has this person complained?" see no at the same moment,
and the count a moderator reads stops meaning "this many people".

Listings rejected before labels existed keep their written reason and get no label. A
backfilled guess would be a moderator's decision invented by a migration.
"""

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

revision: str = "f1b6d92c7a48"
down_revision: Union[str, Sequence[str], None] = "e5c1a7d3f204"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column("sale_cars", sa.Column("reject_label", sa.String(), nullable=True))
    op.add_column("sale_cars", sa.Column("submitted_at", sa.DateTime(), nullable=True))
    op.add_column("sale_cars", sa.Column("moderated_at", sa.DateTime(), nullable=True))
    op.add_column(
        "sale_cars",
        sa.Column("moderated_by", postgresql.UUID(as_uuid=True), sa.ForeignKey("users.id", ondelete="SET NULL"), nullable=True),
    )
    op.create_index("ix_sale_cars_queue", "sale_cars", ["status", "submitted_at"])

    op.create_table(
        "complaints",
        sa.Column("complaint_id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column(
            "sale_car_id",
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey("sale_cars.sale_car_id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column("user_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False),
        sa.Column("reason", sa.String(), nullable=False),
        sa.Column("text", sa.Text(), nullable=True),
        sa.Column("status", sa.String(), nullable=False, server_default="open"),
        sa.Column("handled_at", sa.DateTime(), nullable=True),
        sa.Column("handled_by", postgresql.UUID(as_uuid=True), sa.ForeignKey("users.id", ondelete="SET NULL"), nullable=True),
        sa.Column("created_at", sa.DateTime(), server_default=sa.func.now(), nullable=False),
        sa.UniqueConstraint("sale_car_id", "user_id", name="complaints_one_per_person_per_listing"),
    )
    op.create_index("ix_complaints_sale_car_id", "complaints", ["sale_car_id"])
    op.create_index("ix_complaints_status", "complaints", ["status"])


def downgrade() -> None:
    op.drop_index("ix_complaints_status", table_name="complaints")
    op.drop_index("ix_complaints_sale_car_id", table_name="complaints")
    op.drop_table("complaints")
    op.drop_index("ix_sale_cars_queue", table_name="sale_cars")
    op.drop_column("sale_cars", "moderated_by")
    op.drop_column("sale_cars", "moderated_at")
    op.drop_column("sale_cars", "submitted_at")
    op.drop_column("sale_cars", "reject_label")
