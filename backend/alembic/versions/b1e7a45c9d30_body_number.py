"""the body number of a car that never had a VIN

Revision ID: b1e7a45c9d30
Revises: b7d1c4e05a92
Create Date: 2026-09-03

Half of the registration documents from Omsk carry no VIN at all: on a right-hand-drive
Japanese car the line reads «ОТСУТСТВУЕТ», and the car is identified by the number printed
in «Кузов (кабина, прицеп) №» — GB6-1000952, RN7-3100986, NHP130-2010843. The reading
already returns it; without a column of its own it was read and dropped.

A column rather than reuse of `vin`: the two are checked differently — a VIN is seventeen
characters of a fixed alphabet, a body number is a model code and a serial with a dash —
and a buyer who sees them in one field cannot tell which they are looking at.
"""

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = "b1e7a45c9d30"
down_revision: Union[str, Sequence[str], None] = "b7d1c4e05a92"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column("sale_cars", sa.Column("body_number", sa.String(), nullable=True))


def downgrade() -> None:
    op.drop_column("sale_cars", "body_number")
