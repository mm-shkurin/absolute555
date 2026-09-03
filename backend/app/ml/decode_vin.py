"""СТС photo in, decoded fields out.

Два читателя, потому что ошибаются они по-разному. Зрение модели берёт документ целиком и
выигрывает по всем полям (марка 12/12 против 11/12, модель 12/12 против 7/12, номер 9/12
против 3/12), но теряет символ в длинной случайной строке. Tesseract читает
идентификационный номер посимвольно и точнее (9/12 против 4/12), а марку путает
алфавитом. Правило спора — в app/ml/sts_reader.py; коротко: согласие принимается молча,
расхождение помечается и уходит на подтверждение продавцу.

Прежний путь — дамп tesseract, доведённый до полей языковой моделью, — снят целиком.
Вместе с ним ушла инструкция «НЕ оставляй поля пустыми, сделай обоснованное
предположение»: в объявление приезжали год, коробка и мощность, которых в документе не
было, помеченные как распознанные.
"""

import asyncio

from loguru import logger

from app.core.config import RecognitionSettings
from app.ml.sts_number_ocr import read_number
from app.ml.sts_reader import read_document
from app.ml.sts_vision import VisionUnavailable, read_sts


def _read(file_bytes: bytes) -> dict:
    # Второе мнение по номеру — по настройке. На настоящих фотографиях оно за двенадцать
    # документов подтвердило один и стоило втрое больше времени, чем само чтение; на
    # чистом скане соотношение обратное, поэтому выключатель, а не удаление.
    confirm = read_number if RecognitionSettings().confirm_number_with_ocr else None
    return read_document(file_bytes, vision=read_sts, second_opinion=confirm)


async def decode_vin(file_bytes: bytes, car_id: str = None) -> dict:
    """Поля СТС с фотографии. Непрочитанное остаётся пустым, а не угадывается."""
    if not file_bytes:
        logger.error("decode_vin called without file_bytes")
        return {"error": "file_bytes is required"}

    try:
        # Сеть, tesseract и OpenCV идут в поток: на воркере это тот же цикл событий, что
        # у всех остальных задач.
        loop = asyncio.get_running_loop()
        fields = await loop.run_in_executor(None, _read, file_bytes)
    except VisionUnavailable as error:
        logger.error(f"vision provider unavailable: {error}")
        return {"error": "vision_unavailable", "message": str(error)}
    except Exception as error:
        logger.exception(f"reading the registration document failed: {error}")
        return {"error": "ocr_failed"}

    if not any(fields.get(name) for name in ("vin", "body_number", "mark", "model")):
        return {"error": "VIN not found", "reason": "документ не распознан"}

    return {
        "vin": fields.get("vin"),
        # Номер кузова японской машины: у неё VIN не выдавали вовсе, и пустое поле здесь
        # означало бы, что документ прочитан хуже, чем он прочитан.
        "body_number": fields.get("body_number"),
        "number_kind": fields.get("number_kind"),
        "number_agreed": fields.get("number_agreed"),
        "mark": fields.get("mark"),
        "model": fields.get("model"),
        "year": fields.get("year"),
        # Коробки в СТС нет вовсе — прежний промпт угадывал её по модели автомобиля.
        "transmission": None,
        "engine_power": fields.get("power"),
    }
