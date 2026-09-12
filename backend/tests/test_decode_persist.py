"""Запись распознанного на объявление.

Читалка возвращает пустые строки и «2018 г.» чаще, чем хотелось бы: перетереть ими поле,
которое продавец уже поправил руками, — это регрессия, которую он заметит первым. Марка
и модель здесь не пишутся намеренно: объявление хранит ключи справочника, а не имена.
"""

from app.features.listing.models.sale_car import SaleCars
from app.tasks.decode_persist import apply_decoded

READING = {
    "vin": "JTMHV05J204123456",
    "year": 2012,
    "engine_power": 249,
    "transmission": "автомат",
}


def _listing(**fields) -> SaleCars:
    listing = SaleCars()
    for name, value in fields.items():
        setattr(listing, name, value)
    return listing


def test_should_copy_a_complete_reading():
    listing = _listing()

    apply_decoded(listing, READING)

    assert listing.vin == READING["vin"]
    assert listing.year == 2012
    assert listing.engine_power == 249
    assert listing.transmission == "автомат"


def test_should_keep_a_body_number_of_its_own():
    listing = _listing()

    apply_decoded(listing, {"body_number": "GB6-1000952"})

    assert listing.body_number == "GB6-1000952"
    assert listing.vin is None


def test_should_not_overwrite_what_the_seller_typed_with_emptiness():
    listing = _listing(vin="JTMHV05J204123456", transmission="механика", year=2011)

    apply_decoded(listing, {"vin": "", "transmission": None, "year": ""})

    assert listing.vin == "JTMHV05J204123456"
    assert listing.transmission == "механика"
    assert listing.year == 2011


def test_should_take_a_number_that_arrived_as_a_string():
    listing = _listing()

    apply_decoded(listing, {"year": "2018", "engine_power": "150"})

    assert listing.year == 2018
    assert listing.engine_power == 150


def test_should_survive_a_number_that_is_not_one():
    listing = _listing(year=2011)

    apply_decoded(listing, {"year": "2018 г.", "engine_power": "около 150"})

    # Задача не падает после дорогой части: непрочитанное поле остаётся прежним.
    assert listing.year == 2011
    assert listing.engine_power is None


def test_should_leave_make_and_model_to_the_catalogue():
    listing = _listing()

    apply_decoded(listing, {"mark": "Toyota", "model": "Land Cruiser"})

    assert getattr(listing, "brand_id", None) is None
    assert getattr(listing, "model_id", None) is None


def test_should_do_nothing_with_an_empty_reading():
    listing = _listing(vin="JTMHV05J204123456")

    apply_decoded(listing, {})

    assert listing.vin == "JTMHV05J204123456"
