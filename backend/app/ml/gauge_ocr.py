"""Чтение числа с экрана толщиномера.

Не переиспользует пайплайн СТС: там документ, страница текста и выбор лучшего чтения из
десятка вариантов; здесь одно число крупными цифрами на маленьком экране, и цена ошибки
другая — из документа лишнее слово безвредно, а лишняя цифра в замере это другой цвет
панели у покупателя.

Считается синхронно в запросе: это доли секунды на одном кадре, а очередь стоила бы
экрана ожидания на каждую из тринадцати панелей.
"""

import re
from io import BytesIO
from typing import Optional

import pytesseract
from PIL import Image, ImageOps

# Только цифры: на экране прибора рядом с числом стоят «мкм» и значки режима, и буква,
# принятая за цифру, — это тот самый лишний разряд.
DIGITS_ONLY = "--psm 7 --oem 3 -c tessedit_char_whitelist=0123456789"


def read_gauge(body: bytes) -> Optional[int]:
    """Число с экрана прибора, или None, если прочитать не удалось."""
    try:
        with Image.open(BytesIO(body)) as image:
            prepared = ImageOps.autocontrast(ImageOps.grayscale(image))
            text = pytesseract.image_to_string(prepared, config=DIGITS_ONLY)
    except Exception:
        # Нечитаемый кадр — это ответ «не прочитал», а не сбой сервера: продавец
        # переснимет или впишет число сам.
        return None

    digits = re.findall(r"\d+", text)
    if not digits:
        return None

    # Самая длинная группа цифр: на экране рядом с замером стоят номер режима и заряд,
    # и они короче.
    return int(max(digits, key=len))
