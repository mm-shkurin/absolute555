"""What is written in a conversation, and what reading it marks.

Story 11. Both sides write into one dialogue, the other side's lines count as unread
until named as read, and the offer's own turns -- accepted, sold -- arrive as system
lines no client can forge.
"""

from tests.conftest import user_id_of as _id_of, verify_account as _verify
from tests.test_chat import _badge, _dialog, _messages, _say, published, talking  # noqa: F401


def test_should_carry_what_each_side_writes_to_the_other(client, seller, talking):
    _, buyer, dialog_id = talking

    asked = _say(client, buyer, dialog_id, "Крыло красили?")
    assert asked.status_code == 201, asked.text
    answered = _say(client, seller, dialog_id, "Только крыло, лонжерон целый")
    assert answered.status_code == 201, answered.text

    texts = [line["text"] for line in _messages(client, seller, dialog_id)]
    assert texts[-2:] == ["Крыло красили?", "Только крыло, лонжерон целый"]


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

    monkeypatch.setattr("app.features.chat.api.chat.chat_hub.deliver", _capture)

    assert _say(client, buyer, dialog_id, "Через канал").status_code == 201

    assert len(handed) == 1
    recipients, payload = handed[0]
    assert set(recipients) == {_id_of(buyer), _id_of(seller)}
    assert payload["message"]["text"] == "Через канал"
