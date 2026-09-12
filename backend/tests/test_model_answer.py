"""Ответ языковой модели, разобранный в поля.

Один разбор на двух читателей — зрение по СТС и расшифровку VIN, — поэтому его правила
проверяются здесь, а не дважды в тестах читателей. Главное правило: непонятое — это
пусто, а не догадка, потому что догадка приезжает в объявление как распознанное.
"""

import pytest

from app.ml.model_answer import clean, parse_answer

FIELDS = ("mark", "model", "year")


def test_should_take_the_named_fields_out_of_a_clean_answer():
    answer = '{"mark": "Toyota", "model": "Camry", "year": "2012"}'

    assert parse_answer(answer, FIELDS) == {"mark": "Toyota", "model": "Camry", "year": "2012"}


def test_should_find_the_json_inside_a_chatty_answer():
    answer = 'Конечно! Вот результат:\n{"mark": "Kia", "model": "Rio", "year": null}\nГотово.'

    assert parse_answer(answer, FIELDS)["mark"] == "Kia"
    assert parse_answer(answer, FIELDS)["year"] is None


def test_should_ignore_fields_nobody_asked_for():
    answer = '{"mark": "Kia", "model": "Rio", "year": "2015", "colour": "белый"}'

    assert set(parse_answer(answer, FIELDS)) == set(FIELDS)


def test_should_leave_a_field_the_model_forgot_empty():
    assert parse_answer('{"mark": "Kia"}', FIELDS) == {"mark": "Kia", "model": None, "year": None}


@pytest.mark.parametrize("answer", ["", None, "нет данных", "{не json}", "{'mark': 'Kia'}"])
def test_should_answer_all_empty_when_there_is_no_usable_json(answer):
    assert parse_answer(answer, FIELDS) == dict.fromkeys(FIELDS)


@pytest.mark.parametrize(
    "written", ["null", "None", "-", "не указано", "НЕИЗВЕСТНО", "n/a", "", "   "]
)
def test_should_read_nothing_as_nothing(written):
    assert clean(written) is None


def test_should_trim_what_the_model_padded():
    assert clean("  Toyota \n") == "Toyota"


def test_should_keep_a_number_as_the_text_it_came_as():
    assert clean(2012) == "2012"
    assert clean(0) == "0"
