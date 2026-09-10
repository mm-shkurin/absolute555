"""Диалог по заявке: отклик поставщика заводит переписку

Revision ID: a7d2c4e91f03
Revises: c3f8a1d7e920
"""

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = "a7d2c4e91f03"
down_revision: Union[str, Sequence[str], None] = "c3f8a1d7e920"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Заявка — спрос без машины, поэтому объявление у такого диалога отсутствует, а не
    # подставляется пустым: колонка становится необязательной.
    op.alter_column("dialogs", "sale_car_id", existing_type=sa.dialects.postgresql.UUID(), nullable=True)
    op.add_column(
        "dialogs",
        sa.Column(
            "request_id",
            sa.dialects.postgresql.UUID(as_uuid=True),
            sa.ForeignKey("buyer_requests.request_id", ondelete="CASCADE"),
            nullable=True,
        ),
    )
    op.create_index("ix_dialogs_request_id", "dialogs", ["request_id"])
    # Один разговор на пару «заявка и поставщик»: повторный отклик правит первый и
    # должен попадать в ту же переписку.
    op.create_unique_constraint(
        "dialogs_one_per_request_and_supplier", "dialogs", ["request_id", "seller_id"]
    )


def downgrade() -> None:
    op.drop_constraint("dialogs_one_per_request_and_supplier", "dialogs", type_="unique")
    op.drop_index("ix_dialogs_request_id", table_name="dialogs")
    op.drop_column("dialogs", "request_id")
    op.execute("DELETE FROM dialogs WHERE sale_car_id IS NULL")
    op.alter_column("dialogs", "sale_car_id", existing_type=sa.dialects.postgresql.UUID(), nullable=False)
