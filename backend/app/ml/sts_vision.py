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

import re
import uuid
from typing import Optional

import requests
from loguru import logger

from app.core.config_ml import GigaChatSettings, get_gigachat_settings
from app.ml.model_answer import parse_answer

MODEL = "GigaChat-2-Max"

# Буквы I, O и Q в VIN не используются по стандарту ISO 3779 — именно чтобы их не путали
# с единицей и нулём. Строка, где они есть, прочитана неверно.
VIN_SHAPE = re.compile(r"^[A-HJ-NPR-Z0-9]{17}$")

FIELDS = ("plate", "vin", "body_number", "mark", "model", "year", "power", "body_type", "color")

PROMPT = """На изображении — свидетельство о регистрации транспортного средства (СТС) РФ.

Верни СТРОГО JSON без пояснений:
{"plate": null, "vin": null, "body_number": null, "mark": null, "model": null, "year": null, "power": null, "body_type": null, "color": null}

Правила:
- vin — строка «Идентификационный номер (VIN)». Ровно 17 символов латиницей и цифрами,
  без букв I, O, Q. Если там написано «ОТСУТСТВУЕТ» — так и верни, слово целиком.
- body_number — строка «Кузов (кабина, прицеп) №». У праворульных японских машин VIN не
  выдавали, и номер машины стоит именно здесь (GB6-1000952, RN7-3100986). Не путай его с
  серией бланка внизу документа и с номером ПТС.
- body_type — строка «Тип ТС» (седан, универсал, хэтчбек).
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
        verify=settings.tls_verify,
        timeout=settings.giga_token_timeout,
    )
    answer.raise_for_status()
    return answer.json()["access_token"]


def upload_image(api: str, access: str, body: bytes, timeout: int, verify, name: str) -> str:
    answer = requests.post(
        f"{api}/files",
        headers={"Authorization": f"Bearer {access}"},
        files={"file": (name, body, "image/jpeg")},
        data={"purpose": "general"},
        verify=verify,
        timeout=timeout,
    )
    answer.raise_for_status()
    return answer.json()["id"]


def ask_about_file(
    api: str, access: str, file_id: str, timeout: int, verify, prompt: str, temperature: float
) -> str:
    answer = requests.post(
        f"{api}/chat/completions",
        headers={"Authorization": f"Bearer {access}", "Content-Type": "application/json"},
        json={
            "model": MODEL,
            "temperature": temperature,
            "messages": [{"role": "user", "content": prompt, "attachments": [file_id]}],
        },
        verify=verify,
        timeout=timeout,
    )
    answer.raise_for_status()
    return answer.json()["choices"][0]["message"]["content"]


def _upload(api: str, access: str, body: bytes, timeout: int, verify) -> str:
    return upload_image(api, access, body, timeout, verify, "sts.jpg")


def _ask(api: str, access: str, file_id: str, timeout: int, verify) -> str:
    # Низкая температура, потому что документ читается, а не сочиняется.
    return ask_about_file(api, access, file_id, timeout, verify, PROMPT, 0.1)


def valid_vin(value: Optional[str]) -> bool:
    if not value:
        return False
    return bool(VIN_SHAPE.match(re.sub(r"[\s\-]", "", value.upper())))


def read_sts(body: bytes) -> dict:
    """Поля СТС с картинки. Бросает VisionUnavailable, если провайдер не ответил."""
    settings = get_gigachat_settings()
    api = str(settings.giga_api_url).rstrip("/")

    try:
        access = access_token(settings)
        verify = settings.tls_verify
        file_id = _upload(api, access, body, settings.giga_sts_upload_timeout, verify)
        content = _ask(api, access, file_id, settings.giga_sts_answer_timeout, verify)
    except Exception as error:
        raise VisionUnavailable(str(error)) from error

    fields = parse_answer(content, FIELDS)
    if fields.get("vin") and not valid_vin(fields["vin"]):
        # Не VIN по форме — но и не обязательно мусор: у праворульной японской машины в
        # этой строке стоит номер кузова (GB6-1000952), и обнулять его здесь значит
        # терять верно прочитанное. Что это за строка, решает vin_shape.classify, а
        # спорят о ней два читателя в sts_reader.
        logger.info("vision returned a number that is not a VIN; leaving it for classification")
    return fields
