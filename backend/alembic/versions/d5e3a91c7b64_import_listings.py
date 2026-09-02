"""listings brought in to order, in the same table

Revision ID: d5e3a91c7b64
Revises: c4b2e8d5f019
Create Date: 2026-09-02

The channel is a column rather than a second table: a buyer searches for a car, not for a
supply channel, and a separate table would have duplicated the feed, moderation, offers
and the chat around them.

Listings that existed before this revision are cars in stock — that is the only kind that
could be published until now.
"""

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = "d5e3a91c7b64"
down_revision: Union[str, Sequence[str], None] = "c4b2e8d5f019"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column(
        "sale_cars",
        sa.Column("listing_kind", sa.String(), nullable=False, server_default="stock"),
    )
    op.add_column("sale_cars", sa.Column("import_country", sa.String(), nullable=True))
    op.add_column("sale_cars", sa.Column("delivery_days", sa.Integer(), nullable=True))
    op.add_column("sale_cars", sa.Column("turnkey_price", sa.Float(), nullable=True))
    op.create_index("ix_sale_cars_listing_kind", "sale_cars", ["listing_kind"])


def downgrade() -> None:
    op.drop_index("ix_sale_cars_listing_kind", table_name="sale_cars")
    op.drop_column("sale_cars", "turnkey_price")
    op.drop_column("sale_cars", "delivery_days")
    op.drop_column("sale_cars", "import_country")
    op.drop_column("sale_cars", "listing_kind")
