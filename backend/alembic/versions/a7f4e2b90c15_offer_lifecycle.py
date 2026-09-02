"""six offer statuses, and the moment an offer stops standing

Revision ID: a7f4e2b90c15
Revises: f1b6d92c7a48
Create Date: 2026-08-31

The column was a database enum of three values. It becomes plain text: the set grew to
six here, and every later growth would otherwise be a migration of the type itself.

Existing offers are renamed rather than reinterpreted — accept becomes accepted, reject
becomes rejected — and every pending one is given an expiry counted from when it was
made. Left null, the job would either ignore them forever or expire them all at once.
"""

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = "a7f4e2b90c15"
down_revision: Union[str, Sequence[str], None] = "f1b6d92c7a48"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.alter_column(
        "offers",
        "status",
        existing_type=sa.Enum("ACCEPT", "PENDING", "REJECT", name="offerstatus"),
        type_=sa.String(),
        existing_nullable=False,
        postgresql_using="status::text",
    )
    op.execute("UPDATE offers SET status = 'accepted' WHERE status IN ('ACCEPT', 'accept')")
    op.execute("UPDATE offers SET status = 'rejected' WHERE status IN ('REJECT', 'reject')")
    op.execute("UPDATE offers SET status = 'pending' WHERE status IN ('PENDING', 'pending')")
    op.execute("DROP TYPE IF EXISTS offerstatus")

    op.add_column("offers", sa.Column("expires_at", sa.DateTime(), nullable=True))
    op.execute(
        "UPDATE offers SET expires_at = created_at + interval '72 hours' WHERE status = 'pending'"
    )
    op.create_index("ix_offers_status", "offers", ["status"])
    op.create_index("ix_offers_expires_at", "offers", ["expires_at"])


def downgrade() -> None:
    op.drop_index("ix_offers_expires_at", table_name="offers")
    op.drop_index("ix_offers_status", table_name="offers")
    op.drop_column("offers", "expires_at")

    # The three statuses that have no older equivalent collapse into reject: they all end
    # an offer without a sale, which is as much as the old vocabulary could say.
    op.execute("UPDATE offers SET status = 'accept' WHERE status = 'accepted'")
    op.execute(
        "UPDATE offers SET status = 'reject' "
        "WHERE status IN ('rejected', 'withdrawn', 'expired', 'car_sold')"
    )
    offer_status = sa.Enum("ACCEPT", "PENDING", "REJECT", name="offerstatus")
    offer_status.create(op.get_bind(), checkfirst=True)
    op.alter_column(
        "offers",
        "status",
        existing_type=sa.String(),
        type_=offer_status,
        existing_nullable=False,
        postgresql_using="upper(status)::offerstatus",
    )
