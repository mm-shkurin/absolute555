"""Объявление, ушедшее в телеграм-канал.

Канал — сторонний получатель, и правило одно: он не должен уметь ронять публикацию.
Поэтому проверяется, что недоступный вебхук — это `False` и запись в журнале, а не
исключение наверх, и что в теле уезжает то, что нужно каналу, а не вся строка.
"""

import httpx
import pytest

from app.features.listing.models.sale_car import SaleCars
from app.features.recognition.services import webhook_service as webhook_module
from app.features.recognition.services.webhook_service import WebhookService
from app.features.listing.services.listing_webhook import announce_when_ready, to_payload

LISTING = "00000000-0000-4000-8000-000000000000"
SELLER = "00000000-0000-4000-8000-00000000000b"


class _Recorder:
    """Клиент вместо httpx: помнит, куда и что ушло."""

    def __init__(self, fail: bool = False):
        self.calls = []
        self.fail = fail

    def __call__(self, *args, **kwargs):
        return self

    async def __aenter__(self):
        return self

    async def __aexit__(self, *exc):
        return False

    async def post(self, url, json=None, headers=None):
        if self.fail:
            raise httpx.ConnectError("канал недоступен")
        self.calls.append({"url": url, "json": json, "headers": headers})
        return httpx.Response(200, request=httpx.Request("POST", url))


@pytest.fixture
def channel(monkeypatch):
    recorder = _Recorder()
    monkeypatch.setattr(webhook_module.httpx, "AsyncClient", recorder)
    monkeypatch.setattr(
        webhook_module.webhook_settings, "tg_webhook_url", "https://example.invalid/hook"
    )
    return recorder


def _listing(**fields) -> SaleCars:
    listing = SaleCars()
    listing.sale_car_id = LISTING
    listing.user_id = SELLER
    for name, value in fields.items():
        setattr(listing, name, value)
    return listing


async def test_should_announce_a_ready_listing(channel):
    await WebhookService(None).send_tg_webhook(LISTING, {"price": 100.0})

    assert channel.calls, "в канал ничего не ушло"
    body = channel.calls[0]["json"]
    assert body["event"] == "sale_car_ready"
    assert body["sale_car_id"] == LISTING
    assert body["data"] == {"price": 100.0}
    assert channel.calls[0]["headers"]["X-Webhook-Secret"]


async def test_should_tell_the_channel_a_listing_is_gone(channel):
    await WebhookService(None).send_tg_webhook_delete(LISTING)

    assert channel.calls[0]["json"]["event"] == "sale_car_deleted"


async def test_should_tell_the_channel_both_sides_of_a_status_change(channel):
    await WebhookService(None).send_tg_webhook_status_change(
        LISTING, "moderation", "active", {"price": 1.0}
    )

    body = channel.calls[0]["json"]
    assert body["event"] == "sale_car_status_changed"
    assert (body["old_status"], body["new_status"]) == ("moderation", "active")
    assert body["data"] == {"price": 1.0}


async def test_should_leave_the_data_out_when_there_is_none(channel):
    await WebhookService(None).send_tg_webhook_status_change(LISTING, "active", "sold")

    assert "data" not in channel.calls[0]["json"]


async def test_should_stay_silent_when_no_channel_is_configured(monkeypatch, channel):
    monkeypatch.setattr(webhook_module.webhook_settings, "tg_webhook_url", None)

    await WebhookService(None).send_tg_webhook(LISTING, {})
    await WebhookService(None).send_tg_webhook_delete(LISTING)
    await WebhookService(None).send_tg_webhook_status_change(LISTING, "a", "b")

    assert channel.calls == []


async def test_should_swallow_a_channel_that_is_down(monkeypatch):
    monkeypatch.setattr(webhook_module.httpx, "AsyncClient", _Recorder(fail=True))
    monkeypatch.setattr(
        webhook_module.webhook_settings, "tg_webhook_url", "https://example.invalid/hook"
    )

    # Публикация не должна падать оттого, что телеграм недоступен.
    await WebhookService(None).send_tg_webhook(LISTING, {})


async def test_should_not_announce_a_listing_without_photographs(channel):
    announced = await announce_when_ready(None, _listing(photos=[]))

    assert announced is False
    assert channel.calls == []


async def test_should_announce_a_listing_that_has_a_photograph(channel):
    announced = await announce_when_ready(WebhookService(None), _listing(photos=[{"key": "photos/one.jpg"}]))

    assert announced is True
    assert channel.calls[0]["json"]["data"]["photo_count"] == 1


async def test_should_report_a_failed_announcement_rather_than_raise(monkeypatch):
    async def _explode(self, **kwargs):
        raise RuntimeError("канал недоступен")

    monkeypatch.setattr(WebhookService, "send_tg_webhook", _explode)

    assert await announce_when_ready(WebhookService(None), _listing(photos=[{"key": "photos/one.jpg"}])) is False


def test_should_carry_only_what_the_channel_shows():
    payload = to_payload(
        _listing(
            photos=[{"key": "photos/one.jpg"}, {"key": "photos/two.jpg"}],
            price=990000.0,
            milleage=120000.0,
            phone_number="+79990001122",
            vin="JTMHV05J204123456",
            description="Один владелец",
            year=2012,
            transmission="автомат",
            engine_power=181,
        )
    )

    assert payload["photo_count"] == 2
    assert len(payload["photo_urls"]) == 2
    assert payload["listing_url"].endswith(f"/cars/{LISTING}")
    assert payload["year"] == 2012
    # Марка и модель — связи; у строки без них в теле пусто, а не падение.
    assert payload["brand"] is None and payload["model"] is None


def test_should_survive_a_listing_whose_photo_list_was_never_set():
    payload = to_payload(_listing(photos=None))

    assert payload["photo_count"] == 0
    assert payload["photo_urls"] == []
