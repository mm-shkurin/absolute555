"""thickness measurements of a listing

Revision ID: a2f7c60d31b8
Revises: c9a1e4f70d22
Create Date: 2026-09-02

One measurement per panel, held by a unique constraint rather than by a check in the
service: two concurrent writes would both pass a check and leave one panel measured
twice, and the map would then depend on which row a read happened to order first.

The panel is a string, not a database enum: the set lives in the code
(app/features/listing/panels.py), and a database enum would need its own migration
every time that set changed while adding nothing a foreign key does not.
"""

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

revision: str = "a2f7c60d31b8"
down_revision: Union[str, Sequence[str], None] = "c9a1e4f70d22"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "thickness_measurements",
        sa.Column("measurement_id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column(
            "sale_car_id",
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey("sale_cars.sale_car_id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column("panel", sa.String(), nullable=False),
        sa.Column("value_um", sa.Integer(), nullable=False),
        sa.Column("photo_key", sa.String(), nullable=False),
        sa.Column("created_at", sa.DateTime(), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(), server_default=sa.func.now()),
        sa.UniqueConstraint("sale_car_id", "panel", name="thickness_one_per_panel"),
    )
    op.create_index(
        "ix_thickness_measurements_sale_car_id", "thickness_measurements", ["sale_car_id"]
    )


def downgrade() -> None:
    op.drop_index("ix_thickness_measurements_sale_car_id", table_name="thickness_measurements")
    op.drop_table("thickness_measurements")
