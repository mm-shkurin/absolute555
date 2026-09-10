"""Прямая переписка: написать поставщику без объявления и заявки

Revision ID: d8b1e7c3a520
Revises: c4f2a8e5d913
"""

from typing import Sequence, Union

from alembic import op

revision: str = "d8b1e7c3a520"
down_revision: Union[str, Sequence[str], None] = "c4f2a8e5d913"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Одна прямая переписка на пару: второй «Написать» должен вернуть в тот же разговор.
    # Частичный индекс, потому что у переписки по объявлению и по заявке своя уникальность.
    op.execute(
        "CREATE UNIQUE INDEX dialogs_one_direct_per_pair ON dialogs (buyer_id, seller_id) "
        "WHERE sale_car_id IS NULL AND request_id IS NULL"
    )


def downgrade() -> None:
    op.execute("DROP INDEX IF EXISTS dialogs_one_direct_per_pair")
