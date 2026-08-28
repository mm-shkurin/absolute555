"""What the outside world hears when a listing changes status.

Story 4, int-01 and int-02. The Telegram channel is told; a channel that cannot be
reached is a lost notification and never an undone sale.
"""

import pytest

from app.services.webhook_service import WebhookService
from tests.test_listing_lifecycle import _create, _publish, _status


@pytest.fixture
def announcements(monkeypatch):
    sent = []

    async def _record(self, sale_car_id, old_status, new_status, sale_car_data=None):
        sent.append({"sale_car_id": sale_car_id, "old": old_status, "new": new_status})

    monkeypatch.setattr(WebhookService, "send_tg_webhook_status_change", _record)
    return sent


@pytest.fixture
def failing_announcements(monkeypatch):
    async def _fail(self, sale_car_id, old_status, new_status, sale_car_data=None):
        raise RuntimeError("the channel is unreachable")

    monkeypatch.setattr(WebhookService, "send_tg_webhook_status_change", _fail)


def test_should_announce_a_status_change(
    client, seller, moderator, catalogue, attach_photo, announcements
):
    listing_id = _create(client, seller)
    _publish(client, seller, moderator, listing_id, *catalogue, attach_photo)
    announcements.clear()

    client.post(f"/api/v1/sale_car/{listing_id}/sold", headers=seller)

    assert len(announcements) == 1
    assert announcements[0] == {"sale_car_id": listing_id, "old": "published", "new": "sold"}


def test_should_complete_a_status_change_the_channel_did_not_hear(
    client, seller, moderator, catalogue, attach_photo, failing_announcements
):
    listing_id = _create(client, seller)
    _publish(client, seller, moderator, listing_id, *catalogue, attach_photo)

    response = client.post(f"/api/v1/sale_car/{listing_id}/sold", headers=seller)

    assert response.status_code == 200, response.text
    assert _status(client, seller, listing_id) == "sold"
