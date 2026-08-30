"""The registration document: where it lives, who may read it, how long the link lasts.

Story 5, Tier 2. The scan is a document, not a shop window: it lives in the closed bucket,
leaves only as a signed link with an expiry, and is discarded once a moderator has decided.
"""

import time
import uuid

import pytest
from sqlalchemy import text

from app.core.config import MinioSettings, PhotoSettings
from app.db.database import get_db_session
from app.services.s3_service import s3_service
from tests.conftest import make_image
from tests.test_listing_lifecycle import _create, _fill

pytestmark = []


@pytest.fixture
def with_document(client):
    """Put a scan on a listing the way the СТС upload does, and hand back its key."""

    def _attach(listing_id: str) -> str:
        async def _store():
            async with get_db_session() as session:
                key = await s3_service.put_document(listing_id, make_image(), "image/png")
                await session.execute(
                    text("UPDATE sale_cars SET sts_key = :key WHERE sale_car_id = :id"),
                    {"key": key, "id": uuid.UUID(listing_id)},
                )
                await session.commit()
                return key

        import asyncio

        return asyncio.run(_store())

    return _attach


def test_should_hand_the_owner_a_signed_link_that_expires(client, seller, with_document):
    listing_id = _create(client, seller)
    with_document(listing_id)

    response = client.get(f"/api/v1/sale_car/{listing_id}/sts", headers=seller)

    assert response.status_code == 200, response.text
    body = response.json()
    assert "X-Amz-Signature" in body["url"] or "Signature" in body["url"]
    assert body["expires_at"]


def test_should_keep_the_document_out_of_the_public_gallery_bucket(client, seller, with_document):
    listing_id = _create(client, seller)
    key = with_document(listing_id)

    settings = MinioSettings()
    assert settings.minio_documents_bucket != settings.minio_bucket_name
    # Reading it without a signature is what a stranger with the URL would try.
    with pytest.raises(Exception):
        s3_service.s3_client.get_object(Bucket=settings.minio_bucket_name, Key=key)


def test_should_refuse_a_stranger_asking_for_the_document(
    client, seller, signed_in, with_document
):
    listing_id = _create(client, seller)
    with_document(listing_id)
    stranger = signed_in()

    response = client.get(f"/api/v1/sale_car/{listing_id}/sts", headers=stranger)

    assert response.status_code == 404
    assert "http" not in response.text


def test_should_refuse_an_unauthenticated_caller_asking_for_the_document(
    client, seller, with_document
):
    listing_id = _create(client, seller)
    with_document(listing_id)

    response = client.get(f"/api/v1/sale_car/{listing_id}/sts")

    assert response.status_code == 401


def test_should_let_a_moderator_read_the_document_under_review(
    client, seller, moderator, catalogue, attach_photo, with_document
):
    listing_id = _create(client, seller)
    _fill(client, seller, listing_id, *catalogue, attach_photo)
    with_document(listing_id)
    client.post(f"/api/v1/sale_car/{listing_id}/submit", headers=seller)

    response = client.get(f"/api/v1/sale_car/{listing_id}/sts", headers=moderator)

    assert response.status_code == 200, response.text


def test_should_discard_the_document_once_a_moderator_has_decided(
    client, seller, moderator, catalogue, attach_photo, with_document
):
    listing_id = _create(client, seller)
    _fill(client, seller, listing_id, *catalogue, attach_photo)
    with_document(listing_id)
    client.post(f"/api/v1/sale_car/{listing_id}/submit", headers=seller)

    client.post(f"/api/v1/sale_car/{listing_id}/approve", headers=moderator)

    response = client.get(f"/api/v1/sale_car/{listing_id}/sts", headers=seller)
    assert response.status_code == 404
    assert response.json()["code"] == "LISTING_NOT_FOUND"


def test_should_discard_the_document_when_a_listing_is_rejected(
    client, seller, moderator, catalogue, attach_photo, with_document
):
    listing_id = _create(client, seller)
    _fill(client, seller, listing_id, *catalogue, attach_photo)
    with_document(listing_id)
    client.post(f"/api/v1/sale_car/{listing_id}/submit", headers=seller)

    client.post(
        f"/api/v1/sale_car/{listing_id}/reject",
        headers=moderator,
        json={"reason": "the plate is readable"},
    )

    assert client.get(f"/api/v1/sale_car/{listing_id}/sts", headers=seller).status_code == 404


def test_should_link_only_for_as_long_as_configured(client, seller, with_document):
    listing_id = _create(client, seller)
    with_document(listing_id)

    response = client.get(f"/api/v1/sale_car/{listing_id}/sts", headers=seller)

    # boto3 signs MinIO with the v2 scheme here, so the deadline is an absolute Expires
    # rather than a duration. What matters is that there is one and it is near.
    from urllib.parse import parse_qs, urlparse

    query = parse_qs(urlparse(response.json()["url"]).query)
    deadline = int(query["Expires"][0])
    ttl = PhotoSettings().document_link_ttl_seconds
    assert 0 < deadline - int(time.time()) <= ttl
