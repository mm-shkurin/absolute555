"""seller reviews and the aggregate they feed

Revision ID: c9a1e4f70d22
Revises: b8d3c05e6119
Create Date: 2026-08-31

One review per offer, held by a unique constraint rather than by a check in the service:
two concurrent writes would both pass a check and leave one deal rated twice.

The number of deals is backfilled from the offers already accepted before this revision —
those sales happened, and a profile that showed none of them would be wrong on its first
day. The rating is not backfilled: no review existed to average.
"""

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

revision: str = "c9a1e4f70d22"
down_revision: Union[str, Sequence[str], None] = "b8d3c05e6119"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "reviews",
        sa.Column("review_id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column(
            "offer_id",
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey("offers.offer_id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column(
            "seller_id",
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey("users.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column(
            "author_id",
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey("users.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column("rating", sa.Integer(), nullable=False),
        sa.Column("text", sa.Text(), nullable=True),
        sa.Column("created_at", sa.DateTime(), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(), server_default=sa.func.now(), nullable=True),
        sa.UniqueConstraint("offer_id", name="reviews_one_per_offer"),
        sa.CheckConstraint("rating BETWEEN 1 AND 5", name="reviews_rating_within_range"),
    )
    op.create_index("ix_reviews_seller_id", "reviews", ["seller_id"])
    op.create_index("ix_reviews_author_id", "reviews", ["author_id"])
    op.create_index("ix_reviews_created_at", "reviews", ["created_at"])

    op.add_column("users", sa.Column("rating_avg", sa.Float(), nullable=True))
    op.add_column(
        "users",
        sa.Column("reviews_count", sa.Integer(), nullable=False, server_default="0"),
    )
    op.add_column(
        "users",
        sa.Column("deals_count", sa.Integer(), nullable=False, server_default="0"),
    )

    op.execute(
        """
        UPDATE users SET deals_count = counted.deals
        FROM (
            SELECT sale_cars.user_id AS seller_id, COUNT(*) AS deals
            FROM offers
            JOIN sale_cars ON sale_cars.sale_car_id = offers.sale_car_id
            WHERE offers.status = 'accepted'
            GROUP BY sale_cars.user_id
        ) AS counted
        WHERE users.id = counted.seller_id
        """
    )


def downgrade() -> None:
    op.drop_column("users", "deals_count")
    op.drop_column("users", "reviews_count")
    op.drop_column("users", "rating_avg")

    op.drop_index("ix_reviews_created_at", table_name="reviews")
    op.drop_index("ix_reviews_author_id", table_name="reviews")
    op.drop_index("ix_reviews_seller_id", table_name="reviews")
    op.drop_table("reviews")
