"""indexes the feed filters on

Revision ID: e5c1a7d3f204
Revises: d4a9b2e60c31
Create Date: 2026-08-31

Every query the feed makes starts by narrowing to published listings, so status leads
each composite index rather than standing alone: an index on status by itself divides a
table where nearly every row is published, which is no division at all.

Make and model are one index in that order, not two: the screen selects a model only
after a make, so no query filters a model without one.
"""

from typing import Sequence, Union

from alembic import op

revision: str = "e5c1a7d3f204"
down_revision: Union[str, Sequence[str], None] = "d4a9b2e60c31"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_index("ix_sale_cars_feed_brand_model", "sale_cars", ["status", "brand_id", "model_id"])
    op.create_index("ix_sale_cars_feed_year", "sale_cars", ["status", "year"])
    op.create_index("ix_sale_cars_feed_price", "sale_cars", ["status", "price"])
    op.create_index("ix_sale_cars_feed_mileage", "sale_cars", ["status", "milleage"])
    # The default order of the feed. Without it the newest page is a sort of the whole
    # published set, which is the one query every visitor makes.
    op.create_index("ix_sale_cars_feed_published", "sale_cars", ["status", "published_at"])


def downgrade() -> None:
    for name in (
        "ix_sale_cars_feed_published",
        "ix_sale_cars_feed_mileage",
        "ix_sale_cars_feed_price",
        "ix_sale_cars_feed_year",
        "ix_sale_cars_feed_brand_model",
    ):
        op.drop_index(name, table_name="sale_cars")
