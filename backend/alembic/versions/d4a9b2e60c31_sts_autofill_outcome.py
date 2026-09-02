"""the outcome of the СТС reading, and who filled make and model

Revision ID: d4a9b2e60c31
Revises: c3f8a1d47b20
Create Date: 2026-08-31

Existing listings get `none` rather than a guess: task_status is the queue's vocabulary
and does not map cleanly onto what a seller is shown, and a wrong outcome on an old row
would tell a seller their document failed when it never ran.

Make and model of a row that already carries them are attributed to the reading, not to
the seller: before this revision nothing recorded a manual choice, so claiming one would
freeze a value the seller never confirmed against every later reading.
"""

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = "d4a9b2e60c31"
down_revision: Union[str, Sequence[str], None] = "c3f8a1d47b20"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column(
        "sale_cars",
        sa.Column("autofill_state", sa.String(), nullable=False, server_default="none"),
    )
    op.add_column("sale_cars", sa.Column("brand_source", sa.String(), nullable=True))
    op.add_column("sale_cars", sa.Column("model_source", sa.String(), nullable=True))
    op.add_column("sale_cars", sa.Column("autofill_updated_at", sa.DateTime(), nullable=True))

    op.execute("UPDATE sale_cars SET brand_source = 'ocr' WHERE brand_id IS NOT NULL")
    op.execute("UPDATE sale_cars SET model_source = 'ocr' WHERE model_id IS NOT NULL")


def downgrade() -> None:
    op.drop_column("sale_cars", "autofill_updated_at")
    op.drop_column("sale_cars", "model_source")
    op.drop_column("sale_cars", "brand_source")
    op.drop_column("sale_cars", "autofill_state")
