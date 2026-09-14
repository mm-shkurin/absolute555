"""Продавец правит и снимает своё объявление, по HTTP.

Правка и удаление — те две операции, где чужой человек причиняет ущерб молча: правка
подменяет цену в чужой витрине, удаление уносит её целиком. Отказ виден только в тесте.
"""

from tests.test_listing_lifecycle import _create


def test_should_save_a_new_price_on_a_draft(client, seller):
    listing_id = _create(client, seller)

    patched = client.patch(f"/api/v1/sale_car/{listing_id}", headers=seller, json={"price": 750000.0})

    assert patched.status_code == 200, patched.text
    assert patched.json()["price"] == 750000.0
    assert client.get(f"/api/v1/sale_car/{listing_id}", headers=seller).json()["price"] == 750000.0


def test_should_refuse_a_patch_that_carries_nothing(client, seller):
    listing_id = _create(client, seller)

    empty = client.patch(f"/api/v1/sale_car/{listing_id}", headers=seller, json={})

    assert empty.status_code == 422, empty.text
    assert empty.json()["code"] == "EMPTY_PATCH"


def test_should_refuse_an_unknown_field_rather_than_ignore_it(client, seller):
    listing_id = _create(client, seller)

    smuggled = client.patch(
        f"/api/v1/sale_car/{listing_id}", headers=seller, json={"status": "active"}
    )

    assert smuggled.status_code == 422, smuggled.text
    assert client.get(f"/api/v1/sale_car/{listing_id}", headers=seller).json()["status"] == "draft"


def test_should_not_let_a_stranger_edit_a_listing(client, seller, signed_in):
    listing_id = _create(client, seller)
    stranger = signed_in()

    patched = client.patch(
        f"/api/v1/sale_car/{listing_id}", headers=stranger, json={"price": 1.0}
    )

    assert patched.status_code == 404, patched.text
    assert patched.json()["code"] == "LISTING_NOT_FOUND"
    assert client.get(f"/api/v1/sale_car/{listing_id}", headers=seller).json()["price"] is None


def test_should_delete_own_listing(client, seller):
    listing_id = _create(client, seller)

    deleted = client.delete(f"/api/v1/sale_car/{listing_id}", headers=seller)

    assert deleted.status_code == 204, deleted.text
    assert client.get(f"/api/v1/sale_car/{listing_id}", headers=seller).status_code == 404
    mine = client.get("/api/v1/sale_car/user", headers=seller).json()
    assert listing_id not in [car["sale_car_id"] for car in mine]


def test_should_not_let_a_stranger_delete_a_listing(client, seller, signed_in):
    listing_id = _create(client, seller)

    deleted = client.delete(f"/api/v1/sale_car/{listing_id}", headers=signed_in())

    assert deleted.status_code == 403, deleted.text
    assert deleted.json()["code"] == "NOT_LISTING_OWNER"
    assert client.get(f"/api/v1/sale_car/{listing_id}", headers=seller).status_code == 200


def test_should_answer_404_for_a_listing_that_never_existed(client, seller):
    absent = client.delete(
        "/api/v1/sale_car/00000000-0000-0000-0000-000000000000", headers=seller
    )

    assert absent.status_code == 404, absent.text
    assert absent.json()["code"] == "LISTING_NOT_FOUND"


def test_should_keep_visibility_switches_as_ordinary_fields(client, seller):
    listing_id = _create(client, seller)

    switched = client.patch(
        f"/api/v1/sale_car/{listing_id}",
        headers=seller,
        json={"phone_visible": False, "chat_allowed": False, "offers_visible": False},
    )

    assert switched.status_code == 200, switched.text
    listing = client.get(f"/api/v1/sale_car/{listing_id}", headers=seller).json()
    assert listing["phone_visible"] is False
    assert listing["chat_allowed"] is False
    assert listing["offers_visible"] is False


def test_should_delete_a_listing_with_its_photographs(client, seller, attach_photo):
    listing_id = _create(client, seller)
    attach_photo(listing_id, seller, count=2)

    deleted = client.delete(f"/api/v1/sale_car/{listing_id}", headers=seller)

    assert deleted.status_code == 204, deleted.text
    assert client.get(f"/api/v1/sale_car/{listing_id}", headers=seller).status_code == 404


def test_should_delete_a_listing_that_carries_a_document(client, seller, image_bytes):
    listing_id = _create(client, seller)
    attached = client.post(
        f"/api/v1/sale_car/{listing_id}/sts",
        headers=seller,
        files={"file": ("sts.png", image_bytes(), "image/png")},
    )
    assert attached.status_code == 202, attached.text

    deleted = client.delete(f"/api/v1/sale_car/{listing_id}", headers=seller)

    assert deleted.status_code == 204, deleted.text
