"""Turning a photo of a СТС into images tesseract can read.

Three candidates come out rather than one: binarisation helps a clean scan and hurts a
dim phone photo, so the OCR pass tries all three and keeps whichever reads best.
"""

from io import BytesIO

import cv2
import numpy as np
from PIL import ExifTags, Image
from loguru import logger

from app.core.config_ml import get_recognition_settings

_recognition = get_recognition_settings()
MAX_PROCESSING_SIZE = _recognition.sts_max_processing_px
MAX_OCR_SIZE = _recognition.sts_max_ocr_px
MIN_SIZE = _recognition.sts_min_px

_EXIF_ROTATION = {3: 180, 6: 270, 8: 90}


def prepare_candidates(file_bytes: bytes) -> tuple:
    """The normalised photo and the images to run OCR over, as (name, image) pairs.

    The photo itself comes back too: the OCR fallback re-reads it from scratch when every
    prepared candidate reads badly.
    """
    image = Image.open(BytesIO(file_bytes))
    logger.info("Original image size: {}x{}", image.size[0], image.size[1])
    image, width, height = _downscale_for_processing(image)
    image = _to_rgb(_apply_exif_orientation(image))
    # Deliberately the pre-rotation size: the upscale check has always used it.
    image = _upscale_if_small(image, width, height)

    enhanced = _enhanced_gray(image)
    ocr_image = _fit_for_ocr(Image.fromarray(_binarize(enhanced)), "binary", info=True)

    images_to_try = [
        ('binary', ocr_image),
        ('original_gray', Image.fromarray(_original_gray(image))),
        ('enhanced_gray', Image.fromarray(enhanced)),
    ]
    return image, [(name, _fit_for_ocr(img, name)) for name, img in images_to_try]


def _downscale_for_processing(image):
    width, height = image.size
    if width > MAX_PROCESSING_SIZE or height > MAX_PROCESSING_SIZE:
        scale = min(MAX_PROCESSING_SIZE / width, MAX_PROCESSING_SIZE / height)
        new_width, new_height = int(width * scale), int(height * scale)
        logger.info("Downscaling image from {}x{} to {}x{} to save memory", width, height, new_width, new_height)
        image = image.resize((new_width, new_height), Image.LANCZOS)
        width, height = new_width, new_height
    return image, width, height


def _apply_exif_orientation(image):
    try:
        exif = image._getexif()
        if exif is not None:
            for tag_id, value in exif.items():
                if ExifTags.TAGS.get(tag_id, tag_id) == 'Orientation':
                    if value in _EXIF_ROTATION:
                        image = image.rotate(_EXIF_ROTATION[value], expand=True)
                    break
    except (AttributeError, KeyError, TypeError, ValueError, OSError) as exif_error:
        logger.debug("EXIF orientation fix skipped: {}", exif_error)
    return image


def _to_rgb(image):
    if image.mode == 'RGB':
        return image
    logger.info("Converting image from {} to RGB", image.mode)
    rgb_image = Image.new('RGB', image.size)
    if image.mode == 'RGBA':
        rgb_image.paste(image, mask=image.split()[3])
    else:
        rgb_image.paste(image)
    return rgb_image


def _upscale_if_small(image, width, height):
    if width < MIN_SIZE or height < MIN_SIZE:
        scale = max(MIN_SIZE / width, MIN_SIZE / height)
        new_width, new_height = int(width * scale), int(height * scale)
        logger.info("Upscaling image from {}x{} to {}x{}", width, height, new_width, new_height)
        image = image.resize((new_width, new_height), Image.LANCZOS)
    return image


def _brightness_correction(mean_brightness) -> tuple:
    if mean_brightness < 100:
        return 1.15, 10
    if mean_brightness < 140:
        return 1.1, 8
    if mean_brightness > 200:
        return 0.95, -5
    return 1.0, 0


def _enhanced_gray(image):
    """Denoised, brightness-corrected, contrast-equalised and sharpened grayscale."""
    img_array = np.array(image)
    if len(img_array.shape) == 3:
        img_array = cv2.cvtColor(img_array, cv2.COLOR_RGB2BGR)
    img_array = cv2.bilateralFilter(img_array, 5, 50, 50)

    gray = cv2.cvtColor(img_array, cv2.COLOR_BGR2GRAY)
    mean_brightness, std_brightness = np.mean(gray), np.std(gray)
    logger.info("Image brightness: mean={:.1f}, std={:.1f}", mean_brightness, std_brightness)
    alpha, beta = _brightness_correction(mean_brightness)
    gray = cv2.convertScaleAbs(gray, alpha=alpha, beta=beta)

    gray = cv2.createCLAHE(clipLimit=2.0, tileGridSize=(8, 8)).apply(gray)
    gaussian = cv2.GaussianBlur(gray, (0, 0), 1.5)
    return cv2.addWeighted(gray, 1.3, gaussian, -0.3, 0)


def _binarize(gray):
    """Otsu or adaptive threshold, whichever gives more contrast, then cleaned up."""
    binary_adaptive = cv2.adaptiveThreshold(
        gray, 255, cv2.ADAPTIVE_THRESH_GAUSSIAN_C, cv2.THRESH_BINARY, 11, 2
    )
    _, binary_otsu = cv2.threshold(gray, 0, 255, cv2.THRESH_BINARY + cv2.THRESH_OTSU)

    if np.std(binary_otsu) > np.std(binary_adaptive) * 1.05:
        binary = binary_otsu
        logger.debug("Using Otsu thresholding")
    else:
        binary = binary_adaptive
        logger.debug("Using adaptive thresholding")

    kernel_small = np.ones((2, 2), np.uint8)
    binary = cv2.morphologyEx(binary, cv2.MORPH_CLOSE, kernel_small)
    return cv2.morphologyEx(binary, cv2.MORPH_OPEN, kernel_small)


def _original_gray(image):
    img_array = np.array(image)
    if len(img_array.shape) == 3:
        return cv2.cvtColor(img_array, cv2.COLOR_RGB2GRAY)
    return img_array


def _fit_for_ocr(img, name: str, info: bool = False):
    w, h = img.size
    if w > MAX_OCR_SIZE or h > MAX_OCR_SIZE:
        scale = min(MAX_OCR_SIZE / w, MAX_OCR_SIZE / h)
        new_w, new_h = int(w * scale), int(h * scale)
        if info:
            logger.info("Downscaling image for OCR from {}x{} to {}x{}", w, h, new_w, new_h)
        else:
            logger.debug("Resizing {} from {}x{} to {}x{}", name, w, h, new_w, new_h)
        img = img.resize((new_w, new_h), Image.LANCZOS)
    return img
