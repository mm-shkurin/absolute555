"""Ответ провайдера входа: как он лежит и как из него достать имя.

Отдельным модулем, а не методом строки и не функцией вида: читают его и модель (имя
на строке), и роутер профиля (сырой ответ провайдера наружу), а роутеру запрещено
импортировать модели. Зависимостей у модуля нет вовсе — это разбор словаря.
"""

import json

def as_profile(raw) -> dict:
    """Ответ провайдера словарём, как бы он ни лёг в колонку.

    Вход через Яндекс складывает его `json.dumps` — в JSONB попадает строка, а не
    объект, и проверка `isinstance(raw, dict)` пропускала его молча: консоль модератора
    показывала «Неизвестный пользователь» на всех до единого, включая тех, у кого имя
    в профиле есть.
    """
    if isinstance(raw, dict):
        return raw
    if isinstance(raw, str):
        try:
            parsed = json.loads(raw)
        except (TypeError, ValueError):
            return {}
        return parsed if isinstance(parsed, dict) else {}
    return {}


def name_in(profile: dict) -> str:
    """Имя из ответа провайдера. Порядок — от человеческого к техническому.

    `real_name` и `display_name` заполнены у Яндекса чаще, чем пара имя-фамилия, а
    логин — последнее, чем стоит назвать человека, и всё же лучше пустоты.
    """
    for key in ("real_name", "display_name"):
        value = profile.get(key)
        if isinstance(value, str) and value.strip():
            return value.strip()

    pair = " ".join(
        part for part in (profile.get("first_name"), profile.get("last_name")) if part
    ).strip()
    if pair:
        return pair

    login = profile.get("login")
    return login.strip() if isinstance(login, str) and login.strip() else ""
