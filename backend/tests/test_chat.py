"""The conversation between a buyer and a seller, over HTTP.

Story 11. A dialogue opens with an offer and belongs to exactly two people; everyone else
is told it does not exist, which is also what an unknown identifier gets. The two answers
are indistinguishable on purpose: a refusal would confirm somebody is bargaining over
that car.
"""

import uuid

import pytest

from tests.conftest import verify_account as _verify
from tests.test_listing_lifecycle import COMPLETE, _create


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
