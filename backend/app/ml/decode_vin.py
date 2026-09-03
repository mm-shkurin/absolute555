"""СТС photo in, decoded fields out.

Раньше здесь стояла связка «tesseract сваливает текст → GigaChat достраивает поля».
Замер на корпусе из двенадцати кадров показал две вещи. Первая: зрение модели читает
бланк лучше по всем полям, кроме VIN (марка 12/12 против 11/12, модель 12/12 против
7/12, номер 9/12 против 3/12). Вторая, более важная: старый промпт требовал не оставлять
поля пустыми и угадывать типовые характеристики модели, поэтому в объявление приезжали
год и мощность, которых в документе не было, — и приезжали помеченными как распознанные.

Путь через tesseract оставлен ниже закомментированным: он читает VIN точнее зрения
(9/12 против 4/12), и когда дойдут руки до второго мнения по этому одному полю, брать
его будет откуда. Числа и рассуждение — в app/ml/sts_vision.py.
"""

import asyncio

from loguru import logger

from app.ml.sts_vision import VisionUnavailable, read_sts

# --- Прежний путь: tesseract + текстовая модель. Оставлен для второго мнения по VIN. ---
# from app.ml.sts_image import prepare_candidates
# from app.ml.sts_ocr import read_text
#
#
# def _read_document(file_bytes: bytes) -> str:
#     image, candidates = prepare_candidates(file_bytes)
#     return read_text(image, candidates)
# --------------------------------------------------------------------------------------


async def decode_vin(file_bytes: bytes, car_id: str = None) -> dict:
    """Поля СТС с фотографии. Непрочитанное остаётся пустым, а не угадывается."""
    if not file_bytes:
        logger.error("decode_vin called without file_bytes")
        return {"error": "file_bytes is required"}

    try:
        # Сеть и разбор картинки идут в поток: на воркере это тот же цикл событий, что
        # у всех остальных задач.
        loop = asyncio.get_running_loop()
        fields = await loop.run_in_executor(None, read_sts, file_bytes)
    except VisionUnavailable as error:
        logger.error(f"vision provider unavailable: {error}")
        return {"error": "vision_unavailable", "message": str(error)}
    except Exception as error:
        logger.exception(f"reading the registration document failed: {error}")
        return {"error": "ocr_failed"}

    if not any(fields.get(name) for name in ("vin", "mark", "model")):
        # Ни VIN, ни марки, ни модели — читать было нечего. Отличается от «прочитали
        # часть»: продавцу показывается разное.
        return {"error": "VIN not found", "reason": "документ не распознан"}

    return {
        "vin": fields.get("vin"),
        "mark": fields.get("mark"),
        "model": fields.get("model"),
        "year": fields.get("year"),
        "transmission": None,
        "engine_power": fields.get("power"),
    }
