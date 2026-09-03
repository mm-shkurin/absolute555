"""Разбор распознанного СТС: что задача пишет на объявление и как называет провал.

Задача 5 бэклога. Модуль был покрыт на 20%: единственный тест дотягивался до него через
HTTP, а разбор ответа модели — самое хрупкое, что в нём есть. Здесь он проверяется без
очереди и без S3, потому что и то и другое к правилам разбора отношения не имеет.
"""

import pytest

from app.features.listing.models.sale_car import SaleCars
from app.tasks.decode_vin import apply_decoded, failed_at
from app.tasks.status_updater import TaskStatus


@pytest.mark.parametrize(
    "error, expected",
    [
        ("ocr_failed", TaskStatus.OcrFailed),
        ("file_bytes is required", TaskStatus.OcrFailed),
        ("model returned nonsense", TaskStatus.DecodeFailed),
        (None, TaskStatus.DecodeFailed),
    ],
)
def test_should_tell_a_failed_reading_from_a_failed_decoding(error, expected):
    """Провалы разные, потому что чинятся по-разному: один — новым снимком, другой руками."""
    assert failed_at(error) == expected


def test_should_write_what_the_reading_returned():
    listing = SaleCars()

    apply_decoded(listing, {"vin": "XTA210990", "year": 2015, "engine_power": 98, "transmission": "МКПП"})

    assert listing.vin == "XTA210990"
    assert listing.year == 2015
    assert listing.engine_power == 98
    assert listing.transmission == "МКПП"


def test_should_take_numbers_that_came_back_as_words():
    listing = SaleCars()

    apply_decoded(listing, {"year": "2015", "engine_power": "98"})

    assert listing.year == 2015
    assert listing.engine_power == 98


def test_should_keep_what_the_seller_typed_when_the_reading_is_empty():
    listing = SaleCars(vin="УЖЕ ВПИСАН", year=2010, transmission="АКПП")

    apply_decoded(listing, {"vin": "", "year": None, "transmission": ""})

    assert listing.vin == "УЖЕ ВПИСАН"
    assert listing.year == 2010
    assert listing.transmission == "АКПП"


def test_should_survive_a_number_that_is_not_one():
    """«2018 г.» не должно убивать задачу после того, как дорогая часть уже прошла."""
    listing = SaleCars(year=2010)

    apply_decoded(listing, {"year": "2018 г.", "engine_power": "сто"})

    assert listing.year == 2010
    assert listing.engine_power is None


def test_should_leave_the_catalogue_fields_to_the_resolver():
    """Марка и модель — имена, а объявление хранит ключи справочника."""
    listing = SaleCars()

    apply_decoded(listing, {"mark": "Тойота", "model": "Королла"})

    assert listing.brand_id is None
    assert listing.model_id is None
