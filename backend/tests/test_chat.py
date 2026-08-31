"""The conversation between a buyer and a seller, over HTTP.

Story 11. A dialogue opens with an offer and belongs to exactly two people; everyone else
is told it does not exist, which is also what an unknown identifier gets. The two answers
are indistinguishable on purpose: a refusal would confirm somebody is bargaining over
that car.
"""

import uuid

import jwt
import pytest

from tests.conftest import run_sql
from tests.test_listing_lifecycle import COMPLETE, _create


def _id_of(headers):
    return jwt.decode(
        headers["Authorization"].removeprefix("Bearer "), options={"verify_signature": False}
    )["id"]


def _verify(headers):
    user_id = jwt.decode(
        headers["Authorization"].removeprefix("Bearer "), options={"verify_signature": False}
    )["id"]
    run_sql("UPDATE users SET is_guest = false WHERE id = :id", {"id": uuid.UUID(user_id)})
    return headers


@pytest.fixture
def published(client, seller, moderator, catalogue, attach_photo):
    brand_id, model_id = catalogue

    def _publish():
        listing_id = _create(client, seller)
        body = dict(COMPLETE, brand_id=brand_id, model_id=model_id)
        assert client.patch(f"/api/v1/sale_car/{listing_id}", headers=seller, json=body).status_code == 200
        attach_photo(listing_id, seller, count=3)
        client.post(f"/api/v1/sale_car/{listing_id}/submit", headers=seller)
        assert client.post(f"/api/v1/sale_car/{listing_id}/approve", headers=moderator).status_code == 200
        return listing_id

    return _publish


@pytest.fixture
def talking(client, seller, published, signed_in):
    """A buyer, a seller and the dialogue their offer opened."""
    _verify(seller)
    buyer = _verify(signed_in())
    listing_id = published()
    offered = client.post(
        "/api/v1/offer/", headers=buyer, json={"sale_car_id": listing_id, "price": 900000.0}
    )
    assert offered.status_code == 201, offered.text

    dialogs = client.get("/api/v1/chat/dialogs", headers=buyer)
    assert dialogs.status_code == 200, dialogs.text
    dialog = next(one for one in dialogs.json() if one["sale_car_id"] == listing_id)
    return listing_id, buyer, dialog["dialog_id"]


def _say(client, headers, dialog_id, text="Здравствуйте"):
    return client.post(
        f"/api/v1/chat/dialogs/{dialog_id}/messages", headers=headers, json={"text": text}
    )


def _messages(client, headers, dialog_id):
    response = client.get(f"/api/v1/chat/dialogs/{dialog_id}/messages", headers=headers)
    assert response.status_code == 200, response.text
    return response.json()["items"]


def _dialog(client, headers, dialog_id):
    response = client.get("/api/v1/chat/dialogs", headers=headers)
    assert response.status_code == 200, response.text
    return next(one for one in response.json() if one["dialog_id"] == dialog_id)


def _badge(client, headers):
    response = client.get("/api/v1/chat/unread", headers=headers)
    assert response.status_code == 200, response.text
    return response.json()["unread"]


def test_should_open_the_conversation_with_the_offer(client, seller, talking):
    listing_id, buyer, dialog_id = talking

    assert _dialog(client, seller, dialog_id)["sale_car_id"] == listing_id
    lines = _messages(client, buyer, dialog_id)
    assert lines[0]["kind"] == "system"
    assert "900000" in lines[0]["text"].replace(" ", "")
    assert lines[0]["author_id"] is None


def test_should_join_a_second_offer_to_the_same_conversation(client, buyer_second_offer):
    dialogs, dialog_id, lines = buyer_second_offer

    assert len(dialogs) == 1
    assert len([line for line in lines if line["kind"] == "system"]) == 2


@pytest.fixture
def buyer_second_offer(client, seller, published, signed_in):
    _verify(seller)
    buyer = _verify(signed_in())
    listing_id = published()
    first = client.post(
        "/api/v1/offer/", headers=buyer, json={"sale_car_id": listing_id, "price": 900000.0}
    )
    client.post(f"/api/v1/offer/{first.json()['offer_id']}/withdraw", headers=buyer)
    client.post("/api/v1/offer/", headers=buyer, json={"sale_car_id": listing_id, "price": 950000.0})

    dialogs = [
        one for one in client.get("/api/v1/chat/dialogs", headers=buyer).json()
        if one["sale_car_id"] == listing_id
    ]
    dialog_id = dialogs[0]["dialog_id"]
    return dialogs, dialog_id, _messages(client, buyer, dialog_id)


