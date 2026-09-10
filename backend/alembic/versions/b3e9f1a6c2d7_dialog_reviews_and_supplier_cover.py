"""Отзыв по переписке и обложка витрины поставщика

Revision ID: b3e9f1a6c2d7
Revises: a7d2c4e91f03
"""

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

revision: str = "b3e9f1a6c2d7"
down_revision: Union[str, Sequence[str], None] = "a7d2c4e91f03"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Право на отзыв даёт переписка, а не только принятое предложение: сделки на площадке
    # чаще договариваются в чате и закрываются вне её.
    op.alter_column("reviews", "offer_id", existing_type=postgresql.UUID(), nullable=True)
    op.add_column(
        "reviews",
        sa.Column(
            "dialog_id",
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey("dialogs.dialog_id", ondelete="CASCADE"),
            nullable=True,
        ),
    )
    op.create_unique_constraint("reviews_one_per_dialog", "reviews", ["dialog_id"])
    op.add_column("supplier_profiles", sa.Column("cover_key", sa.String(), nullable=True))


def downgrade() -> None:
    op.drop_column("supplier_profiles", "cover_key")
    op.drop_constraint("reviews_one_per_dialog", "reviews", type_="unique")
    op.drop_column("reviews", "dialog_id")
    op.execute("DELETE FROM reviews WHERE offer_id IS NULL")
    op.alter_column("reviews", "offer_id", existing_type=postgresql.UUID(), nullable=False)
