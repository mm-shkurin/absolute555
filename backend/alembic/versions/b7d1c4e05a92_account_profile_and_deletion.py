"""account profile and deletion

Revision ID: b7d1c4e05a92
Revises: a9c2f7b41e08
Create Date: 2026-09-03

"""
from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = "b7d1c4e05a92"
down_revision: Union[str, Sequence[str], None] = "a9c2f7b41e08"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column("users", sa.Column("profile_name", sa.String(length=60), nullable=True))
    op.add_column("users", sa.Column("avatar_key", sa.String(), nullable=True))
    op.add_column("users", sa.Column("deleted_at", sa.DateTime(), nullable=True))


def downgrade() -> None:
    op.drop_column("users", "deleted_at")
    op.drop_column("users", "avatar_key")
    op.drop_column("users", "profile_name")
