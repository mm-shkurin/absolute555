"""Что уезжает в канал вместе с объявлением, и что делает неудачная отправка.

Задача 5 бэклога. Оповещение канала лежит вне цикла запроса, поэтому HTTP-тесты до него
не дотягиваются: проверяется здесь, вызовом того же кода, что зовёт публикация.
"""

import pytest

from app.features.listing.models.sale_car import SaleCars
from app.features.listing.services import listing_webhook


class _Named:
    def __init__(self, **fields):
        self.__dict__.update(fields)


def _listing(**overrides) -> SaleCars:
    listing = SaleCars(
        sale_car_id="11111111-1111-1111-1111-111111111111",
        user_id="22222222-2222-2222-2222-222222222222",
        price=900000.0,
        milleage=120000.0,
        phone_number="+79000000000",
        vin="XTA210990",
        description="машина",
        year=2015,
        transmission="МКПП",
        engine_power=98,
        photos=[{"photo_id": "p1", "key": "cars/one.jpg"}],
    )
    for name, value in overrides.items():
        setattr(listing, name, value)
    return listing


def test_should_carry_the_fields_the_channel_shows():
    payload = listing_webhook.to_payload(_listing())

    assert payload["vin"] == "XTA210990"
    assert payload["price"] == 900000.0
    assert payload["year"] == 2015
    assert payload["photo_count"] == 1
    assert payload["listing_url"].endswith("/cars/11111111-1111-1111-1111-111111111111")


def test_should_name_the_make_and_model_in_words():
    """Канал читают люди: ключи справочника им ничего не говорят."""
    listing = _listing()
    listing.brand = _Named(name_ru="Тойота")
    listing.model = _Named(name="Королла")

    payload = listing_webhook.to_payload(listing)

    assert payload["brand"] == "Тойота"
    assert payload["model"] == "Королла"


def test_should_say_nothing_about_a_make_that_was_never_resolved():
    payload = listing_webhook.to_payload(_listing())

    assert payload["brand"] is None
    assert payload["model"] is None


def test_should_count_every_photograph():
    listing = _listing(photos=[{"key": "a.jpg"}, {"key": "b.jpg"}, {"key": "c.jpg"}])

    payload = listing_webhook.to_payload(listing)

    assert payload["photo_count"] == 3
    assert len(payload["photo_urls"]) == 3


@pytest.mark.asyncio
async def test_should_not_announce_a_listing_without_photographs():
    """Объявление без снимка в канале выглядит как ошибка, а не как объявление."""
    announced = await listing_webhook.announce_when_ready(None, _listing(photos=[]))

    assert announced is False


@pytest.mark.asyncio
async def test_should_survive_a_channel_that_did_not_answer(monkeypatch):
    """Неудачное оповещение не должно ронять публикацию: канал ей не хозяин."""

    class _Broken:
        def __init__(self, db):
            pass

        async def send_tg_webhook(self, **kwargs):
            raise RuntimeError("канал недоступен")

    monkeypatch.setattr(listing_webhook, "WebhookService", _Broken)

    announced = await listing_webhook.announce_when_ready(None, _listing())

    assert announced is False
