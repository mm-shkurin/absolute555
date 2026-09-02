"""what read the measurement, and what the photograph said

Revision ID: b3d8e1f42a70
Revises: a2f7c60d31b8
Create Date: 2026-09-02

Both columns are needed together: without the source nobody can tell whether the seller
corrected the reading, and without the reading nobody can tell what they corrected it
from — which is the difference between a fixed typo of the gauge and a drawn-in number.

Measurements written before this revision were typed by the seller, so that is what they
are backfilled as.
"""

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = "b3d8e1f42a70"
down_revision: Union[str, Sequence[str], None] = "a2f7c60d31b8"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column(
        "thickness_measurements",
        sa.Column("value_source", sa.String(), nullable=False, server_default="seller"),
    )
    op.add_column("thickness_measurements", sa.Column("ocr_value_um", sa.Integer(), nullable=True))


def downgrade() -> None:
    op.drop_column("thickness_measurements", "ocr_value_um")
    op.drop_column("thickness_measurements", "value_source")
