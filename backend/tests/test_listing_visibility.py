"""Who may see and move a listing that is not published.

Story 4, scenarios sec-01 to sec-03. A stranger walking identifiers must not be able to
tell a listing that exists from one that never did, which is why an unpublished listing
answers 404 and not 403.
"""

from tests.test_listing_lifecycle import _create, _fill


def test_should_hide_a_draft_from_everyone_but_its_owner(client, seller, signed_in):
    listing_id = _create(client, seller)
    stranger = signed_in()

    response = client.get(f"/api/v1/sale_car/{listing_id}", headers=stranger)

    assert response.status_code == 404
    assert response.json() == {"detail": "Sale car not found"}


def test_should_answer_a_stranger_and_an_unknown_identifier_alike(client, seller, signed_in):
    listing_id = _create(client, seller)
    stranger = signed_in()
    never_issued = "00000000-0000-4000-8000-000000000000"

    mine = client.get(f"/api/v1/sale_car/{listing_id}", headers=stranger)
    unknown = client.get(f"/api/v1/sale_car/{never_issued}", headers=stranger)

    assert (mine.status_code, mine.json()) == (unknown.status_code, unknown.json())


def test_should_refuse_a_stranger_moving_someone_elses_listing(
    client, seller, moderator, signed_in, catalogue, attach_photo
):
    listing_id = _create(client, seller)
    _fill(client, seller, listing_id, *catalogue, attach_photo)
    client.post(f"/api/v1/sale_car/{listing_id}/submit", headers=seller)
    client.post(f"/api/v1/sale_car/{listing_id}/approve", headers=moderator)
    stranger = signed_in()

    response = client.post(f"/api/v1/sale_car/{listing_id}/withdraw", headers=stranger)

    assert response.status_code == 404
    assert client.get(f"/api/v1/sale_car/{listing_id}").json()["status"] == "published"


def test_should_refuse_an_unauthenticated_lifecycle_action(
    client, seller, moderator, catalogue, attach_photo
):
    listing_id = _create(client, seller)
    _fill(client, seller, listing_id, *catalogue, attach_photo)
    client.post(f"/api/v1/sale_car/{listing_id}/submit", headers=seller)
    client.post(f"/api/v1/sale_car/{listing_id}/approve", headers=moderator)

    response = client.post(f"/api/v1/sale_car/{listing_id}/withdraw")

    assert response.status_code == 401
    assert client.get(f"/api/v1/sale_car/{listing_id}").json()["status"] == "published"


def test_should_refuse_a_moderator_action_from_an_ordinary_seller(
    client, seller, catalogue, attach_photo
):
    listing_id = _create(client, seller)
    _fill(client, seller, listing_id, *catalogue, attach_photo)
    client.post(f"/api/v1/sale_car/{listing_id}/submit", headers=seller)

    response = client.post(f"/api/v1/sale_car/{listing_id}/approve", headers=seller)

    assert response.status_code == 403
    assert client.get(f"/api/v1/sale_car/{listing_id}", headers=seller).json()["status"] == "moderation"
