"""supplier profiles, moderated like a listing

Revision ID: c4b2e8d5f019
Revises: b3d8e1f42a70
Create Date: 2026-09-02

One profile per user, so the user id is the primary key: a second profile for the same
supplier would be two shop windows telling a buyer different delivery times.
"""

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

revision: str = "c4b2e8d5f019"
down_revision: Union[str, Sequence[str], None] = "b3d8e1f42a70"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "supplier_profiles",
        sa.Column(
            "user_id",
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey("users.id", ondelete="CASCADE"),
            primary_key=True,
        ),
        sa.Column("company_name", sa.String(), nullable=True),
        sa.Column("countries", postgresql.JSONB(), nullable=True),
        sa.Column("brands", postgresql.JSONB(), nullable=True),
        sa.Column("delivery_days_min", sa.Integer(), nullable=True),
        sa.Column("delivery_days_max", sa.Integer(), nullable=True),
        sa.Column("terms", sa.Text(), nullable=True),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column("status", sa.String(), nullable=False, server_default="draft"),
        sa.Column("reject_reason", sa.Text(), nullable=True),
        sa.Column("submitted_at", sa.DateTime(), nullable=True),
        sa.Column("moderated_at", sa.DateTime(), nullable=True),
        sa.Column("created_at", sa.DateTime(), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(), server_default=sa.func.now()),
    )
    op.create_index("ix_supplier_profiles_status", "supplier_profiles", ["status"])


def downgrade() -> None:
    op.drop_index("ix_supplier_profiles_status", table_name="supplier_profiles")
    op.drop_table("supplier_profiles")
