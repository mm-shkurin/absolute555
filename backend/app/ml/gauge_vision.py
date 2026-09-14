"""Чтение числа с экрана толщиномера зрением модели GigaChat.

Tesseract на семисегментных цифрах прибора ошибается правдоподобно: 350 читает как 450,
87 — как 1, и такое число проходит проверку диапазона и красит панель не тем цветом.
Модель читает экран целиком — видит «мкм», значок режима и заряд — и отличает замер от
остального. Токен и загрузка файла общие с чтением СТС.
"""

import re
from typing import Optional

from loguru import logger

from app.core.config_ml import GigaChatSettings
from app.ml.sts_vision import access_token, ask_about_file, upload_image

PROMPT = """На фотографии — экран толщиномера лакокрасочного покрытия автомобиля.

Найди на экране главное показание толщины покрытия в микрометрах (мкм, µm, um).
Верни СТРОГО одно число так, как оно написано на экране, без пояснений, пробелов и
единиц — например: 124 или 97.3 (дробную часть отделяй точкой).

Правила:
- Показание — самое крупное число на экране. Не путай его с зарядом батареи,
  номером режима, номером замера в серии, временем и минимумом/максимумом.
- Цифры на экране часто семисегментные: внимательно различай 1 и 7, 3 и 8, 5 и 6,
  0 и 8, 2 и 7, 4 и 9. Читай каждый разряд отдельно, слева направо.
- Десятичная точка на таких экранах — маленькая точка внизу между цифрами. Если она
  есть, обязательно поставь её: 32.3 и 323 — разные замеры.
- Единица слева узкая и легко теряется у края экрана: 1192 — это четыре цифры.
- Ведущие нули отбрасывай: 085 — это 85.
- Если экран не виден, число не читается или прибор показывает ошибку (Err, ---, Lo, Hi),
  верни слово NONE.
- НЕ УГАДЫВАЙ: неверное число окрашивает панель на карте покупателя в чужой цвет.
"""

NUMBER = re.compile(r"^\s*(\d{1,4})(?:[.,](\d{1,2}))?\s*$")


class GaugeVisionUnavailable(Exception):
    """Провайдер не ответил. Отличается от «прочитал и не нашёл числа»."""


def _upload(api: str, access: str, body: bytes, timeout: int, verify) -> str:
    return upload_image(api, access, body, timeout, verify, "gauge.jpg")


def _ask(api: str, access: str, file_id: str, timeout: int, verify) -> str:
    # Ноль, потому что число читается, а не сочиняется.
    return ask_about_file(api, access, file_id, timeout, verify, PROMPT, 0)


def parse_reading(content: str) -> Optional[int]:
    """Ответ модели — одно число, иначе «не прочитано». Лишний текст не разбирается: модель,
    которая начала объяснять, могла и ошибиться, и выуживать число из фразы — угадывать."""
    found = NUMBER.match(content or "")
    if not found:
        return None
    # Приборы показывают десятые (97.3), а карта хранит целые мкм: разница в долю
    # микрона цвета панели не меняет, а целое сравнимо между приборами.
    return round(float(f"{found.group(1)}.{found.group(2) or 0}"))


READS = 2


def read_gauge_vision(body: bytes) -> Optional[int]:
    """Число с экрана прибора. Бросает GaugeVisionUnavailable, если провайдер не ответил.

    Читается дважды: два расходящихся ответа — это «не прочитано», а не выбор одного из
    них. Лишнее чтение дешевле панели, окрашенной на карте покупателя в чужой цвет.
    """
    settings = GigaChatSettings()
    api = str(settings.giga_api_url).rstrip("/")
    try:
        access = access_token(settings)
        timeout, verify = settings.giga_gauge_timeout, settings.tls_verify
        file_id = _upload(api, access, body, timeout, verify)
        answers = [_ask(api, access, file_id, timeout, verify) for _ in range(READS)]
    except Exception as error:
        raise GaugeVisionUnavailable(str(error)) from error

    readings = {parse_reading(content) for content in answers}
    if len(readings) != 1 or None in readings:
        logger.info(f"gauge vision is not sure: {[a[:20] for a in answers]!r}")
        return None
    return readings.pop()
