"""Reading a СТС with tesseract, and picking the best reading.

Lifted out of decode_vin.py when that file passed the 200-line limit. Every candidate
image is tried against every page-segmentation mode and scored on confidence and length
together: a high-confidence reading of four words is worse than a slightly less certain
reading of the whole document.
"""

import re

import cv2
import numpy as np
import pytesseract
from PIL import Image
from loguru import logger

from app.ml.sts_image import MAX_OCR_SIZE

VIN_PATTERNS = [
    r"[A-HJ-NPR-Z0-9]{17}",  # Стандартный VIN (без I, O, Q)
    r"[A-Z0-9]{17}",  # С возможными ошибками OCR
]


def read_text(image, images_to_try: list) -> str:
    """The best text tesseract can get out of these candidates, VIN candidates first."""
    max_ocr_size = MAX_OCR_SIZE

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

    potential_vins = []
    for pattern in VIN_PATTERNS:
        matches = re.findall(pattern, ocr_text.upper())
        for match in matches:
            if len(set(match)) > 5 and match not in potential_vins:
                potential_vins.append(match)
                logger.info(f"Found potential VIN in OCR text: {match}")

    if potential_vins:
        found = ", ".join(potential_vins)
        ocr_text = (
            f"НАЙДЕННЫЕ ПОТЕНЦИАЛЬНЫЕ VIN (возможно с ошибками OCR): {found}\n\n" + ocr_text
        )

    return ocr_text
