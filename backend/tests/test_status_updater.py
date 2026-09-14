"""Отчёт фоновой задачи о себе: строка объявления и поток на экран продавца.

Обе записи идут одной транзакцией: очередной статус задачи и то, что из него видит
продавец. Разделив их, можно получить объявление, у которого разбор упал, а надпись на
экране всё ещё говорит «читаем».
"""

import uuid

import pytest

from app.tasks import status_updater
from app.tasks.status_updater import TaskStatus, update_task_status
from tests.conftest import test_session


@pytest.fixture
def session_of_its_own(monkeypatch):
    """Сессия этого теста вместо сессии приложения.

    Движок приложения пулится, а пулированное соединение принадлежит тому циклу, который
    его открыл: задача, вызванная отсюда, попала бы в чужой цикл. Тот же приём, что и в
    тестах истечения предложений.
    """
    monkeypatch.setattr(status_updater, "get_db_session", test_session())
    return status_updater


@pytest.fixture
def listing(client, seller):
    created = client.post("/api/v1/sale_car", headers=seller)
    assert created.status_code == 201, created.text
    return created.json()["sale_car_id"]


async def test_should_record_the_step_a_task_reached(session_of_its_own, listing, client, seller):
    await update_task_status(listing, TaskStatus.OcrStarted)

    listing_row = client.get(f"/api/v1/sale_car/{listing}", headers=seller).json()
    assert listing_row["task_status"] == TaskStatus.OcrStarted


async def test_should_translate_the_step_into_what_the_seller_sees(
    session_of_its_own, listing, client, seller
):
    def _state():
        return client.get(f'/api/v1/sale_car/{listing}', headers=seller).json()['autofill']['state']

    await update_task_status(listing, TaskStatus.OcrStarted)
    started = _state()

    await update_task_status(listing, TaskStatus.DecodeSuccess)
    finished = _state()

    assert started == 'pending'
    assert finished == 'done'


async def test_should_tell_the_seller_which_of_the_two_failures_happened(
    session_of_its_own, listing, client, seller
):
    def _state():
        return client.get(f'/api/v1/sale_car/{listing}', headers=seller).json()['autofill']['state']

    # Переснять документ и вписать поля руками — разные действия, и вид у них разный.
    await update_task_status(listing, TaskStatus.OcrFailed)
    unreadable = _state()

    await update_task_status(listing, TaskStatus.DecodeFailed)
    undecoded = _state()

    assert unreadable == 'unreadable'
    assert undecoded == 'undecoded'


async def test_should_leave_the_seller_view_alone_for_a_step_that_says_nothing(
    session_of_its_own, listing, client, seller
):
    # Success — статус очереди, а не исход чтения: исход уже сказал DecodeSuccess.
    await update_task_status(listing, TaskStatus.DecodeSuccess)
    await update_task_status(listing, TaskStatus.SUCCESS)

    listing_row = client.get(f'/api/v1/sale_car/{listing}', headers=seller).json()
    assert listing_row['autofill']['state'] == 'done'
    assert listing_row['task_status'] == TaskStatus.SUCCESS


async def test_should_say_nothing_about_an_entity_it_does_not_know(session_of_its_own, listing):
    await update_task_status(listing, TaskStatus.SUCCESS, entity_type="spare_part")


async def test_should_survive_a_listing_that_is_already_gone(session_of_its_own):
    await update_task_status(str(uuid.uuid4()), TaskStatus.SUCCESS)


async def test_should_survive_a_stream_that_cannot_deliver(
    monkeypatch, session_of_its_own, listing, client, seller
):
    async def _broken(car_id, message):
        raise RuntimeError("поток недоступен")

    monkeypatch.setattr(status_updater.sse_manager, "send_message", _broken)

    # Упавшая доставка не должна отменять запись: строка важнее уведомления.
    await update_task_status(listing, TaskStatus.OcrSuccess)

    listing_row = client.get(f"/api/v1/sale_car/{listing}", headers=seller).json()
    assert listing_row["task_status"] == TaskStatus.OcrSuccess


def test_should_name_every_step_a_reading_goes_through():
    steps = {
        TaskStatus.PENDING,
        TaskStatus.STARTED,
        TaskStatus.OcrStarted,
        TaskStatus.OcrSuccess,
        TaskStatus.OcrFailed,
        TaskStatus.DecodeStarted,
        TaskStatus.DecodeProcessing,
        TaskStatus.DecodeSuccess,
        TaskStatus.DecodeFailed,
        TaskStatus.SUCCESS,
        TaskStatus.FAILURE,
    }

    assert len(steps) == 11, "два шага назвали одинаково — на экране они сольются"
