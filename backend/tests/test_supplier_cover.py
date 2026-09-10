"""Фото витрины поставщика: поставить, показать на витрине, снять."""

from tests.conftest import make_image
from tests.test_supplier_profile import importer  # noqa: F401


def _upload(client, headers, body=None):
    return client.put(
        "/api/v1/supplier/me/cover",
        headers=headers,
        files={"file": ("cover.png", body or make_image(), "image/png")},
    )


def test_should_show_the_cover_the_supplier_uploaded(client, importer):
    uploaded = _upload(client, importer)

    assert uploaded.status_code == 200, uploaded.text
    assert uploaded.json()["cover_url"]
    mine = client.get("/api/v1/supplier/me", headers=importer).json()
    assert mine["cover_url"] == uploaded.json()["cover_url"]
    # Ключ хранилища на провод не едет: наружу уходит только адрес.
    assert "cover_key" not in mine


def test_should_refuse_a_cover_that_is_not_an_image(client, importer):
    refused = _upload(client, importer, body=b"not a picture at all")

    assert refused.status_code == 422, refused.text
    assert refused.json()["code"] == "NOT_AN_IMAGE"


def test_should_take_the_cover_back_off(client, importer):
    _upload(client, importer)

    dropped = client.delete("/api/v1/supplier/me/cover", headers=importer)

    assert dropped.status_code == 200, dropped.text
    assert dropped.json()["cover_url"] is None


def test_should_refuse_a_cover_to_someone_who_is_not_a_supplier(client, seller):
    assert _upload(client, seller).status_code == 403
