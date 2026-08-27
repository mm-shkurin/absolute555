from gigachat import GigaChat
from gigachat.models import Chat, Messages, MessagesRole
from app.core.config import GigaChatSettings
from loguru import logger
import asyncio
import json
import pytesseract
from PIL import Image
from io import BytesIO


async def decode_vin(file_bytes: bytes, car_id: str = None) -> dict:

    if not file_bytes:
        logger.error("decode_vin called without file_bytes")
        return {"error": "file_bytes is required"}

    try:
        image = Image.open(BytesIO(file_bytes))
        
        width, height = image.size
        logger.info(f"Original image size: {width}x{height}")
        
        max_processing_size = 2500
        if width > max_processing_size or height > max_processing_size:
            scale = min(max_processing_size / width, max_processing_size / height)
            new_width = int(width * scale)
            new_height = int(height * scale)
            logger.info(f"Downscaling image from {width}x{height} to {new_width}x{new_height} to save memory")
            image = image.resize((new_width, new_height), Image.LANCZOS)
            width, height = new_width, new_height
        
        try:
            from PIL import ExifTags
            exif = image._getexif()
            if exif is not None:
                for tag_id, value in exif.items():
                    decoded = ExifTags.TAGS.get(tag_id, tag_id)
                    if decoded == 'Orientation':
                        if value == 3:
                            image = image.rotate(180, expand=True)
                        elif value == 6:
                            image = image.rotate(270, expand=True)
                        elif value == 8:
                            image = image.rotate(90, expand=True)
                        break
        except Exception as exif_error:
            logger.debug(f"EXIF orientation fix skipped: {exif_error}")
        
        if image.mode != 'RGB':
            logger.info(f"Converting image from {image.mode} to RGB")
            rgb_image = Image.new('RGB', image.size)
            if image.mode == 'RGBA':
                rgb_image.paste(image, mask=image.split()[3]) 
            else:
                rgb_image.paste(image)
            image = rgb_image
        
        min_size = 800
        if width < min_size or height < min_size:
            scale = max(min_size / width, min_size / height)
            new_width = int(width * scale)
            new_height = int(height * scale)
            logger.info(f"Upscaling image from {width}x{height} to {new_width}x{new_height}")
            image = image.resize((new_width, new_height), Image.LANCZOS)
        
        import cv2
        import numpy as np
        
        img_array = np.array(image)
        if len(img_array.shape) == 3:
            img_array = cv2.cvtColor(img_array, cv2.COLOR_RGB2BGR)
        
        img_array = cv2.bilateralFilter(img_array, 5, 50, 50)
        
        gray = cv2.cvtColor(img_array, cv2.COLOR_BGR2GRAY)
        mean_brightness = np.mean(gray)
        std_brightness = np.std(gray)
        
        logger.info(f"Image brightness: mean={mean_brightness:.1f}, std={std_brightness:.1f}")
        
        if mean_brightness < 100:  
            alpha, beta = 1.15, 10
        elif mean_brightness < 140:  
            alpha, beta = 1.1, 8
        elif mean_brightness > 200:  
            alpha, beta = 0.95, -5
        else:  
            alpha, beta = 1.0, 0
        
        gray = cv2.convertScaleAbs(gray, alpha=alpha, beta=beta)
        
        clahe = cv2.createCLAHE(clipLimit=2.0, tileGridSize=(8,8))
        gray = clahe.apply(gray)
        
        gaussian = cv2.GaussianBlur(gray, (0, 0), 1.5)
        sharpened = cv2.addWeighted(gray, 1.3, gaussian, -0.3, 0)
        
        red_enhanced = sharpened
        binary_adaptive = cv2.adaptiveThreshold(
            red_enhanced, 255, 
            cv2.ADAPTIVE_THRESH_GAUSSIAN_C, 
            cv2.THRESH_BINARY, 
            11,  
            2    
        )
        
        _, binary_otsu = cv2.threshold(red_enhanced, 0, 255, cv2.THRESH_BINARY + cv2.THRESH_OTSU)
        
        adaptive_contrast = np.std(binary_adaptive)
        otsu_contrast = np.std(binary_otsu)
        
        if otsu_contrast > adaptive_contrast * 1.05:
            binary = binary_otsu
            logger.debug("Using Otsu thresholding")
        else:
            binary = binary_adaptive
            logger.debug("Using adaptive thresholding")
        
        kernel_small = np.ones((2, 2), np.uint8)
        
        binary = cv2.morphologyEx(binary, cv2.MORPH_CLOSE, kernel_small)
        
        binary = cv2.morphologyEx(binary, cv2.MORPH_OPEN, kernel_small)
        
        processed_image = Image.fromarray(binary)
        
        max_ocr_size = 2000
        ocr_image = processed_image
        width, height = processed_image.size
        if width > max_ocr_size or height > max_ocr_size:
            scale = min(max_ocr_size / width, max_ocr_size / height)
            new_width = int(width * scale)
            new_height = int(height * scale)
            logger.info(f"Downscaling image for OCR from {width}x{height} to {new_width}x{new_height}")
            ocr_image = processed_image.resize((new_width, new_height), Image.LANCZOS)
        
        img_array_bgr = np.array(image)
        if len(img_array_bgr.shape) == 3:
            original_gray_array = cv2.cvtColor(img_array_bgr, cv2.COLOR_RGB2GRAY)
        else:
            original_gray_array = img_array_bgr
        
        images_to_try = [
            ('binary', ocr_image),
            ('original_gray', Image.fromarray(original_gray_array)),
            ('enhanced_gray', Image.fromarray(red_enhanced)),
        ]
        
        optimized_images = []
        for img_name, img in images_to_try:
            w, h = img.size
            if w > max_ocr_size or h > max_ocr_size:
                scale = min(max_ocr_size / w, max_ocr_size / h)
                new_w = int(w * scale)
                new_h = int(h * scale)
                logger.debug(f"Resizing {img_name} from {w}x{h} to {new_w}x{new_h}")
                img = img.resize((new_w, new_h), Image.LANCZOS)
            optimized_images.append((img_name, img))
        
        images_to_try = optimized_images
        
        configs = [
            '--psm 6 --oem 3',  # Единый блок текста (лучший для документов)
            '--psm 4 --oem 3',  # Одна колонка текста
            '--psm 11 --oem 3', # Разреженный текст
        ]
        
        best_text = ""
        best_confidence = 0
        best_config = None
        best_image_type = None
        
        for img_type, img_to_process in images_to_try:
            for config in configs:
                try:
                    data = pytesseract.image_to_data(
                        img_to_process, 
                        lang="eng+rus", 
                        config=config, 
                        output_type=pytesseract.Output.DICT
                    )
                    
                    text_parts = []
                    confidences = []
                    for i, conf in enumerate(data['conf']):
                        conf_int = int(conf)
                        if conf_int > 0:
                            confidences.append(conf_int)
                        if data['text'][i].strip():
                            text_parts.append(data['text'][i])
                    
                    text = ' '.join(text_parts).strip()
                    avg_confidence = sum(confidences) / len(confidences) if confidences else 0
                    
                    logger.debug(f"OCR {img_type} {config}: confidence={avg_confidence:.1f}%, text_length={len(text)}")
                    
                    score = avg_confidence * 0.7 + min(len(text) / 10, 30) 
                    current_score = best_confidence * 0.7 + min(len(best_text) / 10, 30)
                    
                    if score > current_score or (avg_confidence > best_confidence and len(text) > len(best_text) * 0.8):
                        best_confidence = avg_confidence
                        best_text = text
                        best_config = config
                        best_image_type = img_type
                        
                        if avg_confidence >= 75 and len(text) > 200:
                            logger.info(f"Excellent result ({avg_confidence:.1f}%, {len(text)} chars) with {img_type} {config}, stopping")
                            break
                    
                except Exception as e:
                    logger.warning(f"OCR {img_type} {config} failed: {e}")
                    continue
            
            if best_confidence >= 70 and len(best_text) > 200:
                break
        
        if best_config:
            logger.info(f"Best OCR: {best_image_type} {best_config} with confidence {best_confidence:.1f}%, text length {len(best_text)}")
        
        if not best_text or (best_confidence < 30 and len(best_text) < 100):  
            logger.warning(f"Very low OCR confidence ({best_confidence:.1f}%) or short text, trying single fallback")
            
            try:
                original_gray = cv2.cvtColor(np.array(image), cv2.COLOR_RGB2GRAY)
                original_processed = cv2.medianBlur(original_gray, 3)
                original_image = Image.fromarray(original_processed)
                
                orig_width, orig_height = original_image.size
                if orig_width > max_ocr_size or orig_height > max_ocr_size:
                    scale = min(max_ocr_size / orig_width, max_ocr_size / orig_height)
                    new_width = int(orig_width * scale)
                    new_height = int(orig_height * scale)
                    original_image = original_image.resize((new_width, new_height), Image.LANCZOS)
                
                fallback_data = pytesseract.image_to_data(
                    original_image, 
                    lang="eng+rus", 
                    config='--psm 6 --oem 3',
                    output_type=pytesseract.Output.DICT
                )
                
                fallback_text_parts = []
                fallback_confidences = []
                for i, conf in enumerate(fallback_data['conf']):
                    conf_int = int(conf)
                    if conf_int > 0:
                        fallback_confidences.append(conf_int)
                    if fallback_data['text'][i].strip():
                        fallback_text_parts.append(fallback_data['text'][i])
                
                fallback_text = ' '.join(fallback_text_parts).strip()
                fallback_confidence = sum(fallback_confidences) / len(fallback_confidences) if fallback_confidences else 0
                
                if fallback_text and (len(fallback_text) > len(best_text) or fallback_confidence > best_confidence):
                    best_text = fallback_text
                    best_confidence = fallback_confidence
                    logger.info(f"Fallback method improved: confidence={fallback_confidence:.1f}%, text_length={len(best_text)}")
            except Exception as e:
                logger.debug(f"Fallback method failed: {e}")
        
        ocr_text = best_text
        logger.info(f"OCR extracted text (confidence: {best_confidence:.1f}%): {ocr_text[:300]}...")
        
        import re
        vin_patterns = [
            r'[A-HJ-NPR-Z0-9]{17}',  # Стандартный VIN (без I, O, Q)
            r'[A-Z0-9]{17}',  # С возможными ошибками OCR
        ]
        
        potential_vins = []
        for pattern in vin_patterns:
            matches = re.findall(pattern, ocr_text.upper())
            for match in matches:
                if len(set(match)) > 5 and match not in potential_vins:
                    potential_vins.append(match)
                    logger.info(f"Found potential VIN in OCR text: {match}")
        
        if potential_vins:
            ocr_text = f"НАЙДЕННЫЕ ПОТЕНЦИАЛЬНЫЕ VIN (возможно с ошибками OCR): {', '.join(potential_vins)}\n\n" + ocr_text
        
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