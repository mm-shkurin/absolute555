"""Второе мнение по идентификационному номеру: тот же tesseract, но об одном поле.

Прежде он читал весь документ, и полученный дамп текста доводила до полей языковая
модель. Сейчас документ читает зрение, а здесь остаётся единственное, в чём tesseract
его обыгрывает: длинная случайная строка, которую надо взять посимвольно, а не понять.
"""

import re
from typing import Optional

from loguru import logger

from app.ml.sts_image import prepare_candidates
from app.ml.sts_ocr import read_text
from app.ml.vin_shape import BODY_NUMBER, VIN, normalise


def read_number(body: bytes) -> Optional[str]:
    """Идентификационный номер из дампа tesseract, или None, если его там нет."""
    try:
        image, candidates = prepare_candidates(body)
        text = normalise(read_text(image, candidates))
    except Exception as error:
        logger.warning(f"tesseract could not read the document: {error}")
        return None

    found = VIN.findall(re.sub(r"[^A-Z0-9]", "", text))
    if found:
        return found[0]

    # Семнадцати символов подряд нет — ищем японский номер кузова. Он короче и с дефисом,
    # поэтому по сплошной строке его не найти: разбиваем по разделителям.
    for chunk in re.split(r"[^A-Z0-9\-]+", text):
        if BODY_NUMBER.match(chunk):
            return chunk
    return None
