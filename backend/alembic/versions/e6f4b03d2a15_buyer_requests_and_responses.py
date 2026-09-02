"""buyer requests and the responses suppliers make to them

Revision ID: e6f4b03d2a15
Revises: d5e3a91c7b64
Create Date: 2026-09-02

One response per supplier per request, held by a unique constraint: two concurrent
responses would both pass a check in the service, and the buyer would then see the same
supplier twice with two different prices.
"""

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

revision: str = "e6f4b03d2a15"
down_revision: Union[str, Sequence[str], None] = "d5e3a91c7b64"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "buyer_requests",
        sa.Column("request_id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column(
            "user_id",
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey("users.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column(
            "brand_id",
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey("brands.brand_id", ondelete="SET NULL"),
            nullable=True,
        ),
        sa.Column(
            "model_id",
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey("car_models.model_id", ondelete="SET NULL"),
            nullable=True,
        ),
        sa.Column("year_from", sa.Integer(), nullable=True),
        sa.Column("budget_max", sa.Float(), nullable=True),
        sa.Column("comment", sa.Text(), nullable=True),
        sa.Column("status", sa.String(), nullable=False, server_default="open"),
        sa.Column("created_at", sa.DateTime(), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(), server_default=sa.func.now()),
    )
    op.create_index("ix_buyer_requests_user_id", "buyer_requests", ["user_id"])
    op.create_index("ix_buyer_requests_status", "buyer_requests", ["status"])
    op.create_index("ix_buyer_requests_created_at", "buyer_requests", ["created_at"])

    op.create_table(
        "supplier_responses",
        sa.Column("response_id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column(
            "request_id",
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey("buyer_requests.request_id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column(
            "supplier_id",
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey("users.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column("price", sa.Float(), nullable=False),
        sa.Column("delivery_days", sa.Integer(), nullable=False),
        sa.Column("comment", sa.Text(), nullable=True),
        sa.Column("created_at", sa.DateTime(), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(), server_default=sa.func.now()),
        sa.UniqueConstraint("request_id", "supplier_id", name="responses_one_per_supplier"),
    )
    op.create_index("ix_supplier_responses_request_id", "supplier_responses", ["request_id"])
    op.create_index("ix_supplier_responses_supplier_id", "supplier_responses", ["supplier_id"])


def downgrade() -> None:
    op.drop_index("ix_supplier_responses_supplier_id", table_name="supplier_responses")
    op.drop_index("ix_supplier_responses_request_id", table_name="supplier_responses")
    op.drop_table("supplier_responses")

    op.drop_index("ix_buyer_requests_created_at", table_name="buyer_requests")
    op.drop_index("ix_buyer_requests_status", table_name="buyer_requests")
    op.drop_index("ix_buyer_requests_user_id", table_name="buyer_requests")
    op.drop_table("buyer_requests")
