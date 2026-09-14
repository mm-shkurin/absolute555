"""Живая доставка чата: кому отдаётся сообщение и кого пускают слушать.

Проверяется в обход сокета, потому что сокет — транспорт, а правило живёт здесь: одно
сообщение уходит обеим сторонам диалога и никому больше, а токен превращается в человека
или ни во что — одинаково для отсутствующего, испорченного и просроченного.
"""

import asyncio
from datetime import datetime, timedelta, timezone

import jwt
import pytest

from app.core.config import JWTSettings
from app.sse.chat_socket import ChatHub, listener_of
from tests.conftest import sign_token

jwt_settings = JWTSettings()

ONE = "11111111-1111-1111-1111-111111111111"
OTHER = "22222222-2222-2222-2222-222222222222"



async def test_should_hand_a_message_to_both_sides():
    hub = ChatHub()
    mine, theirs = hub.join(ONE), hub.join(OTHER)

    await hub.deliver([ONE, OTHER], {"type": "message", "text": "привет"})

    assert mine.get_nowait()["text"] == "привет"
    assert theirs.get_nowait()["text"] == "привет"


async def test_should_reach_every_connection_of_one_person():
    hub = ChatHub()
    phone, laptop = hub.join(ONE), hub.join(ONE)

    hub.hand_over(ONE, {"text": "две вкладки"})

    assert phone.get_nowait() == laptop.get_nowait()


async def test_should_say_nothing_to_a_third_party():
    hub = ChatHub()
    outsider = hub.join("33333333-3333-3333-3333-333333333333")
    hub.join(ONE)

    hub.hand_over(ONE, {"text": "не для чужих"})

    assert outsider.empty()


async def test_should_stop_delivering_after_a_disconnect():
    hub = ChatHub()
    queue = hub.join(ONE)

    hub.leave(ONE, queue)
    hub.hand_over(ONE, {"text": "после ухода"})

    assert queue.empty()


async def test_should_survive_a_disconnect_that_never_connected():
    hub = ChatHub()

    hub.leave(ONE, asyncio.Queue())

    hub.hand_over(ONE, {"text": "никого нет"})


async def test_should_survive_a_queue_that_refuses_the_message():
    hub = ChatHub()
    full: asyncio.Queue = asyncio.Queue(maxsize=1)
    full.put_nowait({"text": "уже занято"})
    hub._listeners[ONE] = {full}

    # Потерянное сообщение — не упавший процесс: одну строку в переписке переживают.
    hub.hand_over(ONE, {"text": "второе"})


async def test_should_recognise_the_person_behind_an_access_token():
    assert await listener_of(sign_token({"id": ONE, "type": "access"})) == ONE


async def test_should_accept_the_bearer_prefix():
    token = sign_token({"id": ONE, "type": "access"})

    assert await listener_of(f"Bearer {token}") == ONE


@pytest.mark.parametrize(
    "token",
    [
        "",
        "не токен",
        sign_token({"id": ONE, "type": "refresh"}),
        sign_token({"id": ONE, "type": "access"}, secret="a" * 40),
        jwt.encode(
            {"id": ONE, "type": "access", "exp": datetime.now(timezone.utc) - timedelta(minutes=1)},
            JWTSettings().secret_key,
            algorithm=JWTSettings().algorithm,
        ),
    ],
)
async def test_should_refuse_everything_that_is_not_a_live_access_token(token):
    assert await listener_of(token) is None
