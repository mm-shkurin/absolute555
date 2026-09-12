"""Разовое чтение из кэша и ключи, живущие врозь.

`take` существует ради «один раз значит один раз»: чтение и удаление в одном обращении.
Get и следом delete — это два обращения, и между ними два инстанса успевают прочитать
один и тот же одноразовый ключ.
"""

import uuid

import pytest

from app.shared.storage.cache_service import CacheService

pytestmark = pytest.mark.asyncio


@pytest.fixture
def cache():
    service = CacheService()
    if service.redis_client is None:
        pytest.skip("no redis")
    return service


async def test_should_hand_the_value_over_once(cache):
    key = str(uuid.uuid4())
    await cache.set("once", key, {"code": "abc"})

    assert await cache.take("once", key) == {"code": "abc"}
    assert await cache.take("once", key) is None


async def test_should_report_nothing_when_there_was_nothing(cache):
    assert await cache.take("once", str(uuid.uuid4())) is None


async def test_should_leave_neighbours_alone(cache):
    mine, theirs = str(uuid.uuid4()), str(uuid.uuid4())
    await cache.set("once", mine, {"who": "mine"})
    await cache.set("once", theirs, {"who": "theirs"})

    await cache.take("once", mine)

    assert await cache.get("once", theirs) == {"who": "theirs"}


async def test_should_forget_a_key_when_its_time_is_up(cache):
    key = str(uuid.uuid4())

    await cache.set("short", key, {"value": 1}, ttl=1)

    assert await cache.get("short", key) == {"value": 1}
    remaining = cache.redis_client.ttl(cache._get_key("short", key))
    assert 0 < remaining <= 1


async def test_should_keep_cyrillic_readable(cache):
    key = str(uuid.uuid4())

    await cache.set("text", key, {"mark": "Тойота"})

    assert (await cache.get("text", key))["mark"] == "Тойота"


async def test_should_count_what_a_batch_removed(cache):
    keys = [str(uuid.uuid4()) for _ in range(3)]
    for key in keys:
        await cache.set("batch", key, {"n": 1})

    removed = await cache.delete_many("batch", keys + [str(uuid.uuid4())])

    assert removed == 3
    for key in keys:
        assert await cache.get("batch", key) is None


async def test_should_do_nothing_for_an_empty_batch(cache):
    assert await cache.delete_many("batch", []) == 0


async def test_should_answer_calmly_with_no_redis_at_all():
    """Кэш недоступен — это холодный кэш, а не отказ сервиса."""
    service = CacheService()
    service.redis_client = None

    assert await service.get("test", "id") is None
    assert await service.set("test", "id", {}) is False
    assert await service.take("test", "id") is None
    assert await service.delete("test", "id") is False
    assert await service.delete_many("test", ["id"]) == 0
