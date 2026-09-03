"""VIN на входе, характеристики машины на выходе.

Второй источник тех же полей, что читаются со снимка СТС, и нужен он там, где снимок не
помог: документ прочитали, идентификационный номер — нет, и продавец переписал его
руками. Читать нечего — есть семнадцать символов, в которых закодированы завод, модель и
год выпуска.

Провайдер тот же, что у зрения (`app/ml/sts_vision.py`), но запрос текстовый: картинки
здесь нет. Инструкция «не угадывай» повторена намеренно — модель охотно достраивает
комплектацию по марке, и достроенное приезжает в объявление как распознанное.
"""

import json
import re
from typing import Optional

import requests
from loguru import logger

from app.core.config import GigaChatSettings
from app.ml.sts_vision import MODEL, VisionUnavailable, access_token

ANSWER_TIMEOUT = 120

FIELDS = ("mark", "model", "year", "power", "transmission")

PROMPT = """Расшифруй VIN автомобиля: {vin}

Верни СТРОГО JSON без пояснений:
{{"mark": null, "model": null, "year": null, "power": null, "transmission": null}}

Правила:
- mark и model — латиницей, как принято у производителя.
- year — год выпуска четырьмя цифрами, если он закодирован в VIN.
- power — мощность двигателя в лошадиных силах, целым числом.
- transmission — одно из: automatic, manual.
- Поле, которого в этом VIN нет или в котором ты не уверен, — null.
- НЕ УГАДЫВАЙ. Если VIN не соответствует ни одному известному автомобилю, верни все
  поля null: пустое поле продавец заполнит сам, а выдуманное уедет в объявление как
  распознанное.
"""


def _ask(api: str, access: str, vin: str) -> str:
    answer = requests.post(
        f"{api}/chat/completions",
        headers={"Authorization": f"Bearer {access}", "Content-Type": "application/json"},
        json={
            "model": MODEL,
            # Низкая температура, потому что VIN расшифровывается, а не сочиняется.
            "temperature": 0.1,
            "messages": [{"role": "user", "content": PROMPT.format(vin=vin)}],
        },
        verify=False,
        timeout=ANSWER_TIMEOUT,
    )
    answer.raise_for_status()
    return answer.json()["choices"][0]["message"]["content"]


def parse_answer(content: str) -> dict:
    """Ответ модели как поля. Всё, что не разобралось, — пусто, а не догадка."""
    match = re.search(r"\{.*\}", content or "", re.S)
    if not match:
        logger.warning("vin answer carried no JSON")
        return {name: None for name in FIELDS}

    try:
        raw = json.loads(match.group(0))
    except json.JSONDecodeError:
        logger.warning("vin answer was not valid JSON")
        return {name: None for name in FIELDS}

    return {name: _clean(raw.get(name)) for name in FIELDS}


def _clean(value) -> Optional[str]:
    if value is None:
        return None
    text = str(value).strip()
    if not text or text.lower() in {"null", "none", "-", "не указано", "неизвестно", "n/a"}:
        return None
    return text


def read_vin(vin: str) -> dict:
    """Характеристики по VIN. Бросает VisionUnavailable, если провайдер не ответил."""
    settings = GigaChatSettings()
    api = str(settings.giga_api_url).rstrip("/")

    try:
        access = access_token(settings)
        content = _ask(api, access, vin)
    except Exception as error:
        raise VisionUnavailable(str(error)) from error

    return parse_answer(content)
