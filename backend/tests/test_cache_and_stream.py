"""The two pieces of plumbing everything else leans on: the cache and the event stream.

Neither has a caller that would fail loudly. A cache that quietly stops storing looks
exactly like a cold one, and a stream that ends without saying why looks like a client
that went away — so both are held here directly.
"""

import uuid

import pytest

from app.services.cache_service import CacheService

pytestmark = pytest.mark.asyncio


@pytest.fixture
def cache():
    service = CacheService()
    if service.redis_client is None:
        pytest.skip("no redis")
    return service


async def test_should_give_back_what_it_was_given(cache):
    document = str(uuid.uuid4())

    stored = await cache.set("test", document, {"vin": "X" * 17, "year": 2012})

    assert stored is True
    assert await cache.get("test", document) == {"vin": "X" * 17, "year": 2012}


async def test_should_report_nothing_for_a_key_it_never_held(cache):
    assert await cache.get("test", str(uuid.uuid4())) is None


async def test_should_forget_a_key_on_request(cache):
    document = str(uuid.uuid4())
    await cache.set("test", document, {"kept": False})

    assert await cache.delete("test", document) is True
    assert await cache.get("test", document) is None


async def test_should_forget_a_batch_and_count_what_it_forgot(cache):
    documents = [str(uuid.uuid4()) for _ in range(3)]
    for document in documents:
        await cache.set("test", document, {"n": 1})

    removed = await cache.delete_many("test", documents + [str(uuid.uuid4())])

    assert removed == 3


async def test_should_keep_two_prefixes_apart(cache):
    document = str(uuid.uuid4())
    await cache.set("one", document, {"which": "one"})
    await cache.set("two", document, {"which": "two"})

    assert (await cache.get("one", document))["which"] == "one"
    assert (await cache.get("two", document))["which"] == "two"


def test_should_refuse_the_stream_to_a_caller_who_has_not_signed_in(client):
    """Story 11 shut this: it used to answer anyone who could spell an identifier."""
    assert client.get("/api/v1/task/sse/not-a-uuid").status_code == 401


def test_should_report_a_listing_that_is_not_one_before_opening_a_stream(client, seller):
    response = client.get("/api/v1/task/sse/not-a-uuid", headers=seller)

    assert response.status_code == 404, response.text
    assert response.json()["code"] == "LISTING_NOT_FOUND"
