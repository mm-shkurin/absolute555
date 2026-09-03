"""Ответ языковой модели как поля.

Один разбор на два читателя — зрение по снимку СТС и расшифровку VIN. Оба просят
строгий JSON, оба получают его то в тексте, то с пояснением вокруг, и оба должны
одинаково понимать «мне нечего сказать»: модель пишет это словами не реже, чем null,
и слово, принятое за значение, приезжает в объявление как распознанное.
"""

import json
import re
from typing import Optional

from loguru import logger

# Модель, которой нечего сказать, иногда пишет это словами вместо null.
NOTHING = {"null", "none", "-", "не указано", "неизвестно", "n/a"}


def clean(value) -> Optional[str]:
    if value is None:
        return None
    text = str(value).strip()
    if not text or text.lower() in NOTHING:
        return None
    return text


def parse_answer(content: str, fields: tuple) -> dict:
    """Названные поля из ответа. Всё, что не разобралось, — пусто, а не догадка."""
    match = re.search(r"\{.*\}", content or "", re.S)
    if not match:
        logger.warning("model answer carried no JSON")
        return dict.fromkeys(fields)

    try:
        raw = json.loads(match.group(0))
    except json.JSONDecodeError:
        logger.warning("model answer was not valid JSON")
        return dict.fromkeys(fields)

    return {name: clean(raw.get(name)) for name in fields}
