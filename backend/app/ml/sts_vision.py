"""Чтение СТС зрением модели: картинка на входе, поля на выходе.

Заменяет связку «tesseract сваливает текст → модель достраивает поля». Замер на корпусе
из двенадцати кадров (три бланка × четыре условия съёмки) показал, почему:

    поле       tesseract + текстовая модель    GigaChat Vision
    марка                 11/12                     12/12
    модель                 7/12                     12/12
    год                   12/12                     12/12
    номер                  3/12 (9/12 после          9/12
                                 нормализации)
    VIN                    9/12                      4/12

Vision выигрывает везде, кроме VIN, и проигрывает там по понятной причине: VIN — это
семнадцать случайных символов без смысла и без избыточности, а модель читает смыслом и
теряет символ (`ZJG012345` → `ZJ012345`) или подменяет похожий (`E` → `F`). Поэтому VIN
здесь не берётся на веру: он проверяется по форме, и расхождение с ним не достраивается,
а честно отдаётся как «не прочитано» — пустое поле продавец заполнит, а выдуманный VIN
уедет в объявление молча.
"""

import json
import re
import uuid
from typing import Optional

import requests
from loguru import logger

from app.core.config import GigaChatSettings

MODEL = "GigaChat-2-Max"
UPLOAD_TIMEOUT = 90
ANSWER_TIMEOUT = 180

# Буквы I, O и Q в VIN не используются по стандарту ISO 3779 — именно чтобы их не путали
# с единицей и нулём. Строка, где они есть, прочитана неверно.
VIN_SHAPE = re.compile(r"^[A-HJ-NPR-Z0-9]{17}$")

FIELDS = ("plate", "vin", "mark", "model", "year", "power", "body", "color")

PROMPT = """На изображении — свидетельство о регистрации транспортного средства (СТС) РФ.

Верни СТРОГО JSON без пояснений:
{"plate": null, "vin": null, "mark": null, "model": null, "year": null, "power": null, "body": null, "color": null}

Правила:
- VIN — ровно 17 символов латиницей и цифрами, без букв I, O, Q.
- Марка и модель — латиницей, как написано в документе.
- Поле, которого на изображении нет или которое не читается, — null.
- НЕ УГАДЫВАЙ и не достраивай по знаниям о модели автомобиля: пустое поле честнее
  выдуманного, потому что выдуманное приезжает в объявление как распознанное.
"""


class VisionUnavailable(Exception):
    """Провайдер не ответил. Отличается от «прочитал и не нашёл»."""


def access_token(settings: GigaChatSettings) -> str:
    answer = requests.post(
        str(settings.giga_oauth_url),
        headers={
            "Authorization": f"Basic {settings.giga_auth_key}",
            "RqUID": str(uuid.uuid4()),
            "Content-Type": "application/x-www-form-urlencoded",
        },
        data={"scope": str(settings.giga_scope)},
        verify=False,
        timeout=30,
    )
    answer.raise_for_status()
    return answer.json()["access_token"]


def _upload(api: str, access: str, body: bytes) -> str:
    answer = requests.post(
        f"{api}/files",
        headers={"Authorization": f"Bearer {access}"},
        files={"file": ("sts.jpg", body, "image/jpeg")},
        data={"purpose": "general"},
        verify=False,
        timeout=UPLOAD_TIMEOUT,
    )
    answer.raise_for_status()
    return answer.json()["id"]


def _ask(api: str, access: str, file_id: str) -> str:
    answer = requests.post(
        f"{api}/chat/completions",
        headers={"Authorization": f"Bearer {access}", "Content-Type": "application/json"},
        json={
            "model": MODEL,
            # Низкая температура, потому что документ читается, а не сочиняется.
            "temperature": 0.1,
            "messages": [{"role": "user", "content": PROMPT, "attachments": [file_id]}],
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
        logger.warning("vision answer carried no JSON")
        return {name: None for name in FIELDS}

    try:
        raw = json.loads(match.group(0))
    except json.JSONDecodeError:
        logger.warning("vision answer was not valid JSON")
        return {name: None for name in FIELDS}

    return {name: _clean(raw.get(name)) for name in FIELDS}


def _clean(value) -> Optional[str]:
    if value is None:
        return None
    text = str(value).strip()
    # Модель, которой нечего сказать, иногда пишет это словами вместо null.
    if not text or text.lower() in {"null", "none", "-", "не указано", "неизвестно", "n/a"}:
        return None
    return text


def valid_vin(value: Optional[str]) -> bool:
    if not value:
        return False
    return bool(VIN_SHAPE.match(re.sub(r"[\s\-]", "", value.upper())))


def read_sts(body: bytes) -> dict:
    """Поля СТС с картинки. Бросает VisionUnavailable, если провайдер не ответил."""
    settings = GigaChatSettings()
    api = str(settings.giga_api_url).rstrip("/")

    try:
        access = access_token(settings)
        file_id = _upload(api, access, body)
        content = _ask(api, access, file_id)
    except Exception as error:
        raise VisionUnavailable(str(error)) from error

    fields = parse_answer(content)
    if not valid_vin(fields.get("vin")):
        # Семнадцать случайных символов — единственное поле СТС без избыточности:
        # восстановить его нечем, и «почти правильный» VIN хуже пустого, потому что
        # проходит проверку длины и уезжает в объявление.
        logger.info("vision returned a VIN of the wrong shape; leaving it empty")
        fields["vin"] = None
    return fields
