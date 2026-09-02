"""Turning a photo of a СТС into images tesseract can read.

Lifted out of decode_vin.py when that file passed the 200-line limit. Three candidates
come out rather than one: binarisation helps a clean scan and hurts a dim phone photo,
so the OCR pass tries all three and keeps whichever reads best.
"""

from io import BytesIO

import cv2
import numpy as np
from PIL import ExifTags, Image
from loguru import logger

MAX_PROCESSING_SIZE = 2500
MAX_OCR_SIZE = 2000
MIN_SIZE = 800


def prepare_candidates(file_bytes: bytes) -> tuple:
    """The normalised photo and the images to run OCR over, as (name, image) pairs.

    The photo itself comes back too: the OCR fallback re-reads it from scratch when every
    prepared candidate reads badly.
    """
    image = Image.open(BytesIO(file_bytes))

    width, height = image.size
    logger.info(f"Original image size: {width}x{height}")

    max_processing_size = MAX_PROCESSING_SIZE
    if width > max_processing_size or height > max_processing_size:
        scale = min(max_processing_size / width, max_processing_size / height)
        new_width = int(width * scale)
        new_height = int(height * scale)
        logger.info(f"Downscaling image from {width}x{height} to {new_width}x{new_height} to save memory")
        image = image.resize((new_width, new_height), Image.LANCZOS)
        width, height = new_width, new_height

    try:
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

    min_size = MIN_SIZE
    if width < min_size or height < min_size:
        scale = max(min_size / width, min_size / height)
        new_width = int(width * scale)
        new_height = int(height * scale)
        logger.info(f"Upscaling image from {width}x{height} to {new_width}x{new_height}")
        image = image.resize((new_width, new_height), Image.LANCZOS)

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

    max_ocr_size = MAX_OCR_SIZE
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

    return image, optimized_images
