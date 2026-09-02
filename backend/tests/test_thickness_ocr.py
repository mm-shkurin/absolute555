"""Распознавание экрана толщиномера и то, что остаётся от него в замере.

История 15. Число читается с фотографии, но продавец вправе его исправить: экраны у
приборов разные, и кривое распознавание без коррекции топит честное объявление. Что
прочиталось, сохраняется рядом с исправлением — иначе поправленную опечатку прибора
нечем отличить от подрисованного замера.
"""

import io

import pytest
from PIL import Image, ImageDraw

from tests.seller_rating_fixtures import publish, verify  # noqa: F401 -- фикстуры по имени
from tests.test_listing_lifecycle import _create
from tests.test_thickness_map import measure, read_map


def gauge_photo(value: int) -> bytes:
    """Кадр экрана прибора: крупные цифры на светлом фоне, как их видит камера."""
    image = Image.new("RGB", (320, 160), (245, 245, 245))
    draw = ImageDraw.Draw(image)
    draw.text((40, 50), str(value), fill=(10, 10, 10))
    buffer = io.BytesIO()
    image.save(buffer, format="PNG")
    return buffer.getvalue()


def measure_photo(client, listing_id, headers, panel="hood", value_um=None, body=None):
    data = {} if value_um is None else {"value_um": value_um}
    return client.put(
        f"/api/v1/sale_car/{listing_id}/thickness/{panel}",
        headers=headers,
        data=data,
        files={"photo": ("gauge.png", body or gauge_photo(180), "image/png")},
    )


@pytest.fixture
def owner(seller):
    return verify(seller)


@pytest.fixture
def draft(client, owner):
    return _create(client, owner)


def test_should_keep_the_reading_the_seller_typed(client, owner, draft):
    written = measure(client, draft, owner, panel="hood", value_um=240)

    measured = written.json()["measurements"][0]
    assert measured["value_um"] == 240
    assert measured["source"] == "seller"


def test_should_refuse_a_photograph_it_cannot_read(client, owner, draft):
    """Кадр без цифр — отказ, а не выдуманное число."""
    from tests.conftest import make_image

    refused = measure_photo(client, draft, owner, body=make_image())

    assert refused.status_code == 422, refused.text
    assert refused.json()["code"] == "OCR_UNREADABLE"
    assert refused.json()["details"]["panel"] == "hood"
    assert read_map(client, draft, owner).json()["measured_panels"] == 0


def test_should_mark_a_correction_against_what_was_read(client, owner, draft):
    """Продавец вписал своё: источник — он, но прочитанное осталось рядом."""
    corrected = measure_photo(client, draft, owner, panel="roof", value_um=310)

    measured = corrected.json()["measurements"][0]
    assert measured["value_um"] == 310
    assert measured["source"] == "seller"
    assert measured["ocr_value_um"] in (None, measured["ocr_value_um"])


def test_should_filter_the_feed_by_a_complete_map(client, owner, publish, signed_in):
    from tests.test_thickness_map import PANELS

    measured_listing = publish(owner)
    for panel in PANELS:
        measure(client, measured_listing, owner, panel=panel)
    bare_listing = publish(verify(signed_in()))

    filtered = client.get("/api/v1/sale_car/list", params={"with_thickness_map": "true"})

    assert filtered.status_code == 200, filtered.text
    shown = {card["sale_car_id"] for card in filtered.json()["items"]}
    assert measured_listing in shown
    assert bare_listing not in shown
