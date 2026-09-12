"""Две задачи очереди: чтение снимка СТС и расшифровка по вписанному VIN.

Проверяется не распознавание, а последовательность статусов: продавец видит на экране
именно её, и «прочитали» вместо «не смогли» — это его решение переснять документ или
заполнить поля руками. Внешние шаги подменены, потому что предмет теста — задача, а не
хранилище и не языковая модель.
"""

import pytest

from app.ml.sts_vision import VisionUnavailable
from app.tasks import decode_by_vin, decode_vin as decode_vin_task
from app.tasks.decode_vin import failed_at
from app.tasks.status_updater import TaskStatus

VIN = "JTMHV05J204123456"
LISTING = "00000000-0000-4000-8000-000000000000"

READING = {"mark": "Toyota", "model": "Camry", "year": "2012", "power": "181", "transmission": "automatic"}


@pytest.fixture
def statuses(monkeypatch):
    """Записанные по порядку статусы вместо похода в базу и в поток."""
    recorded = []

    async def _record(entity_id, status, entity_type="sale_car"):
        recorded.append(status)

    monkeypatch.setattr(decode_by_vin, "update_task_status", _record)
    monkeypatch.setattr(decode_vin_task, "update_task_status", _record)
    return recorded


@pytest.fixture
def persisted(monkeypatch):
    """Запись на объявление: по умолчанию удачная, тест может сделать её неудачной."""
    written = []

    async def _persist(sale_car_id, result):
        written.append(result)
        return _persist.outcome

    _persist.outcome = True
    monkeypatch.setattr(decode_by_vin, "persist_decoded", _persist)
    monkeypatch.setattr(decode_vin_task, "persist_decoded", _persist)
    return _persist, written


async def test_should_report_success_after_a_vin_was_decoded(monkeypatch, statuses, persisted):
    monkeypatch.setattr(decode_by_vin, "read_vin", lambda vin: READING)
    _, written = persisted

    outcome = await decode_by_vin.decode_car_from_vin({}, LISTING, VIN)

    assert statuses == [
        TaskStatus.STARTED,
        TaskStatus.DecodeStarted,
        TaskStatus.DecodeSuccess,
        TaskStatus.SUCCESS,
    ]
    assert outcome["result"]["mark"] == "Toyota"
    # Мощность приезжает под именем power, а на строке живёт как engine_power.
    assert written[0]["engine_power"] == "181"
    assert "vin" not in written[0], "задача не переписывает номер, выбранный продавцом"


async def test_should_call_a_vin_that_matched_nothing_a_failure(monkeypatch, statuses, persisted):
    monkeypatch.setattr(decode_by_vin, "read_vin", lambda vin: dict.fromkeys(READING))

    outcome = await decode_by_vin.decode_car_from_vin({}, LISTING, VIN)

    assert statuses[-2:] == [TaskStatus.DecodeFailed, TaskStatus.FAILURE]
    assert outcome == {"sale_car_id": LISTING, "error": True}


async def test_should_survive_a_provider_that_is_down(monkeypatch, statuses, persisted):
    def _unavailable(vin):
        raise VisionUnavailable("giga is down")

    monkeypatch.setattr(decode_by_vin, "read_vin", _unavailable)

    outcome = await decode_by_vin.decode_car_from_vin({}, LISTING, VIN)

    assert outcome["error"] is True
    assert statuses[-1] == TaskStatus.FAILURE


async def test_should_report_failure_when_the_listing_is_gone(monkeypatch, statuses, persisted):
    monkeypatch.setattr(decode_by_vin, "read_vin", lambda vin: READING)
    persist, _ = persisted
    persist.outcome = False

    outcome = await decode_by_vin.decode_car_from_vin({}, LISTING, VIN)

    assert outcome["error"] is True
    assert statuses[-2:] == [TaskStatus.DecodeFailed, TaskStatus.FAILURE]


@pytest.fixture
def document(monkeypatch):
    async def _get_document(key):
        return b"pretend-this-is-a-scan"

    monkeypatch.setattr(decode_vin_task.s3_service, "get_document", _get_document)


async def test_should_walk_a_scan_from_reading_to_written(monkeypatch, statuses, persisted, document):
    async def _decode(file_bytes, car_id):
        return {"vin": VIN, "year": "2012"}

    monkeypatch.setattr(decode_vin_task, "decode_vin", _decode)

    outcome = await decode_vin_task.decode_vin_from_sts({}, LISTING, "documents/scan.jpg")

    assert statuses == [
        TaskStatus.STARTED,
        TaskStatus.OcrStarted,
        TaskStatus.OcrSuccess,
        TaskStatus.DecodeStarted,
        TaskStatus.DecodeProcessing,
        TaskStatus.DecodeSuccess,
        TaskStatus.SUCCESS,
    ]
    assert outcome["result"]["vin"] == VIN


async def test_should_stop_at_the_reading_when_the_picture_is_unreadable(
    monkeypatch, statuses, persisted, document
):
    async def _decode(file_bytes, car_id):
        return {"error": "ocr_failed", "message": "нечего читать"}

    monkeypatch.setattr(decode_vin_task, "decode_vin", _decode)

    outcome = await decode_vin_task.decode_vin_from_sts({}, LISTING, "documents/scan.jpg")

    # Переснять документ или вписать поля руками — разные действия продавца, и разница
    # между OcrFailed и DecodeFailed это ровно она.
    assert statuses[-2:] == [TaskStatus.OcrFailed, TaskStatus.FAILURE]
    assert outcome["error"] is True


async def test_should_blame_the_decoding_when_the_answer_made_no_sense(
    monkeypatch, statuses, persisted, document
):
    async def _decode(file_bytes, car_id):
        return {"error": "model_answer_unparseable"}

    monkeypatch.setattr(decode_vin_task, "decode_vin", _decode)

    await decode_vin_task.decode_vin_from_sts({}, LISTING, "documents/scan.jpg")

    assert statuses[-2:] == [TaskStatus.DecodeFailed, TaskStatus.FAILURE]


async def test_should_report_failure_when_the_reading_itself_threw(
    monkeypatch, statuses, persisted, document
):
    async def _decode(file_bytes, car_id):
        raise RuntimeError("tesseract упал")

    monkeypatch.setattr(decode_vin_task, "decode_vin", _decode)

    with pytest.raises(RuntimeError):
        await decode_vin_task.decode_vin_from_sts({}, LISTING, "documents/scan.jpg")

    assert statuses[-2:] == [TaskStatus.OcrFailed, TaskStatus.FAILURE]


async def test_should_report_failure_when_the_document_cannot_be_fetched(
    monkeypatch, statuses, persisted
):
    async def _missing(key):
        raise RuntimeError("нет такого ключа")

    monkeypatch.setattr(decode_vin_task.s3_service, "get_document", _missing)

    with pytest.raises(RuntimeError):
        await decode_vin_task.decode_vin_from_sts({}, LISTING, "documents/gone.jpg")

    assert statuses == [TaskStatus.STARTED, TaskStatus.FAILURE]


@pytest.mark.parametrize(
    "error,expected",
    [
        ("ocr_failed", TaskStatus.OcrFailed),
        ("file_bytes is required", TaskStatus.OcrFailed),
        ("model_unavailable", TaskStatus.DecodeFailed),
        (None, TaskStatus.DecodeFailed),
    ],
)
def test_should_name_the_step_a_reading_stopped_at(error, expected):
    assert failed_at(error) == expected
