"""Значок непрочитанного и прямая переписка.

Число на значке рисуется на каждом экране, поэтому оно — отдельная ручка, а не сумма,
которую клиент считает сам по списку диалогов. Свои сообщения в него не входят: иначе
собеседник видел бы значок от собственной реплики.
"""

import uuid

import pytest

from tests.test_chat import _id_of, _say, _verify, published  # noqa: F401


@pytest.fixture
def pair(client, seller, published, signed_in):
    """Покупатель, продавец и диалог, открытый предложением."""
    _verify(seller)
    buyer = _verify(signed_in())
    listing_id = published()
    offered = client.post(
        "/api/v1/offer/", headers=buyer, json={"sale_car_id": listing_id, "price": 850000.0}
    )
    assert offered.status_code == 201, offered.text
    dialogs = client.get("/api/v1/chat/dialogs", headers=buyer).json()
    dialog = next(one for one in dialogs if one["sale_car_id"] == listing_id)
    return buyer, seller, dialog["dialog_id"]


def _unread(client, headers) -> int:
    response = client.get("/api/v1/chat/unread", headers=headers)
    assert response.status_code == 200, response.text
    return response.json()["unread"]


def test_should_start_a_new_account_with_an_empty_badge(client, signed_in):
    assert _unread(client, signed_in()) == 0


def test_should_count_what_the_other_side_wrote(client, pair):
    buyer, seller, dialog_id = pair
    before = _unread(client, seller)

    assert _say(client, buyer, dialog_id, "Ещё продаёте?").status_code == 201
    assert _say(client, buyer, dialog_id, "Готов посмотреть завтра").status_code == 201

    assert _unread(client, seller) == before + 2


def test_should_not_count_ones_own_messages(client, pair):
    buyer, _, dialog_id = pair
    before = _unread(client, buyer)

    assert _say(client, buyer, dialog_id, "Здравствуйте").status_code == 201

    assert _unread(client, buyer) == before


def test_should_clear_the_badge_once_the_dialogue_is_read(client, pair):
    buyer, seller, dialog_id = pair
    assert _say(client, buyer, dialog_id, "Здравствуйте").status_code == 201
    # Не только своя реплика: предложение открыло диалог системной строкой, и она тоже
    # непрочитана. «Прочитал» на экране значит всю переписку, а не последнее сообщение.
    history = client.get(
        f"/api/v1/chat/dialogs/{dialog_id}/messages", headers=seller, params={"size": 100}
    ).json()["items"]
    ids = [message["message_id"] for message in history]

    marked = client.post(
        f"/api/v1/chat/dialogs/{dialog_id}/read", headers=seller, json={"message_ids": ids}
    )

    assert marked.status_code == 200, marked.text
    assert marked.json()["marked"] >= 1
    assert marked.json()["unread"] == 0


def test_should_ignore_identifiers_from_another_dialogue(client, pair):
    _, seller, dialog_id = pair

    marked = client.post(
        f"/api/v1/chat/dialogs/{dialog_id}/read",
        headers=seller,
        json={"message_ids": [str(uuid.uuid4())]},
    )

    assert marked.status_code == 200, marked.text
    assert marked.json()["marked"] == 0


def test_should_page_the_history(client, pair):
    buyer, _, dialog_id = pair
    for number in range(3):
        assert _say(client, buyer, dialog_id, f"строка {number}").status_code == 201

    page = client.get(
        f"/api/v1/chat/dialogs/{dialog_id}/messages", headers=buyer, params={"page": 1, "size": 2}
    )

    assert page.status_code == 200, page.text
    body = page.json()
    assert len(body["items"]) == 2
    assert body["total"] >= 3
    assert body["page"] == 1 and body["size"] == 2


def test_should_refuse_a_page_size_outside_its_bounds(client, pair):
    buyer, _, dialog_id = pair

    for size in (0, 101):
        answer = client.get(
            f"/api/v1/chat/dialogs/{dialog_id}/messages", headers=buyer, params={"size": size}
        )
        assert answer.status_code == 422, answer.text


def test_should_hide_a_dialogue_from_a_third_party(client, pair, signed_in):
    _, _, dialog_id = pair

    stranger = client.get(f"/api/v1/chat/dialogs/{dialog_id}/messages", headers=signed_in())

    assert stranger.status_code == 404, stranger.text


def test_should_reuse_the_same_direct_dialogue(client, signed_in):
    one = _verify(signed_in())
    other = _verify(signed_in())
    other_id = _id_of(other)

    first = client.post(f"/api/v1/chat/dialogs/direct/{other_id}", headers=one)
    second = client.post(f"/api/v1/chat/dialogs/direct/{other_id}", headers=one)

    assert first.status_code == 200, first.text
    assert second.status_code == 200, second.text
    assert first.json()["dialog_id"] == second.json()["dialog_id"]


def test_should_refuse_a_direct_dialogue_with_nobody(client, signed_in):
    opened = client.post(
        f"/api/v1/chat/dialogs/direct/{uuid.uuid4()}", headers=_verify(signed_in())
    )

    assert opened.status_code == 404, opened.text
