"""СТС photo in, decoded fields out.

Two steps that used to live here are next door now: sts_image.py prepares the picture and
sts_ocr.py reads it. What stays is the orchestration and the GigaChat call that turns a
noisy OCR dump into fields -- including the retry loop, because the network between here
and GigaChat drops connections often enough that one attempt is not an answer.
"""

import asyncio
import json

from gigachat import GigaChat
from gigachat.models import Chat, Messages, MessagesRole
from loguru import logger

from app.core.config import GigaChatSettings
from app.ml.sts_image import prepare_candidates
from app.ml.sts_ocr import read_text


async def decode_vin(file_bytes: bytes, car_id: str = None) -> dict:

    if not file_bytes:
        logger.error("decode_vin called without file_bytes")
        return {"error": "file_bytes is required"}

    try:
        image, candidates = prepare_candidates(file_bytes)
        ocr_text = read_text(image, candidates)
    except Exception as e:
        logger.error(f"OCR failed: {e}")
        return {"error": "ocr_failed"}

    settings = GigaChatSettings()
    client = GigaChat(
        credentials=settings.giga_auth_key,
        model="GigaChat:latest",
        verify_ssl_certs=False,
    )

    system_msg = Messages(
        role=MessagesRole.SYSTEM,
        content=(
            "Ты — эксперт по СТС РФ и VIN-кодам. "
            "OCR часто искажает символы: '0' ↔️ 'O', '1' ↔️ 'I', '8' ↔️ 'B', '5' ↔️ 'S', '2' ↔️ 'Z'. "
            "VIN должен быть длиной 17 символов и не содержать I/O/Q. Исправь ошибки, если возможно. "
            "Если распознаны марка и модель (например, 'KIA RIO', 'LEXUS LX 570') — "
            "заполни ВСЕ поля, даже если они не указаны в тексте. "
            "Используй свои знания о типовых характеристиках этой модели: "
            "- год: укажи наиболее вероятный или диапазон (выбери средний, например, 2018); "
            "- КПП: почти все KIA RIO — 'автомат' или 'механика', LEXUS LX 570 — всегда 'автомат'; "
            "- мощность: укажи типичное значение в л.с. (например, для LX 570 — 367, для RIO — 123). "
            "НЕ оставляй поля пустыми. Если данные неизвестны — сделай обоснованное предположение. "
            "Отвечай ТОЛЬКО валидным JSON. Никаких пояснений."
        ),
    )

    user_prompt = f"""
Проанализируй следующий текст с СТС (результат OCR):

{ocr_text}

Верни JSON со следующими полями:
{{
  "vin": "строго 17 символов (исправленный), или как распознано, если нельзя восстановить",
  "mark": "нормализованная марка (например: LEXUS, KIA, TOYOTA)",
  "model": "нормализованная модель (например: LX 570, RIO, CAMRY)",
  "year": "год выпуска (4 цифры, например: 2018)",
  "transmission": "тип КПП: 'автомат', 'механика', 'вариатор' или 'робот'",
  "engine_power": 367
}}

Если VIN не обнаружен И марка/модель не определены — верни:
{{
  "error": "VIN not found",
  "reason": "Краткое объяснение"
}}

❗️ ВАЖНО: 
- НЕ оставляй поля пустыми.
- Для engine_power указывай ТОЛЬКО число (без кавычек), например: 367, а не "367"
- Если мощность неизвестна, укажи типичное значение для данной модели
- Используй знания о типовых характеристиках авто.
- Только валидный JSON, без дополнительного текста.
"""
    user_msg = Messages(role=MessagesRole.USER, content=user_prompt)

    max_retries = 3
    retry_delay = 2.0  # секунды
    
    for attempt in range(max_retries):
        try:
            loop = asyncio.get_running_loop()
            resp = await loop.run_in_executor(
                None, lambda: client.chat(Chat(messages=[system_msg, user_msg]))
            )

            content = resp.choices[0].message.content
            logger.info(f"GigaChat content: {content}")

            try:
                result = json.loads(content)
                return result
            except Exception as e:
                logger.error(f"Failed to parse GigaChat JSON: {e}")
                return {"error": "invalid response", "raw_output": content}
                
        except Exception as e:
            error_type = type(e).__name__
            error_msg = str(e)
            
            is_network_error = (
                "ConnectError" in error_type or
                "Connection" in error_msg or
                "Connection reset" in error_msg or
                "timeout" in error_msg.lower() or
                "104" in error_msg 
            )
            
            if is_network_error and attempt < max_retries - 1:
                wait_time = retry_delay * (attempt + 1)  
                logger.warning(
                    f"GigaChat network error (attempt {attempt + 1}/{max_retries}): {error_msg}. "
                    f"Retrying in {wait_time}s..."
                )
                await asyncio.sleep(wait_time)
                continue
            else:
                logger.error(f"GigaChat error after {attempt + 1} attempts: {error_type}: {error_msg}")
                return {
                    "error": "gigachat_connection_error",
                    "message": f"{error_type}: {error_msg}",
                    "attempts": attempt + 1
                }
