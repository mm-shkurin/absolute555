"""Учётная запись на проводе.

Имя собирается строкой (`Users.display_name`), а не здесь: правило «своё имя перекрывает
провайдерское» принадлежит записи, а не выдаче, и повторённое в виде дважды разъезжается.
"""

from typing import Optional

from app.shared.storage.s3_service import s3_service


def avatar_url(user) -> Optional[str]:
    key = getattr(user, "avatar_key", None)
    return s3_service.get_public_photo_url(key) if key else None


# Чем строка подписана, когда имени нет. Для списка модератора это ответ — строка не
# может остаться без подписи, — а для витрины и своего профиля это и есть «имени нет».
PLACEHOLDERS = frozenset({"Гость", "Без имени", "Неизвестный пользователь"})


def name_of(user) -> Optional[str]:
    """Имя человека, либо ничего.

    `Users.display_name` не умеет ответить «никак»: он подставляет подпись, и это верно
    для списка, где каждая строка обязана быть названа. На витрине и в своём профиле
    пустое место честнее подписи, которую человек за своё имя не примет.
    """
    name = user.display_name
    return None if name in PLACEHOLDERS else name


def profile_view(user) -> dict:
    return {
        "id": user.id,
        "name": name_of(user),
        "avatar_url": avatar_url(user),
        "role": user.role,
        "is_guest": bool(user.is_guest),
        "is_verified": bool(user.is_verified),
        "rating": user.rating_avg,
        "reviews_count": user.reviews_count or 0,
        "deals_count": user.deals_count or 0,
        "created_at": user.created_at,
    }
