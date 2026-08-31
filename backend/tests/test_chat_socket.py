"""The live channel: who may hold one, and what reaches it.

Story 11. The hole this story closes is not the transport but the missing question of who
is listening — so these hold the question rather than the socket: a connection without a
usable token is closed, and a connection carries only its holder's conversations.
"""

import uuid

import jwt
import pytest

from app.core.config import JWTSettings
from app.sse.chat_socket import ChatHub, listener_of

pytestmark = pytest.mark.asyncio

jwt_settings = JWTSettings()


def _token(payload: dict) -> str:
    return jwt.encode(payload, jwt_settings.secret_key, algorithm=jwt_settings.algorithm)


async def test_should_recognise_the_person_behind_an_access_token():
    person = str(uuid.uuid4())

    assert await listener_of(_token({"id": person, "type": "access"})) == person
    assert await listener_of(f"Bearer {_token({'id': person, 'type': 'access'})}") == person


@pytest.mark.parametrize(
    "token",
    [
        "",
        "not-a-token",
        jwt.encode({"id": "x", "type": "access"}, "another-signing-key", algorithm="HS256"),
    ],
)
async def test_should_refuse_a_token_it_cannot_trust(token):
    assert await listener_of(token) is None


async def test_should_refuse_a_refresh_token_where_an_access_token_belongs():
    refresh = _token({"id": str(uuid.uuid4()), "type": "refresh"})

    assert await listener_of(refresh) is None


async def test_should_hand_a_message_only_to_the_people_it_belongs_to():
    hub = ChatHub()
    buyer, seller, stranger = (str(uuid.uuid4()) for _ in range(3))
    buyer_queue, seller_queue, stranger_queue = (
        hub.join(buyer), hub.join(seller), hub.join(stranger)
    )

    await hub.deliver([buyer, seller], {"type": "message", "text": "hello"})

    assert buyer_queue.get_nowait()["text"] == "hello"
    assert seller_queue.get_nowait()["text"] == "hello"
    assert stranger_queue.empty(), "a message reached somebody outside the dialogue"


async def test_should_stop_delivering_to_a_connection_that_left():
    hub = ChatHub()
    person = str(uuid.uuid4())
    queue = hub.join(person)

    hub.leave(person, queue)
    await hub.deliver([person], {"type": "message"})

    assert queue.empty()


async def test_should_reach_every_connection_one_person_holds():
    hub = ChatHub()
    person = str(uuid.uuid4())
    phone, laptop = hub.join(person), hub.join(person)

    await hub.deliver([person], {"type": "message"})

    assert not phone.empty() and not laptop.empty()
