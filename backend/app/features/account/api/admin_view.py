"""Строки в то, что видит консоль.

Сборка вида жила прямо в роутере `role.py` — тот самый случай, который разбирала
история 19. Здесь она одна на все четыре ответа, поэтому имя и провайдер считаются
по одному правилу, а не по трём похожим.

Строки приходят из сервиса и не аннотируются классами ORM: слой представления не знает
про хранение — то же решение, что в `moderation_view`.
"""

from typing import Iterable, List, Optional

from app.features.account.schemas.admin import (
    AuditEntry,
    UserAccess,
    UserCard,
    UserPage,
    UserSummary,
)


def platform_of(user) -> Optional[str]:
    if isinstance(user.vk_json, dict):
        return "vk"
    if isinstance(user.yandex_json, dict):
        return "yandex"
    return None


def summary_of(user) -> UserSummary:
    return UserSummary(
        id=user.id,
        role=user.role,
        is_verified=user.is_verified,
        is_blocked=user.is_blocked,
        created_at=user.created_at,
        name=user.display_name,
        platform=platform_of(user),
    )


def page_of(users: Iterable, total: int, page: int, page_size: int) -> UserPage:
    return UserPage(
        items=[summary_of(user) for user in users],
        total=total,
        page=page,
        page_size=page_size,
    )


def card_of(user, listings_total: int, complaints_total: int) -> UserCard:
    return UserCard(
        id=user.id,
        role=user.role,
        is_verified=user.is_verified,
        is_blocked=user.is_blocked,
        blocked_reason=user.blocked_reason,
        blocked_at=user.blocked_at,
        created_at=user.created_at,
        name=user.display_name,
        platform=platform_of(user),
        listings_total=listings_total,
        complaints_total=complaints_total,
    )


def access_of(user) -> UserAccess:
    return UserAccess(
        id=user.id,
        is_blocked=user.is_blocked,
        blocked_reason=user.blocked_reason,
        blocked_at=user.blocked_at,
    )


def audit_of(rows: Iterable) -> List[AuditEntry]:
    return [
        AuditEntry(
            id=entry.id,
            action=entry.action,
            actor_id=entry.actor_id,
            actor_name=actor.display_name,
            reason=entry.reason,
            details=entry.details,
            created_at=entry.created_at,
        )
        for entry, actor in rows
    ]
