"""Правка опубликованной витрины поставщика уходит на проверку черновиком

Revision ID: c4f2a8e5d913
Revises: b3e9f1a6c2d7
"""

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

revision: str = "c4f2a8e5d913"
down_revision: Union[str, Sequence[str], None] = "b3e9f1a6c2d7"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column(
        "supplier_profiles", sa.Column("pending_changes", postgresql.JSONB(), nullable=True)
    )
    op.add_column("supplier_profiles", sa.Column("revision_status", sa.String(), nullable=True))
    op.create_index("ix_supplier_profiles_revision_status", "supplier_profiles", ["revision_status"])


def downgrade() -> None:
    op.drop_index("ix_supplier_profiles_revision_status", table_name="supplier_profiles")
    op.drop_column("supplier_profiles", "revision_status")
    op.drop_column("supplier_profiles", "pending_changes")
