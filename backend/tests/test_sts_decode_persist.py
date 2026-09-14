"""Чтение документа доезжает до задачи и до строки объявления.

Продолжение `test_sts_hybrid.py`: там спор двух читателей номера.
"""

import pytest

from app.ml.sts_reader import read_document
from tests.test_sts_hybrid import VIN_JEEP, vision_answer


@pytest.mark.asyncio
async def test_should_hand_the_task_both_the_number_and_its_confidence(monkeypatch):
    """Со включённым подтверждением номер, на котором сошлись оба, приходит подтверждённым."""
    from app.core.config_ml import get_recognition_settings
    from app.ml.decode_vin import decode_vin

    monkeypatch.setattr(get_recognition_settings(), "confirm_number_with_ocr", True)

    monkeypatch.setattr(
        "app.ml.decode_vin.read_sts",
        lambda body: {"vin": VIN_JEEP, "mark": "JEEP", "model": "CHEROKEE", "year": "1992",
                      "power": "185", "plate": "К568ТВ55", "body_number": None,
                      "body_type": "УНИВЕРСАЛ", "color": "БЕЛЫЙ"},
    )
    monkeypatch.setattr("app.ml.decode_vin.read_number", lambda body: VIN_JEEP)

    decoded = await decode_vin(b"picture")

    assert decoded["vin"] == VIN_JEEP
    assert decoded["number_kind"] == "vin"
    assert decoded["number_agreed"] is True
    assert decoded["transmission"] is None


@pytest.mark.asyncio
async def test_should_publish_a_japanese_car_without_a_vin(monkeypatch):
    """Документ прочитан целиком, VIN в нём нет — это не «не распознано»."""
    from app.ml.decode_vin import decode_vin

    monkeypatch.setattr(
        "app.ml.decode_vin.read_sts",
        lambda body: {"vin": "ОТСУТСТВУЕТ", "mark": "HONDA", "model": "CIVIC FERIO",
                      "year": "2006", "power": None, "plate": "У271ОМ55",
                      "body_number": "ES21400840", "body_type": "СЕДАН", "color": "БЕЛЫЙ"},
    )
    monkeypatch.setattr("app.ml.decode_vin.read_number", lambda body: None)

    decoded = await decode_vin(b"picture")

    assert decoded["vin"] is None
    # Номер стоит строкой ниже — «Кузов (кабина, прицеп) №». Это номер этой машины, и
    # терять его значило бы читать документ хуже, чем он прочитан.
    assert decoded["body_number"] == "ES21400840"
    assert decoded["number_kind"] == "body"
    assert decoded["mark"] == "HONDA"
    assert "error" not in decoded


@pytest.mark.asyncio
async def test_should_read_without_the_second_opinion_by_default(monkeypatch):
    """Настройка выключена: посимвольный читатель не зовётся вовсе.

    На двенадцати настоящих свидетельствах он подтвердил один номер, один раз подсунул
    номер ПТС вместо номера машины и добавлял 20-58 секунд к каждому документу поверх
    7-18 у зрения.
    """
    from app.ml import decode_vin as module

    called = []
    monkeypatch.setattr(
        module, "read_sts", lambda body: {"vin": VIN_JEEP, "mark": "JEEP", "model": "CHEROKEE",
                                          "year": "1992", "power": None, "plate": None,
                                          "body_number": None, "body_type": None, "color": None}
    )
    monkeypatch.setattr(module, "read_number", lambda body: called.append(body) or VIN_JEEP)

    decoded = await module.decode_vin(b"picture")

    assert called == []
    assert decoded["vin"] == VIN_JEEP
    assert decoded["number_agreed"] is False


def test_should_take_the_number_from_the_body_line_when_the_vin_is_absent():
    """«ОТСУТСТВУЕТ» в строке VIN — не конец чтения: номер стоит строкой ниже.

    На настоящем свидетельстве Civic Ferio так и написано, а сама машина опознаётся
    номером кузова ES21400840.
    """
    fields = read_document(
        b"picture",
        vision=vision_answer(vin="ОТСУТСТВУЕТ", body_number="ES21400840", mark="HONDA"),
        second_opinion=None,
    )

    assert fields["vin"] is None
    assert fields["body_number"] == "ES21400840"
    assert fields["number_kind"] == "body"


def test_should_stay_empty_when_neither_line_carries_a_number():
    fields = read_document(
        b"picture",
        vision=vision_answer(vin="ОТСУТСТВУЕТ", body_number=None, mark="HONDA"),
        second_opinion=None,
    )

    assert fields["number_kind"] == "absent"
    assert fields["body_number"] is None


def test_should_write_the_body_number_onto_the_listing():
    """Прочитанный номер японской машины должен доехать до строки, а не пропасть.

    Половина документов на омском рынке праворульные: без номера кузова объявление по ним
    вышло бы без номера вовсе.
    """
    from app.features.listing.models.sale_car import SaleCars
    from app.tasks.decode_persist import apply_decoded

    listing = SaleCars()

    apply_decoded(listing, {"vin": None, "body_number": "GB6-1000952", "year": "2016"})

    assert listing.body_number == "GB6-1000952"
    assert listing.vin is None
    assert listing.year == 2016


def test_should_not_wipe_a_number_the_seller_typed():
    """Пустое чтение не затирает то, что продавец уже вписал руками."""
    from app.features.listing.models.sale_car import SaleCars
    from app.tasks.decode_persist import apply_decoded

    listing = SaleCars(vin=VIN_JEEP, body_number="RN7-3100986")

    apply_decoded(listing, {"vin": None, "body_number": None})

    assert listing.vin == VIN_JEEP
    assert listing.body_number == "RN7-3100986"
