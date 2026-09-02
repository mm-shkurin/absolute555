"""Rules that guard the gallery rather than describe it.

Story 5, Tier 2: the order that must match, the upload that leaves nothing behind, the
preview, and the two hazards -- two uploads racing on one gallery, and a request that
could never fit.
"""

from concurrent.futures import ThreadPoolExecutor

import pytest

from tests.conftest import make_image
from tests.test_listing_gallery import _gallery, _upload
from tests.test_listing_lifecycle import _create, _fill


def test_should_refuse_an_order_that_does_not_match_what_is_held(client, seller, attach_photo):
    listing_id = _create(client, seller)
    photos = attach_photo(listing_id, seller, count=3)
    original = [photo["photo_id"] for photo in photos]

    response = client.put(
        f"/api/v1/sale_car/{listing_id}/photos/order",
        headers=seller,
        json={"photo_ids": [original[1], original[0], "a-photo-from-somewhere-else"]},
    )

    assert response.status_code == 422, response.text
    assert response.json()["code"] == "ORDER_MISMATCH"
    details = response.json()["details"]
    assert details["missing"] == [original[2]]
    assert details["unknown"] == ["a-photo-from-somewhere-else"]
    assert [photo["photo_id"] for photo in _gallery(client, seller, listing_id)] == original


def test_should_refuse_an_order_that_repeats_a_photograph(client, seller, attach_photo):
    listing_id = _create(client, seller)
    photos = attach_photo(listing_id, seller, count=2)
    first = photos[0]["photo_id"]

    response = client.put(
        f"/api/v1/sale_car/{listing_id}/photos/order", headers=seller, json={"photo_ids": [first, first]}
    )

    assert response.status_code == 422
    assert len(_gallery(client, seller, listing_id)) == 2


def test_should_leave_nothing_behind_when_an_upload_is_refused(client, seller, attach_photo):
    listing_id = _create(client, seller)
    attach_photo(listing_id, seller, count=2)

    response = client.post(
        f"/api/v1/sale_car/{listing_id}/photos",
        headers=seller,
        files=[
            ("files", ("good1.png", make_image(), "image/png")),
            ("files", ("good2.png", make_image(), "image/png")),
            ("files", ("bad.png", b"not an image at all", "image/png")),
        ],
    )

    assert response.status_code == 422, response.text
    assert len(_gallery(client, seller, listing_id)) == 2


def test_should_refuse_an_upload_carrying_no_files(client, seller):
    listing_id = _create(client, seller)

    response = client.post(f"/api/v1/sale_car/{listing_id}/photos", headers=seller, files=[])

    assert response.status_code == 422, response.text
    assert response.json()["code"] in ("NO_FILES_GIVEN", "VALIDATION_ERROR")


def test_should_let_a_published_listing_be_rearranged(
    client, seller, moderator, catalogue, attach_photo
):
    listing_id = _create(client, seller)
    _fill(client, seller, listing_id, *catalogue, attach_photo)
    client.post(f"/api/v1/sale_car/{listing_id}/submit", headers=seller)
    client.post(f"/api/v1/sale_car/{listing_id}/approve", headers=moderator)
    photos = _gallery(client, seller, listing_id)
    wanted = [photos[2]["photo_id"], photos[0]["photo_id"], photos[1]["photo_id"]]

    response = client.put(
        f"/api/v1/sale_car/{listing_id}/photos/order", headers=seller, json={"photo_ids": wanted}
    )

    assert response.status_code == 200, response.text
    assert [photo["photo_id"] for photo in response.json()["photos"]] == wanted
    assert client.get(f"/api/v1/sale_car/{listing_id}").json()["status"] == "published"


def test_should_store_a_smaller_copy_beside_every_photograph(client, seller):
    listing_id = _create(client, seller)

    response = _upload(client, seller, listing_id, body=make_image(2400, 1800))

    photo = response.json()["photos"][0]
    assert photo["preview_url"] != photo["url"]
    assert photo["preview_url"].endswith(".jpg") or "previews/" in photo["preview_url"]


def test_should_return_the_gallery_in_order_to_anyone(
    client, seller, moderator, catalogue, attach_photo
):
    listing_id = _create(client, seller)
    _fill(client, seller, listing_id, *catalogue, attach_photo)
    client.post(f"/api/v1/sale_car/{listing_id}/submit", headers=seller)
    client.post(f"/api/v1/sale_car/{listing_id}/approve", headers=moderator)
    expected = [photo["photo_id"] for photo in _gallery(client, seller, listing_id)]

    listing = client.get(f"/api/v1/sale_car/{listing_id}").json()

    assert [photo["photo_id"] for photo in listing["photos"]] == expected
    assert listing["preview_photo_url"] == listing["photos"][0]["preview_url"]


def test_should_not_overfill_the_gallery_when_two_uploads_race(client, seller, attach_photo):
    listing_id = _create(client, seller)
    attach_photo(listing_id, seller, count=14)

    with ThreadPoolExecutor(max_workers=2) as pool:
        calls = [pool.submit(_upload, client, seller, listing_id) for _ in range(2)]
        outcomes = sorted(call.result().status_code for call in calls)

    assert outcomes == [200, 409]
    assert len(_gallery(client, seller, listing_id)) == 15


def test_should_refuse_a_request_larger_than_the_gallery_could_ever_hold(client, seller):
    listing_id = _create(client, seller)

    response = _upload(client, seller, listing_id, count=16)

    assert response.status_code == 409, response.text
    assert response.json()["code"] == "GALLERY_LIMIT_REACHED"
    assert _gallery(client, seller, listing_id) == []
