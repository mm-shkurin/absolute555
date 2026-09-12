"""Подготовка снимка СТС к чтению.

Настоящий документ здесь не нужен: функция не понимает, что на кадре, — она приводит
любой кадр к тому, что переваривает распознавание. Проверяется именно это: гигантский
снимок с телефона ужимается, крошечный растягивается, прозрачность и оттенки серого
становятся RGB, повёрнутый по EXIF кадр разворачивается, а на выходе всегда три
кандидата, каждый в пределах потолка для распознавания.
"""

import io

import pytest
from PIL import Image

from app.ml.sts_image import MAX_OCR_SIZE, MAX_PROCESSING_SIZE, MIN_SIZE, prepare_candidates

CANDIDATES = ("binary", "original_gray", "enhanced_gray")


def _bytes(image: Image.Image, fmt="PNG", **save) -> bytes:
    buffer = io.BytesIO()
    image.save(buffer, format=fmt, **save)
    return buffer.getvalue()


def _photo(width=1200, height=900, mode="RGB", colour=(200, 200, 195)) -> bytes:
    image = Image.new(mode, (width, height), colour if mode != "L" else 200)
    return _bytes(image)


def test_should_hand_back_three_candidates_to_read():
    _, candidates = prepare_candidates(_photo())

    assert [name for name, _ in candidates] == list(CANDIDATES)


def test_should_keep_every_candidate_within_the_reading_ceiling():
    _, candidates = prepare_candidates(_photo(3000, 2200))

    for name, image in candidates:
        assert max(image.size) <= MAX_OCR_SIZE, name


def test_should_shrink_a_photograph_from_a_modern_phone():
    photo, _ = prepare_candidates(_photo(4000, 3000))

    # Иначе один снимок держит в памяти сотню мегабайт на каждом воркере.
    assert max(photo.size) <= MAX_PROCESSING_SIZE


def test_should_stretch_a_thumbnail_up_to_a_readable_size():
    photo, _ = prepare_candidates(_photo(300, 200))

    assert max(photo.size) >= MIN_SIZE


def test_should_leave_a_photograph_of_ordinary_size_alone():
    photo, _ = prepare_candidates(_photo(1200, 900))

    assert photo.size == (1200, 900)


@pytest.mark.parametrize("mode", ["RGB", "RGBA", "L", "P"])
def test_should_accept_every_shape_of_pixel(mode):
    image = Image.new(mode, (900, 900), 128 if mode in ("L", "P") else (128, 128, 128))
    photo, candidates = prepare_candidates(_bytes(image))

    assert photo.mode == "RGB"
    assert len(candidates) == 3


def test_should_turn_a_photograph_shot_sideways_upright():
    upright = Image.new("RGB", (1200, 800), (210, 210, 205))
    # 274 — тег ориентации, 6 — «снято боком», как пишет камера телефона.
    exif = Image.Exif()
    exif[274] = 6
    sideways = _bytes(upright, fmt="JPEG", exif=exif)

    photo, _ = prepare_candidates(sideways)

    assert photo.size == (800, 1200)


def test_should_read_a_photograph_that_carries_no_exif_at_all():
    photo, candidates = prepare_candidates(_photo())

    assert photo.size == (1200, 900)
    assert candidates


@pytest.mark.parametrize("brightness", [30, 120, 170, 240])
def test_should_take_a_document_shot_in_any_light(brightness):
    # 900x900, а не 900x700: сторона короче восьмисот попадает под растягивание, и тест
    # мерил бы его, а не свет.
    dim = Image.new("RGB", (900, 900), (brightness, brightness, brightness))

    photo, candidates = prepare_candidates(_bytes(dim))

    assert photo.size == (900, 900)
    assert len(candidates) == 3


def test_should_refuse_bytes_that_are_not_a_picture():
    with pytest.raises(Exception):
        prepare_candidates("это не изображение".encode("utf-8"))
