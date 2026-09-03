"""Что сделали с учётной записью, кто и почему.

Причина смены роли принималась ручкой и уходила в `logger.info` контейнера — то есть
жила до первого перезапуска. Спор «за что мне закрыли доступ» разрешать было нечем, а
именно на этот вопрос запись и заводится.

Только вставка и чтение: ни правки, ни удаления. Запись, которую можно подчистить, не
отвечает на вопрос «кто это сделал».
"""

import uuid
from datetime import datetime

from sqlalchemy import Column, DateTime, ForeignKey, String, Text, func
from sqlalchemy.dialects.postgresql import UUID

from app.db.database import BaseModel

ROLE_CHANGED = "role_changed"
BLOCKED = "blocked"
UNBLOCKED = "unblocked"


class AccountAudit(BaseModel):
    __tablename__ = "account_audit"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    # Кому. Индекс — потому что журнал всегда читается по одной учётной записи.
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False, index=True)
    # Кто. Без каскада на удаление: ушедший администратор не должен уносить с собой
    # запись о том, что он сделал.
    actor_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    action = Column(String, nullable=False)
    reason = Column(Text, nullable=False)
    # Для смены роли — из какой в какую. Хранится строкой, а не парой колонок: журналу
    # это нужно показать, а не искать по этому.
    details = Column(Text, nullable=True)
    created_at = Column(DateTime, server_default=func.now(), nullable=False)

    @classmethod
    def of(cls, user_id, actor_id, action: str, reason: str, details: str | None = None):
        return cls(
            id=uuid.uuid4(),
            user_id=user_id,
            actor_id=actor_id,
            action=action,
            reason=reason,
            details=details,
            created_at=datetime.utcnow(),
        )
