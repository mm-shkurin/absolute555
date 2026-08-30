"""The gallery of a listing, over HTTP only.

Story 5, Tier 1. The list's order is the displayed order and its first element is the
cover; there is no separate cover field to disagree with it.
"""

import pytest

from tests.conftest import make_image
from tests.test_listing_lifecycle import _create, _fill, _status


def _upload(client, headers, listing_id, count=1, body=None, name="photo.png", mime="image/png"):
    payload = body if body is not None else make_image()
    files = [("files", (f"{index}-{name}", payload, mime)) for index in range(count)]
    return client.post(f"/api/v1/sale_car/{listing_id}/photos", headers=headers, files=files)


def _gallery(client, headers, listing_id):
    return client.get(f"/api/v1/sale_car/{listing_id}", headers=headers).json()["photos"]


def test_should_add_a_photograph_and_make_it_the_cover(client, seller):
    listing_id = _create(client, seller)

    response = _upload(client, seller, listing_id)

    assert response.status_code == 200, response.text
    photos = response.json()["photos"]
    assert len(photos) == 1
    assert photos[0]["url"] and photos[0]["preview_url"]
    assert client.get(f"/api/v1/sale_car/{listing_id}", headers=seller).json()[
        "preview_photo_url"
    ] == photos[0]["preview_url"]


def test_should_keep_photographs_in_the_order_they_arrived(client, seller, attach_photo):
    listing_id = _create(client, seller)
    first_two = attach_photo(listing_id, seller, count=2)

    response = _upload(client, seller, listing_id, count=3)

    photos = response.json()["photos"]
    assert len(photos) == 5
    assert [photo["photo_id"] for photo in photos[:2]] == [p["photo_id"] for p in first_two]


def test_should_rearrange_the_gallery_and_move_the_cover_with_it(client, seller, attach_photo):
    listing_id = _create(client, seller)
    photos = attach_photo(listing_id, seller, count=4)
    wanted = [photos[2]["photo_id"], photos[0]["photo_id"], photos[1]["photo_id"], photos[3]["photo_id"]]

    response = client.put(
        f"/api/v1/sale_car/{listing_id}/photos/order", headers=seller, json={"photo_ids": wanted}
    )

    assert response.status_code == 200, response.text
    assert [photo["photo_id"] for photo in response.json()["photos"]] == wanted
    listing = client.get(f"/api/v1/sale_car/{listing_id}", headers=seller).json()
    assert listing["preview_photo_url"] == photos[2]["preview_url"]


def test_should_close_the_order_when_a_photograph_is_removed(client, seller, attach_photo):
    listing_id = _create(client, seller)
    photos = attach_photo(listing_id, seller, count=4)

    response = client.delete(
        f"/api/v1/sale_car/{listing_id}/photos/{photos[1]['photo_id']}", headers=seller
    )

    assert response.status_code == 200, response.text
    remaining = [photo["photo_id"] for photo in response.json()["photos"]]
    assert remaining == [photos[0]["photo_id"], photos[2]["photo_id"], photos[3]["photo_id"]]

    client.delete(f"/api/v1/sale_car/{listing_id}/photos/{photos[0]['photo_id']}", headers=seller)
    listing = client.get(f"/api/v1/sale_car/{listing_id}", headers=seller).json()
    assert listing["photos"][0]["photo_id"] == photos[2]["photo_id"]
    assert listing["preview_photo_url"] == listing["photos"][0]["preview_url"]


def test_should_hold_no_more_than_fifteen_photographs(client, seller, attach_photo):
    listing_id = _create(client, seller)
    attach_photo(listing_id, seller, count=14)

    refused = _upload(client, seller, listing_id, count=3)

    assert refused.status_code == 409, refused.text
    assert refused.json()["code"] == "GALLERY_LIMIT_REACHED"
    assert refused.json()["details"] == {"limit": 15, "current": 14, "offered": 3}
    assert len(_gallery(client, seller, listing_id)) == 14

    assert _upload(client, seller, listing_id).status_code == 200
    assert len(_gallery(client, seller, listing_id)) == 15
    assert _upload(client, seller, listing_id).status_code == 409


def test_should_refuse_a_photograph_over_ten_megabytes(client, seller):
    listing_id = _create(client, seller)
    oversized = b"\x89PNG\r\n\x1a\n" + b"0" * (11 * 1024 * 1024)

    response = _upload(client, seller, listing_id, body=oversized)

    assert response.status_code == 413, response.text
    assert response.json()["code"] == "PHOTO_TOO_LARGE"
    assert _gallery(client, seller, listing_id) == []


def test_should_refuse_a_file_that_is_not_an_image_whatever_it_is_called(client, seller):
    listing_id = _create(client, seller)

    response = _upload(
        client, seller, listing_id, body=b"this is not an image", name="photo.jpg", mime="image/jpeg"
    )

    assert response.status_code == 422, response.text
    assert response.json()["code"] == "NOT_AN_IMAGE"
    assert _gallery(client, seller, listing_id) == []


def test_should_freeze_the_gallery_of_a_listing_under_review(
    client, seller, catalogue, attach_photo
):
    listing_id = _create(client, seller)
    _fill(client, seller, listing_id, *catalogue, attach_photo)
    photos = _gallery(client, seller, listing_id)
    client.post(f"/api/v1/sale_car/{listing_id}/submit", headers=seller)

    added = _upload(client, seller, listing_id)
    removed = client.delete(
        f"/api/v1/sale_car/{listing_id}/photos/{photos[0]['photo_id']}", headers=seller
    )

    assert added.status_code == 409 and added.json()["code"] == "LISTING_FROZEN"
    assert removed.status_code == 409 and removed.json()["code"] == "LISTING_FROZEN"
    assert len(_gallery(client, seller, listing_id)) == len(photos)


def test_should_need_three_photographs_before_review(client, seller, catalogue, attach_photo):
    listing_id = _create(client, seller)
    _fill(client, seller, listing_id, *catalogue, attach_photo, count=2)

    refused = client.post(f"/api/v1/sale_car/{listing_id}/submit", headers=seller)

    assert refused.status_code == 422, refused.text
    assert "photos" in refused.json()["details"]["missing_fields"]

    _upload(client, seller, listing_id)
    accepted = client.post(f"/api/v1/sale_car/{listing_id}/submit", headers=seller)
    assert accepted.status_code == 200, accepted.text
    assert _status(client, seller, listing_id) == "moderation"
