"""Отзыв по переписке: оценивает спрашивавший, один отзыв на разговор.

Продавца оценивает покупатель, писавший ему по объявлению, поставщика — автор заявки,
на которую тот откликнулся. Фикстуры — из соседних файлов: там заводятся переписки.
"""

from tests.test_buyer_requests import ask, buyer, importer, respond  # noqa: F401
from tests.test_chat import published, talking  # noqa: F401


def _review(client, headers, dialog_id, rating=5, text="Всё честно"):
    return client.post(
        f"/api/v1/chat/dialogs/{dialog_id}/review",
        headers=headers,
        json={"rating": rating, "text": text},
    )


def _seller_of(client, headers, dialog_id):
    dialogs = client.get("/api/v1/chat/dialogs", headers=headers).json()
    return next(one for one in dialogs if one["dialog_id"] == dialog_id)


def test_should_let_the_buyer_review_the_seller_by_the_chat(client, talking):
    _, buyer_headers, dialog_id = talking
    assert _seller_of(client, buyer_headers, dialog_id)["can_review"] is True

    written = _review(client, buyer_headers, dialog_id, rating=4)

    assert written.status_code == 201, written.text
    assert written.json()["dialog_id"] == dialog_id
    row = _seller_of(client, buyer_headers, dialog_id)
    assert row["can_review"] is False
    assert row["review_id"] == written.json()["review_id"]
    seller_id = row["counterpart"]["user_id"]
    page = client.get(f"/api/v1/seller/{seller_id}/reviews").json()
    assert [one["rating"] for one in page["items"]] == [4]


def test_should_keep_one_review_per_chat(client, talking):
    _, buyer_headers, dialog_id = talking
    first = _review(client, buyer_headers, dialog_id)

    again = _review(client, buyer_headers, dialog_id, rating=1)

    assert again.status_code == 409, again.text
    assert again.json()["code"] == "REVIEW_ALREADY_WRITTEN"
    assert again.json()["details"]["review_id"] == first.json()["review_id"]


def test_should_not_let_the_seller_review_themselves_by_the_chat(client, seller, talking):
    _, _, dialog_id = talking

    refused = _review(client, seller, dialog_id)

    assert refused.status_code == 404, refused.text
    assert refused.json()["code"] == "DIALOG_NOT_REVIEWABLE"


def test_should_let_the_request_author_review_the_supplier(client, buyer, importer):
    request_id = ask(client, buyer).json()["request_id"]
    dialog_id = respond(client, importer, request_id).json()["dialog_id"]

    written = _review(client, buyer, dialog_id, rating=5)

    assert written.status_code == 201, written.text
    supplier_id = _seller_of(client, buyer, dialog_id)["counterpart"]["user_id"]
    seller = client.get(f"/api/v1/seller/{supplier_id}").json()
    assert seller["reviews_count"] == 1
    assert seller["rating"] == 5.0
