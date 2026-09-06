"""listing visibility settings

Revision ID: c3f8a1d7e920
Revises: b1e7a45c9d30
Create Date: 2026-09-06

"""
from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = "c3f8a1d7e920"
down_revision: Union[str, Sequence[str], None] = "b1e7a45c9d30"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Телефон и чат открыты по умолчанию: объявление заводят, чтобы по нему написали, и
    # закрытый канал связи на новом объявлении означал бы, что продавец про него забыл.
    op.add_column(
        "sale_cars",
        sa.Column("phone_visible", sa.Boolean(), nullable=False, server_default=sa.true()),
    )
    op.add_column(
        "sale_cars",
        sa.Column("chat_allowed", sa.Boolean(), nullable=False, server_default=sa.true()),
    )
    # Лента предложений закрыта: до этой правки чужие предложения видел только владелец,
    # и включённая настройка открыла бы задним числом торг по всем живым объявлениям.
    op.add_column(
        "sale_cars",
        sa.Column("offers_visible", sa.Boolean(), nullable=False, server_default=sa.false()),
    )


def downgrade() -> None:
    op.drop_column("sale_cars", "offers_visible")
    op.drop_column("sale_cars", "chat_allowed")
    op.drop_column("sale_cars", "phone_visible")
