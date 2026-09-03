"""Как система читает СТС зрением модели и чего она не делает.

Сеть здесь не трогается: провайдер подменяется, потому что проверяется не качество
чтения — оно меряется на корпусе картинок отдельно, — а поведение вокруг ответа. Ровно
это ломалось молча: модель отвечала текстом вместо JSON, писала «неизвестно» вместо
пустоты, возвращала VIN из шестнадцати символов, — и всё это доезжало до объявления как
распознанные данные.
"""

import pytest

from app.ml import sts_vision
from app.ml.decode_vin import decode_vin
from app.ml.model_answer import parse_answer
from app.ml.sts_vision import VisionUnavailable, read_sts, valid_vin

ANSWER = """{"plate": "Т432ЕС55", "vin": "XW8ZZZ61ZJG012345", "mark": "TOYOTA",
"model": "CAMRY", "year": "2018", "power": "181", "body": "СЕДАН", "color": "ЧЕРНЫЙ"}"""


@pytest.fixture
def provider(monkeypatch):
    """Подменённый провайдер: тест решает, что «увидела» модель."""

    def _use(content: str):
        monkeypatch.setattr(sts_vision, "access_token", lambda settings: "test-token")
        monkeypatch.setattr(sts_vision, "_upload", lambda api, access, body: "file-1")
        monkeypatch.setattr(sts_vision, "_ask", lambda api, access, file_id: content)

    return _use


def test_should_read_the_fields_of_the_document(provider):
    provider(ANSWER)

    fields = read_sts(b"picture")

    assert fields["vin"] == "XW8ZZZ61ZJG012345"
    assert fields["mark"] == "TOYOTA"
    assert fields["model"] == "CAMRY"
    assert fields["year"] == "2018"
    assert fields["power"] == "181"


def test_should_survive_an_answer_wrapped_in_prose(provider):
    """Модель периодически предваряет JSON фразой. Это не повод потерять чтение."""
    provider('Вот что удалось прочитать:\n```json\n' + ANSWER + '\n```\nГотово.')

    assert read_sts(b"picture")["vin"] == "XW8ZZZ61ZJG012345"


def test_should_leave_a_field_empty_rather_than_guess(provider):
    """Слова вместо значения — это пустое поле, а не значение «неизвестно»."""
    provider('{"vin": null, "mark": "KIA", "model": "RIO", "year": "неизвестно", "power": "-"}')

    fields = read_sts(b"picture")

    assert fields["year"] is None
    assert fields["power"] is None
    assert fields["mark"] == "KIA"


@pytest.mark.parametrize("number", ["XW8ZZZ61ZJ012345", "XW8ZZZ61ZJO012345"])
def test_should_hand_a_number_that_is_not_a_vin_on_for_classification(provider, number):
    """Шестнадцать символов и буква O — не VIN, но и не обязательно мусор.

    Обнулять такую строку здесь нельзя: у праворульной японской машины в этой же строке
    стоит номер кузова. Что это за номер, решает vin_shape.classify, а до объявления
    непроверенный VIN не доходит — за это отвечает спор двух читателей в sts_reader.
    """
    provider('{"vin": "%s", "mark": "TOYOTA", "model": "CAMRY"}' % number)

    assert read_sts(b"picture")["vin"] == number
    assert not valid_vin(number)


def test_should_answer_empty_fields_when_the_model_returns_prose(provider):
    provider("Не могу разобрать документ на фотографии.")

    fields = read_sts(b"picture")

    assert set(fields) == set(sts_vision.FIELDS)
    assert all(value is None for value in fields.values())


def test_should_report_an_unavailable_provider(monkeypatch):
    def _fail(settings):
        raise ConnectionError("connection reset")

    monkeypatch.setattr(sts_vision, "access_token", _fail)

    with pytest.raises(VisionUnavailable):
        read_sts(b"picture")


@pytest.mark.parametrize(
    "value,expected",
    [
        ("XW8ZZZ61ZJG012345", True),
        ("xw8zzz61zjg012345", True),
        ("XW8ZZZ61ZJ012345", False),
        ("XW8ZZZ61ZJGO12345", False),
        ("", False),
        (None, False),
    ],
)
def test_should_judge_the_shape_of_a_vin(value, expected):
    assert valid_vin(value) is expected


def test_should_treat_a_missing_json_as_nothing_read():
    assert parse_answer("", sts_vision.FIELDS) == {name: None for name in sts_vision.FIELDS}


@pytest.mark.asyncio
async def test_should_hand_the_task_the_fields_it_writes(monkeypatch):
    monkeypatch.setattr(
        "app.ml.decode_vin.read_sts",
        lambda body: {
            "vin": "XW8ZZZ61ZJG012345",
            "mark": "TOYOTA",
            "model": "CAMRY",
            "year": "2018",
            "power": "181",
            "plate": "Т432ЕС55",
            "body": "СЕДАН",
            "color": "ЧЕРНЫЙ",
        },
    )

    decoded = await decode_vin(b"picture")

    assert decoded["vin"] == "XW8ZZZ61ZJG012345"
    assert decoded["engine_power"] == "181"
    # Коробки в СТС нет вовсе. Прежний промпт её угадывал по модели автомобиля, и
    # угаданное приезжало в объявление как прочитанное из документа.
    assert decoded["transmission"] is None


@pytest.mark.asyncio
async def test_should_refuse_a_call_without_a_picture():
    assert (await decode_vin(b""))["error"] == "file_bytes is required"


@pytest.mark.asyncio
async def test_should_say_when_the_document_was_not_recognised(monkeypatch):
    monkeypatch.setattr(
        "app.ml.decode_vin.read_sts",
        lambda body: {name: None for name in sts_vision.FIELDS},
    )

    decoded = await decode_vin(b"picture")

    assert decoded["error"] == "VIN not found"


@pytest.mark.asyncio
async def test_should_separate_a_dead_provider_from_an_unreadable_photograph(monkeypatch):
    """Продавцу это разные советы: переснять кадр или подождать."""

    def _unavailable(body):
        raise VisionUnavailable("connection reset")

    monkeypatch.setattr("app.ml.decode_vin.read_sts", _unavailable)

    assert (await decode_vin(b"picture"))["error"] == "vision_unavailable"
