"""Отклик поставщика на заявку открывает переписку.

Фикстуры и помощники — из `test_buyer_requests.py`: заявка и отклик собираются там.
"""

from tests.test_buyer_requests import ask, buyer, importer, respond  # noqa: F401


class TestResponseOpensAChat:
    """Отклик поставщика заводит переписку и сам открывает её первой строкой."""

    def test_should_open_a_dialog_with_the_response_as_its_first_line(
        self, client, buyer, importer
    ):
        request_id = ask(client, buyer).json()["request_id"]

        answered = respond(client, importer, request_id, price=1900000.0, delivery_days=40)

        assert answered.status_code == 200, answered.text
        dialog_id = answered.json()["dialog_id"]
        assert dialog_id
        messages = client.get(f"/api/v1/chat/dialogs/{dialog_id}/messages", headers=buyer)
        first = messages.json()["items"][0]
        assert first["kind"] == "system"
        assert "1\u00a0900\u00a0000 ₽" in first["text"]
        assert "40 дней" in first["text"]

    def test_should_keep_one_dialog_when_the_supplier_corrects_the_response(
        self, client, buyer, importer
    ):
        request_id = ask(client, buyer).json()["request_id"]
        first = respond(client, importer, request_id, price=1900000.0).json()

        again = respond(client, importer, request_id, price=1850000.0, delivery_days=35).json()

        assert again["dialog_id"] == first["dialog_id"]
        messages = client.get(
            f"/api/v1/chat/dialogs/{again['dialog_id']}/messages", headers=buyer
        ).json()
        assert [one["kind"] for one in messages["items"]] == ["system", "system"]

    def test_should_show_the_request_in_the_buyers_dialog_list(self, client, buyer, importer):
        request_id = ask(client, buyer).json()["request_id"]
        respond(client, importer, request_id)

        dialogs = client.get("/api/v1/chat/dialogs", headers=buyer).json()

        row = next(one for one in dialogs if one["request"] is not None)
        assert row["request"]["request_id"] == request_id
        # Объявления у спроса нет: заявка — это машина, которой ещё никто не продаёт.
        assert row["listing"] is None
        assert row["sale_car_id"] is None
