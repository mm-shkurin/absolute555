"""закрытый доступ и журнал того, кто его закрыл

Revision ID: a9c2f7b41e08
Revises: e6f4b03d2a15
Create Date: 2026-09-03

Существующие учётные записи получают открытый доступ явным значением, а не NULL:
колонка читается на каждом запросе с токеном, и NULL там означал бы «неизвестно» в
проверке, у которой нет третьего ответа.

Журнал ссылается на исполнителя без каскада: администратор, чью запись когда-нибудь
удалят, не должен уносить с собой след того, что он сделал.
"""

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = "a9c2f7b41e08"
down_revision: Union[str, Sequence[str], None] = "e6f4b03d2a15"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column(
        "users",
        sa.Column("is_blocked", sa.Boolean(), nullable=False, server_default=sa.false()),
    )
    op.add_column("users", sa.Column("blocked_reason", sa.Text(), nullable=True))
    op.add_column("users", sa.Column("blocked_at", sa.DateTime(), nullable=True))

    op.create_table(
        "account_audit",
        sa.Column("id", sa.UUID(as_uuid=True), primary_key=True),
        sa.Column("user_id", sa.UUID(as_uuid=True), sa.ForeignKey("users.id"), nullable=False),
        sa.Column("actor_id", sa.UUID(as_uuid=True), sa.ForeignKey("users.id"), nullable=False),
        sa.Column("action", sa.String(), nullable=False),
        sa.Column("reason", sa.Text(), nullable=False),
        sa.Column("details", sa.Text(), nullable=True),
        sa.Column("created_at", sa.DateTime(), server_default=sa.func.now(), nullable=False),
    )
    op.create_index("ix_account_audit_user_id", "account_audit", ["user_id"])


def downgrade() -> None:
    op.drop_index("ix_account_audit_user_id", table_name="account_audit")
    op.drop_table("account_audit")
    op.drop_column("users", "blocked_at")
    op.drop_column("users", "blocked_reason")
    op.drop_column("users", "is_blocked")
