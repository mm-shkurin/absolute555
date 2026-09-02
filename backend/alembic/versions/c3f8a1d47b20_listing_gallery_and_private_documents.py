"""listing gallery with an explicit order, and documents out of the database

Revision ID: c3f8a1d47b20
Revises: b7e1c4a2f905
Create Date: 2026-08-30

Written by hand for the data step. Autogenerate sees two columns appear and two vanish;
it does not see that every existing listing's photographs have to be carried into the new
shape, nor that the СТС scans leaving this table are the point of the change rather than
a side effect.

s3_photo_car_keys held a bare list of keys, so the order was whatever order the rows
happened to be appended in. It becomes a list of objects with an identity per photograph,
and the list's order is now the displayed order.

The scans themselves are not moved here. They sit base64 in sts_photos, and moving bytes
into object storage is not something a migration should do inside a transaction that also
alters the schema -- the move runs as a one-off task afterwards, reading this column while
it still exists. What this migration does is stop new scans from landing in the table.
"""

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

revision: str = "c3f8a1d47b20"
down_revision: Union[str, Sequence[str], None] = "b7e1c4a2f905"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column("sale_cars", sa.Column("photos", postgresql.JSONB(), nullable=True))
    op.add_column("sale_cars", sa.Column("sts_key", sa.String(), nullable=True))

    # Each existing key becomes a photograph with an identity, keeping the order the array
    # already had. No preview exists for these: preview_key stays null and the reader falls
    # back to the original, so an old listing keeps working until someone re-uploads.
    op.execute(
        """
        UPDATE sale_cars SET photos = COALESCE((
            SELECT jsonb_agg(
                jsonb_build_object(
                    'photo_id', md5(key_with_index.key || key_with_index.ordinality::text),
                    'key', key_with_index.key,
                    'preview_key', NULL
                )
                ORDER BY key_with_index.ordinality
            )
            FROM jsonb_array_elements_text(s3_photo_car_keys::jsonb)
                 WITH ORDINALITY AS key_with_index(key, ordinality)
        ), '[]'::jsonb)
        WHERE s3_photo_car_keys IS NOT NULL
        """
    )
    op.execute("UPDATE sale_cars SET photos = '[]'::jsonb WHERE photos IS NULL")
    op.alter_column("sale_cars", "photos", nullable=False, server_default=sa.text("'[]'::jsonb"))


def downgrade() -> None:
    op.execute(
        """
        UPDATE sale_cars SET s3_photo_car_keys = COALESCE((
            SELECT json_agg(photo->>'key' ORDER BY ordinality)
            FROM jsonb_array_elements(photos) WITH ORDINALITY AS entry(photo, ordinality)
        ), '[]'::json)
        """
    )
    op.drop_column("sale_cars", "sts_key")
    op.drop_column("sale_cars", "photos")
