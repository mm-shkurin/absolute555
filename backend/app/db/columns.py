"""Column shapes every table spells the same way: a UUID key and a UUID reference."""

import uuid

from sqlalchemy import Column, ForeignKey
from sqlalchemy.dialects.postgresql import UUID


def uuid_key() -> Column:
    return Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)


def uuid_ref(target: str, ondelete: str, **options) -> Column:
    return Column(UUID(as_uuid=True), ForeignKey(target, ondelete=ondelete), **options)
