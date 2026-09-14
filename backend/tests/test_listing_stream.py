"""Поток событий распознавания глазами открытой вкладки.

Поток проверяется генератором, а не HTTP-запросом: ответ SSE не заканчивается, и клиент
из тестов висел бы на нём до таймаута. Здесь читается ровно столько кадров, сколько нужно
сценарию, и соединение закрывается — как закрывает его вкладка.
"""

import asyncio
import json
import uuid

import pytest

from app.features.listing.services.task_status_service import held_task_status
from app.shared.realtime.listing_stream import listing_events
from app.shared.realtime.manager import sse_manager

# Генератор читает статус объявления через общий движок приложения, из цикла теста.
# Без сброса пула эти соединения достаются первому запросу следующего модуля.
pytestmark = pytest.mark.usefixtures("app_engine_in_this_loop")


def _payload(frame: str) -> dict:
    assert frame.startswith("data: ") and frame.endswith("\n\n"), frame
    return json.loads(frame[len("data: ") :])


async def _next(stream, timeout=5.0) -> dict:
    return _payload(await asyncio.wait_for(stream.__anext__(), timeout))


async def test_should_refuse_an_identifier_that_is_not_one():
    stream = listing_events("не-uuid", held_task_status)

    first = await _next(stream)

    assert first["type"] == "error"
    assert "Invalid sale_car_id" in first["message"]
    with pytest.raises(StopAsyncIteration):
        await stream.__anext__()


async def test_should_open_with_the_status_the_listing_holds_now():
    listing_id = str(uuid.uuid4())
    stream = listing_events(listing_id, held_task_status)

    try:
        first = await _next(stream)

        assert first["type"] == "initial"
        assert first["sale_car_id"] == listing_id
        assert first["status"]
        assert first["timestamp"] > 0
    finally:
        await stream.aclose()


async def test_should_pass_on_what_the_task_reported():
    listing_id = str(uuid.uuid4())
    stream = listing_events(listing_id, held_task_status)

    try:
        await _next(stream)
        await sse_manager.send_message(listing_id, {"sale_car_id": listing_id, "status": "OcrSuccess"})

        assert (await _next(stream))["status"] == "OcrSuccess"
    finally:
        await stream.aclose()


async def test_should_skip_a_message_about_another_listing():
    listing_id = str(uuid.uuid4())
    stream = listing_events(listing_id, held_task_status)

    try:
        await _next(stream)
        # Очередь этого объявления, но сообщение чужое: в этой вкладке ему делать нечего.
        queue = sse_manager.active_connections[listing_id][0]
        queue.put_nowait({"sale_car_id": str(uuid.uuid4()), "status": "чужое"})
        await sse_manager.send_message(listing_id, {"sale_car_id": listing_id, "status": "своё"})

        assert (await _next(stream))["status"] == "своё"
    finally:
        await stream.aclose()


async def test_should_deliver_a_message_that_names_no_listing():
    listing_id = str(uuid.uuid4())
    stream = listing_events(listing_id, held_task_status)

    try:
        await _next(stream)
        await sse_manager.send_message(listing_id, {"status": "Started"})

        assert (await _next(stream))["status"] == "Started"
    finally:
        await stream.aclose()


async def test_should_subscribe_while_open_and_let_go_at_the_end():
    listing_id = str(uuid.uuid4())
    stream = listing_events(listing_id, held_task_status)
    await _next(stream)

    assert listing_id in sse_manager.active_connections

    await stream.aclose()

    assert listing_id not in sse_manager.active_connections


async def test_should_let_go_even_when_the_identifier_was_never_valid():
    stream = listing_events("не-uuid", held_task_status)
    await _next(stream)

    with pytest.raises(StopAsyncIteration):
        await stream.__anext__()

    assert "не-uuid" not in sse_manager.active_connections
