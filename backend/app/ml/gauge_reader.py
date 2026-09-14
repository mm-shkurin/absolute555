"""Число со снимка прибора — одна точка входа для подсказки и для записи замера.

Снимок читается при выборе фото (подсказка продавцу), а потом тот же снимок приходит с
«Сохранить». Второй раз в GigaChat он не идёт: ответ лежит в Redis по хэшу снимка. Кэш —
в Redis, а не в памяти процесса: подсказку и запись может обслужить разный воркер.

Tesseract в цепочке больше нет: на полусотне настоящих снимков экранов он не прочитал
ни одного (0/50), GigaChat — 47/50 с двойным чтением (`scripts/gauge_eval.py`).
"""

import hashlib
from typing import Optional

from loguru import logger

from app.core.config_ml import RecognitionSettings
from app.ml.gauge_vision import GaugeVisionUnavailable, read_gauge_vision
from app.shared.storage.cache_service import cache_service

CACHE_PREFIX = "gauge_reading"


def _key(body: bytes) -> str:
    return hashlib.sha256(body).hexdigest()


async def read_panel_photo(body: bytes) -> Optional[int]:
    """Число с экрана прибора или None — не разобрали, либо провайдер не ответил.

    Недоступный провайдер — тоже «не прочитано»: продавец впишет число сам, и замер не
    должен ломаться оттого, что внешний сервис лёг.
    """
    key = _key(body)
    cached = await cache_service.get(CACHE_PREFIX, key)
    if cached is not None:
        return cached.get("value_um")

    try:
        reading = read_gauge_vision(body)
    except GaugeVisionUnavailable as error:
        logger.warning(f"gauge vision unavailable: {str(error)[:120]}")
        return None

    await cache_service.set(CACHE_PREFIX, key, {"value_um": reading}, ttl=RecognitionSettings().gauge_cache_ttl_seconds)
    return reading
