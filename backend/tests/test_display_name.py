"""Как называется человек в консоли модератора.

Разбор правок 2026-09-05: список людей показывал «Неизвестный пользователь» на всех
без исключения, включая тех, у кого имя в профиле провайдера есть. Причина — форма
хранения: вход через Яндекс складывал ответ `json.dumps`, и в JSONB попадала строка,
а чтение ждало словарь.
"""

import json

import pytest

from app.features.account.models.users import Users


def _person(**fields) -> Users:
    return Users(**fields)


def test_should_read_a_profile_stored_as_a_string():
    """Так лежат все записи, заведённые до этой правки."""
    raw = json.dumps({"real_name": "absolute support", "login": "absolutesup555"})

    assert _person(yandex_json=raw).display_name == "absolute support"


def test_should_read_a_profile_stored_as_an_object():
    assert _person(yandex_json={"real_name": "Михаил Шкурин"}).display_name == "Михаил Шкурин"


def test_should_prefer_the_name_the_person_chose():
    person = _person(profile_name="Пётр К.", yandex_json={"real_name": "Пётр Кузнецов"})

    assert person.display_name == "Пётр К."


@pytest.mark.parametrize(
    "profile,expected",
    [
        ({"real_name": "Иван Петров"}, "Иван Петров"),
        ({"display_name": "ivan2000"}, "ivan2000"),
        ({"first_name": "Иван", "last_name": "Петров"}, "Иван Петров"),
        # Логин — последнее, чем стоит называть человека, и всё же лучше пустоты.
        ({"login": "ivan-p"}, "ivan-p"),
    ],
)
def test_should_take_the_most_human_name_the_provider_gave(profile, expected):
    assert _person(yandex_json=profile).display_name == expected


def test_should_call_a_guest_a_guest():
    """«Неизвестный» читается как сбой чтения, а не как способ входа."""
    assert _person(is_guest=True).display_name == "Гость"


def test_should_say_plainly_when_a_signed_in_person_has_no_name():
    assert _person(is_guest=False, yandex_json='"не json"').display_name == "Без имени"
