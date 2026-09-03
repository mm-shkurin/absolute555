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
from app.ml.vin_shape import normalise

# Тот же алфавит, что у VIN, но без якорей: здесь номер ищется внутри сплошного дампа
# текста, а не проверяется целая строка.
VIN_INSIDE_TEXT = re.compile(r"[A-HJ-NPR-Z0-9]{17}")


def read_number(body: bytes) -> Optional[str]:
    """VIN из дампа tesseract, или None.

    Ищется только семнадцатизначный VIN. Номер кузова японской машины короче и по форме
    неотличим от того, что стоит на бланке рядом: на настоящих свидетельствах отсюда
    выходили серия документа («99 72 081780») и номер ПТС («25УВ 322839») — обе строки
    проходили проверку формы и вставали на место номера машины. Отличить их можно только
    по строке документа, а дамп текста строк не помнит: это знает зрение, и номер кузова
    остаётся за ним.
    """
    try:
        image, candidates = prepare_candidates(body)
        text = normalise(read_text(image, candidates))
    except Exception as error:
        logger.warning(f"tesseract could not read the document: {error}")
        return None

    # По словам, а не по склеенному тексту. Склейка убирает пробелы, и семнадцать подряд
    # идущих символов находятся всегда: «ГОД ВЫПУСКА ТС МАКС МАССА» после замены
    # кириллических двойников выглядит как VIN и проходит проверку алфавита.
    for token in re.split(r"[^A-Z0-9]+", text):
        if VIN_INSIDE_TEXT.fullmatch(token) and _has_digits(token):
            return token
    return None


def _has_digits(token: str) -> bool:
    """VIN всегда несёт цифры: год модели, завод, серийный номер.

    Строка из одних букв — это прочитанные слова бланка, а не номер машины.
    """
    return sum(character.isdigit() for character in token) >= 2
