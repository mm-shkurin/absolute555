"""Прямая переписка: «Написать» на странице поставщика открывает чат без объявления."""

from tests.test_chat import _verify  # noqa: F401


def _open(client, headers, user_id):
    return client.post(f"/api/v1/chat/dialogs/direct/{user_id}", headers=headers)


def _id(client, headers):
    return client.get("/api/v1/user/profile", headers=headers).json()["id"]


def test_should_open_one_direct_chat_per_pair(client, signed_in):
    asker, supplier = signed_in(), signed_in()
    supplier_id = _id(client, supplier)

    first = _open(client, asker, supplier_id)
    again = _open(client, asker, supplier_id)

    assert first.status_code == 200, first.text
    assert again.json()["dialog_id"] == first.json()["dialog_id"]
    assert first.json()["listing"] is None and first.json()["request"] is None
    assert first.json()["can_review"] is True


def test_should_let_both_sides_write_in_a_direct_chat(client, signed_in):
    asker, supplier = signed_in(), signed_in()
    dialog_id = _open(client, asker, _id(client, supplier)).json()["dialog_id"]

    said = client.post(
        f"/api/v1/chat/dialogs/{dialog_id}/messages", headers=asker, json={"text": "Привезёте?"}
    )

    assert said.status_code in (200, 201), said.text
    theirs = client.get("/api/v1/chat/dialogs", headers=supplier).json()
    assert dialog_id in {one["dialog_id"] for one in theirs}


def test_should_refuse_a_chat_with_oneself(client, signed_in):
    me = signed_in()

    assert _open(client, me, _id(client, me)).status_code == 404
