"""Поток статусов распознавания: кто подписан и кому уходит сообщение.

Подписка живёт в процессе, а рассылка — через Redis, потому что задача выполняется на
воркере, а вкладка открыта у веб-процесса. Здесь проверяется ближний конец: подписка,
отписка и то, что сообщение уходит только подписчикам этого объявления.
"""

import asyncio

from app.sse.manager import SSEManager

CAR = "44444444-4444-4444-4444-444444444444"
OTHER_CAR = "55555555-5555-5555-5555-555555555555"


async def test_should_deliver_to_a_subscriber_of_this_listing():
    manager = SSEManager()
    queue: asyncio.Queue = asyncio.Queue()
    manager.add_connection(CAR, queue)

    await manager.send_message(CAR, {"status": "OcrSuccess"})

    assert queue.get_nowait()["status"] == "OcrSuccess"


async def test_should_say_nothing_to_a_subscriber_of_another_listing():
    manager = SSEManager()
    mine: asyncio.Queue = asyncio.Queue()
    manager.add_connection(OTHER_CAR, mine)

    await manager.send_message(CAR, {"status": "OcrSuccess"})

    assert mine.empty()


async def test_should_reach_two_tabs_on_the_same_listing():
    manager = SSEManager()
    phone, laptop = asyncio.Queue(), asyncio.Queue()
    manager.add_connection(CAR, phone)
    manager.add_connection(CAR, laptop)

    await manager.send_message(CAR, {"status": "DecodeSuccess"})

    assert phone.get_nowait() == laptop.get_nowait()


async def test_should_stop_delivering_after_the_tab_closes():
    manager = SSEManager()
    queue: asyncio.Queue = asyncio.Queue()
    manager.add_connection(CAR, queue)

    manager.remove_connection(CAR, queue)
    await manager.send_message(CAR, {"status": "DecodeSuccess"})

    assert queue.empty()


def test_should_forget_a_listing_once_its_last_tab_closes():
    manager = SSEManager()
    queue: asyncio.Queue = asyncio.Queue()
    manager.add_connection(CAR, queue)

    manager.remove_connection(CAR, queue)

    assert CAR not in manager.active_connections


def test_should_survive_a_disconnect_of_something_never_connected():
    manager = SSEManager()

    manager.remove_connection(CAR, asyncio.Queue())
    manager.add_connection(CAR, asyncio.Queue())
    manager.remove_connection(CAR, asyncio.Queue())

    assert CAR in manager.active_connections


async def test_should_not_fail_when_nobody_is_listening():
    manager = SSEManager()

    await manager.send_message("никого", {"status": "Started"})
