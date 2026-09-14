"""Reading a СТС with tesseract, and picking the best reading.

Every candidate image is tried against every page-segmentation mode and scored on
confidence and length together: a high-confidence reading of four words is worse than a
slightly less certain reading of the whole document.
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

CONFIGS = [
    '--psm 6 --oem 3',  # Единый блок текста (лучший для документов)
    '--psm 4 --oem 3',  # Одна колонка текста
    '--psm 11 --oem 3',  # Разреженный текст
]


def read_text(image, images_to_try: list) -> str:
    """The best text tesseract can get out of these candidates, VIN candidates first."""
    best_text, best_confidence = _best_reading(images_to_try)
    if not best_text or (best_confidence < 30 and len(best_text) < 100):
        logger.warning(f"Very low OCR confidence ({best_confidence:.1f}%) or short text, trying single fallback")
        best_text, best_confidence = _try_fallback(image, best_text, best_confidence)

    logger.info(f"OCR extracted text (confidence: {best_confidence:.1f}%): {best_text[:300]}...")
    return _prepend_vin_candidates(best_text)


def _ocr(img, config: str) -> tuple:
    """(text, average confidence) of one tesseract pass."""
    data = pytesseract.image_to_data(
        img, lang="eng+rus", config=config, output_type=pytesseract.Output.DICT
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
    return text, sum(confidences) / len(confidences) if confidences else 0


def _score(confidence, text: str) -> float:
    return confidence * 0.7 + min(len(text) / 10, 30)


def _best_reading(images_to_try: list) -> tuple:
    best = {"text": "", "confidence": 0, "config": None, "image_type": None}
    for img_type, img in images_to_try:
        _try_configs(img_type, img, best)
        if best["confidence"] >= 70 and len(best["text"]) > 200:
            break
    if best["config"]:
        logger.info(
            f"Best OCR: {best['image_type']} {best['config']} with confidence "
            f"{best['confidence']:.1f}%, text length {len(best['text'])}"
        )
    return best["text"], best["confidence"]


def _try_configs(img_type: str, img, best: dict) -> None:
    for config in CONFIGS:
        try:
            text, confidence = _ocr(img, config)
            logger.debug(f"OCR {img_type} {config}: confidence={confidence:.1f}%, text_length={len(text)}")
            improves = _score(confidence, text) > _score(best["confidence"], best["text"])
            if improves or (confidence > best["confidence"] and len(text) > len(best["text"]) * 0.8):
                best.update(text=text, confidence=confidence, config=config, image_type=img_type)
                if confidence >= 75 and len(text) > 200:
                    logger.info(f"Excellent result ({confidence:.1f}%, {len(text)} chars) with {img_type} {config}, stopping")
                    return
        except Exception as e:
            logger.warning(f"OCR {img_type} {config} failed: {e}")


def _try_fallback(image, best_text: str, best_confidence) -> tuple:
    """Re-read the untouched photo when every prepared candidate read badly."""
    try:
        gray = cv2.medianBlur(cv2.cvtColor(np.array(image), cv2.COLOR_RGB2GRAY), 3)
        original_image = Image.fromarray(gray)
        width, height = original_image.size
        if width > MAX_OCR_SIZE or height > MAX_OCR_SIZE:
            scale = min(MAX_OCR_SIZE / width, MAX_OCR_SIZE / height)
            original_image = original_image.resize((int(width * scale), int(height * scale)), Image.LANCZOS)

        text, confidence = _ocr(original_image, '--psm 6 --oem 3')
        if text and (len(text) > len(best_text) or confidence > best_confidence):
            logger.info(f"Fallback method improved: confidence={confidence:.1f}%, text_length={len(text)}")
            return text, confidence
    except Exception as e:
        logger.debug(f"Fallback method failed: {e}")
    return best_text, best_confidence


def _prepend_vin_candidates(ocr_text: str) -> str:
    potential_vins = []
    for pattern in VIN_PATTERNS:
        for match in re.findall(pattern, ocr_text.upper()):
            if len(set(match)) > 5 and match not in potential_vins:
                potential_vins.append(match)
                logger.info(f"Found potential VIN in OCR text: {match}")
    if not potential_vins:
        return ocr_text
    found = ", ".join(potential_vins)
    return f"НАЙДЕННЫЕ ПОТЕНЦИАЛЬНЫЕ VIN (возможно с ошибками OCR): {found}\n\n" + ocr_text