def test_should_carry_what_each_side_writes_to_the_other(client, seller, talking):
    _, buyer, dialog_id = talking

    asked = _say(client, buyer, dialog_id, "Крыло красили?")
    assert asked.status_code == 201, asked.text
    answered = _say(client, seller, dialog_id, "Только крыло, лонжерон целый")
    assert answered.status_code == 201, answered.text

    texts = [line["text"] for line in _messages(client, seller, dialog_id)]
    assert texts[-2:] == ["Крыло красили?", "Только крыло, лонжерон целый"]


def test_should_hide_the_dialogue_from_everyone_else(client, signed_in, talking):
    _, _, dialog_id = talking
    stranger = _verify(signed_in())

    assert client.get(f"/api/v1/chat/dialogs/{dialog_id}/messages", headers=stranger).status_code == 404
    assert _say(client, stranger, dialog_id).status_code == 404
    assert client.post(
        f"/api/v1/chat/dialogs/{dialog_id}/read",
        headers=stranger,
        json={"message_ids": [str(uuid.uuid4())]},
    ).status_code == 404
    assert client.get("/api/v1/chat/dialogs", headers=stranger).json() == []


def test_should_count_what_the_other_side_wrote_as_unread(client, seller, talking):
    _, buyer, dialog_id = talking
    before = _badge(client, seller)
    _say(client, buyer, dialog_id, "Первое")
    _say(client, buyer, dialog_id, "Второе")

    assert _dialog(client, seller, dialog_id)["unread"] >= 2
    assert _badge(client, seller) == before + 2


def test_should_mark_read_only_what_was_named(client, seller, talking):
    _, buyer, dialog_id = talking
    for text in ("Раз", "Два", "Три"):
        _say(client, buyer, dialog_id, text)
    unread = [
        line["message_id"]
        for line in _messages(client, seller, dialog_id)
        if line["read_at"] is None
    ]

    marked = client.post(
        f"/api/v1/chat/dialogs/{dialog_id}/read", headers=seller, json={"message_ids": unread[:-1]}
    )

    assert marked.status_code == 200, marked.text
    assert marked.json()["marked"] == len(unread) - 1
    assert marked.json()["unread"] == 1
    read_lines = [line for line in _messages(client, seller, dialog_id) if line["read_at"]]
    assert len(read_lines) == len(unread) - 1


def test_should_ignore_marking_your_own_message_read(client, seller, talking):
    _, buyer, dialog_id = talking
    mine = _say(client, seller, dialog_id, "Моё сообщение").json()["message_id"]

    marked = client.post(
        f"/api/v1/chat/dialogs/{dialog_id}/read", headers=seller, json={"message_ids": [mine]}
    )

    assert marked.json()["marked"] == 0
    assert _dialog(client, buyer, dialog_id)["unread"] >= 1


def test_should_not_move_the_moment_a_message_was_read(client, seller, talking):
    _, buyer, dialog_id = talking
    sent = _say(client, buyer, dialog_id, "Однажды").json()["message_id"]
    client.post(f"/api/v1/chat/dialogs/{dialog_id}/read", headers=seller, json={"message_ids": [sent]})
    first_time = next(
        line["read_at"] for line in _messages(client, seller, dialog_id) if line["message_id"] == sent
    )

    again = client.post(
        f"/api/v1/chat/dialogs/{dialog_id}/read", headers=seller, json={"message_ids": [sent]}
    )

    assert again.json()["marked"] == 0
    assert next(
        line["read_at"] for line in _messages(client, seller, dialog_id) if line["message_id"] == sent
    ) == first_time


def test_should_say_in_the_conversation_that_the_offer_was_accepted(client, seller, talking):
    listing_id, buyer, dialog_id = talking
    offer_id = client.get("/api/v1/offer/my", headers=buyer, params={"side": "sent"}).json()[0]["offer_id"]

    client.patch(f"/api/v1/offer/{offer_id}/status", headers=seller, json={"status": "accepted"})

    lines = _messages(client, buyer, dialog_id)
    assert lines[-1]["kind"] == "system"
    assert lines[-1]["author_id"] is None
    assert "принято" in lines[-1]["text"].lower()


def test_should_tell_the_other_buyer_the_car_was_sold(client, seller, published, signed_in):
    _verify(seller)
    listing_id = published()
    winner, loser = _verify(signed_in()), _verify(signed_in())
    won = client.post("/api/v1/offer/", headers=winner, json={"sale_car_id": listing_id, "price": 950000.0})
    client.post("/api/v1/offer/", headers=loser, json={"sale_car_id": listing_id, "price": 900000.0})

    client.patch(
        f"/api/v1/offer/{won.json()['offer_id']}/status", headers=seller, json={"status": "accepted"}
    )

    dialog_id = next(
        one["dialog_id"]
        for one in client.get("/api/v1/chat/dialogs", headers=loser).json()
        if one["sale_car_id"] == listing_id
    )
    assert "продали" in _messages(client, loser, dialog_id)[-1]["text"].lower()


