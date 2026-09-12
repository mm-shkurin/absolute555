"""Идентификационный номер по двум чтениям.

Зрение и посимвольный читатель смотрят один документ и отвечают порознь. Правило,
которое их мирит, решает, что увидит продавец: подтверждённый номер, спорный номер с
просьбой сверить или пустое поле. Ошибка здесь тихая — номер выглядит прочитанным.
"""

import pytest

from app.ml.sts_reader import CHAR_READER, combine_number
from app.ml.vin_shape import NumberKind

VIN = "JTMHV05J204123456"
OTHER_VIN = "JTMHV05J204999999"
BODY = "GB6-1000952"


def test_should_accept_a_number_both_readers_agree_on():
    combined = combine_number(VIN, VIN)

    assert combined == {"value": VIN, "kind": NumberKind.VIN, "agreed": True, "source": "both"}


def test_should_ignore_the_difference_between_latin_and_cyrillic_twins():
    # ОCR читает Х, М, С и О русскими буквами: на глаз тот же номер, для строк — другой.
    cyrillic = VIN.replace("H", "Н").replace("M", "М")

    combined = combine_number(VIN, cyrillic)

    assert combined["agreed"] is True
    assert combined["value"] == VIN


def test_should_ask_the_seller_when_the_readers_disagree():
    combined = combine_number(VIN, OTHER_VIN)

    assert combined["value"] == VIN, "на настоящих кадрах точнее оказывалось зрение"
    assert combined["agreed"] is False
    assert combined["source"] == "vision"


def test_should_take_the_only_reading_there_is():
    assert combine_number(VIN, "мусор со строки бланка") == {
        "value": VIN,
        "kind": NumberKind.VIN,
        "agreed": False,
        "source": "vision",
    }


def test_should_fall_back_to_the_character_reader():
    combined = combine_number("не разобрал", VIN)

    assert combined["value"] == VIN
    assert combined["source"] == CHAR_READER
    assert combined["agreed"] is False


def test_should_trust_vision_alone_about_a_body_number():
    # Второму читателю тут спорить нечем: в сплошном тексте номер кузова неотличим от
    # серии бланка, и он предлагал именно её.
    combined = combine_number(BODY, "77 УА 123456")

    assert combined["value"] == BODY
    assert combined["kind"] is NumberKind.BODY
    assert combined["source"] == "vision"
    assert combined["agreed"] is True


def test_should_mark_a_body_number_unconfirmed_when_the_other_reader_saw_a_number():
    combined = combine_number(BODY, VIN)

    assert combined["kind"] is NumberKind.BODY
    assert combined["agreed"] is False


@pytest.mark.parametrize("written", ["ОТСУТСТВУЕТ", "отсутсвует", "НЕТ", "-", "none"])
def test_should_read_an_explicit_absence_as_a_fact(written):
    combined = combine_number(written, "")

    assert combined == {"value": None, "kind": NumberKind.ABSENT, "agreed": True, "source": "vision"}


@pytest.mark.parametrize("pair", [("", ""), (None, None), ("мусор", "тоже мусор")])
def test_should_admit_it_read_nothing(pair):
    combined = combine_number(*pair)

    assert combined == {
        "value": None,
        "kind": NumberKind.UNREADABLE,
        "agreed": False,
        "source": None,
    }