def test_should_store_a_client_message_as_an_ordinary_one(client, seller, talking):
    _, buyer, dialog_id = talking

    sent = client.post(
        f"/api/v1/chat/dialogs/{dialog_id}/messages",
        headers=buyer,
        json={"text": "Предложение принято", "kind": "system"},
    )

    assert sent.status_code == 422, sent.text


def test_should_refuse_an_empty_message(client, talking):
    _, buyer, dialog_id = talking

    assert _say(client, buyer, dialog_id, "   ").status_code == 422
    assert _say(client, buyer, dialog_id, "").status_code == 422


def test_should_keep_the_conversation_open_after_the_car_is_sold(client, seller, talking):
    listing_id, buyer, dialog_id = talking
    offer_id = client.get("/api/v1/offer/my", headers=buyer, params={"side": "sent"}).json()[0]["offer_id"]
    client.patch(f"/api/v1/offer/{offer_id}/status", headers=seller, json={"status": "accepted"})

    assert _say(client, buyer, dialog_id, "Когда можно забрать?").status_code == 201
    assert _say(client, seller, dialog_id, "Завтра в двенадцать").status_code == 201


def test_should_name_the_listing_and_the_other_person(client, seller, talking):
    listing_id, buyer, dialog_id = talking

    seen_by_seller = _dialog(client, seller, dialog_id)
    seen_by_buyer = _dialog(client, buyer, dialog_id)

    assert seen_by_seller["listing"]["sale_car_id"] == listing_id
    assert seen_by_seller["counterpart"]["user_id"] != seen_by_buyer["counterpart"]["user_id"]
    assert seen_by_buyer["last_message"]["text"]


def test_should_put_the_freshest_conversation_first(client, seller, published, signed_in):
    _verify(seller)
    older = _verify(signed_in())
    newer = _verify(signed_in())
    first_listing, second_listing = published(), published()
    client.post("/api/v1/offer/", headers=older, json={"sale_car_id": first_listing, "price": 900000.0})
    client.post("/api/v1/offer/", headers=newer, json={"sale_car_id": second_listing, "price": 950000.0})

    older_dialog = next(
        one["dialog_id"]
        for one in client.get("/api/v1/chat/dialogs", headers=older).json()
        if one["sale_car_id"] == first_listing
    )
    _say(client, older, older_dialog, "Ещё актуально?")

    assert client.get("/api/v1/chat/dialogs", headers=seller).json()[0]["dialog_id"] == older_dialog


def test_should_hand_a_written_message_to_the_live_channel(client, seller, talking, monkeypatch):
    """Writing a message hands it to both sides of the dialogue.

    Only the write leg. The delivery leg is held in `test_chat_socket.py` against the hub
    itself: driving it through TestClient means waking an asyncio queue owned by the
    portal's loop from the test's thread, which does not wake it — a hang in the test
    rather than in the server.
    """
    _, buyer, dialog_id = talking
    handed = []

    async def _capture(user_ids, payload):
        handed.append((user_ids, payload))

    monkeypatch.setattr("app.api.chat.chat_hub.deliver", _capture)

    assert _say(client, buyer, dialog_id, "Через канал").status_code == 201

    assert len(handed) == 1
    recipients, payload = handed[0]
    assert set(recipients) == {_id_of(buyer), _id_of(seller)}
    assert payload["message"]["text"] == "Через канал"


def test_should_close_a_live_connection_with_no_token(client):
    from starlette.websockets import WebSocketDisconnect

    with pytest.raises(WebSocketDisconnect):
        with client.websocket_connect("/api/v1/chat/ws") as socket:
            socket.receive_json()


@pytest.mark.parametrize(
    "method,path",
    [
        ("get", "/api/v1/chat/dialogs"),
        ("get", "/api/v1/chat/unread"),
    ],
)
def test_should_refuse_chat_to_a_caller_who_has_not_signed_in(client, method, path):
    assert getattr(client, method)(path).status_code == 401


def test_should_refuse_a_dialogue_route_to_a_caller_who_has_not_signed_in(client, talking):
    _, _, dialog_id = talking

    assert client.get(f"/api/v1/chat/dialogs/{dialog_id}/messages").status_code == 401
    assert client.post(
        f"/api/v1/chat/dialogs/{dialog_id}/messages", json={"text": "hi"}
    ).status_code == 401
