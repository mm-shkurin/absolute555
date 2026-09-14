"""An offer nobody answered in time.

Story 10. Three days without an answer makes an offer expired rather than rejected: the
buyer was not turned down, the seller did not answer. The scheduled job decides it, so
the job itself is what these tests run.
"""

import uuid
from datetime import datetime, timedelta

from tests.conftest import run_sql, test_session, verify_account as _verify
from tests.test_offer_lifecycle import _made, _offer, _status_of, buyer, published  # noqa: F401

def _age(offer_id, hours=100):
    """Push an offer's expiry into the past, as three days of waiting would."""
    run_sql(
        "UPDATE offers SET expires_at = :moment WHERE offer_id = :id",
        {"moment": datetime.utcnow() - timedelta(hours=hours), "id": uuid.UUID(offer_id)},
    )


def _run_expiry():
    """Run the scheduled job itself, on a connection of this test's own.

    The job is the subject, so it is called rather than reimplemented. Only its session
    is swapped: the application's engine pools, and a pooled connection belongs to the
    loop that opened it — the TestClient's loop, not this one.
    """
    import asyncio
    from contextlib import asynccontextmanager
    from unittest.mock import patch

    from app.tasks import expire_offers

    @asynccontextmanager
    async def _session():
        async with test_session()() as db:
            yield db

    async def _go():
        with patch.object(expire_offers, "get_db_session", _session):
            return await expire_offers.expire_stale_offers({})

    return asyncio.run(_go())


def test_should_expire_an_offer_nobody_answered(client, seller, published, buyer):
    _verify(seller)
    offer_id = _made(client, buyer, published())
    _age(offer_id)

    _run_expiry()

    assert _status_of(client, buyer, offer_id) == "expired"


def test_should_leave_an_offer_that_is_still_in_time(client, seller, published, signed_in):
    _verify(seller)
    listing_id = published()
    stale = _made(client, _verify(signed_in()), listing_id, price=900000.0)
    fresh = _made(client, _verify(signed_in()), listing_id, price=950000.0)
    _age(stale)

    _run_expiry()

    assert _status_of(client, seller, stale) == "expired"
    assert _status_of(client, seller, fresh) == "pending"


def test_should_refuse_to_accept_an_offer_that_has_expired(client, seller, published, buyer):
    _verify(seller)
    listing_id = published()
    offer_id = _made(client, buyer, listing_id)
    _age(offer_id)
    _run_expiry()

    response = client.patch(
        f"/api/v1/offer/{offer_id}/status", headers=seller, json={"status": "accepted"}
    )

    assert response.status_code == 409, response.text
    assert client.get(f"/api/v1/sale_car/{listing_id}").json()["status"] == "published"


def test_should_leave_settled_offers_untouched_by_the_expiry(client, seller, published, signed_in):
    _verify(seller)
    listing_id = published()
    rejected = _made(client, _verify(signed_in()), listing_id, price=900000.0)
    withdrawing = _verify(signed_in())
    withdrawn = _made(client, withdrawing, listing_id, price=950000.0)
    client.patch(f"/api/v1/offer/{rejected}/status", headers=seller, json={"status": "rejected"})
    client.post(f"/api/v1/offer/{withdrawn}/withdraw", headers=withdrawing)
    _age(rejected)
    _age(withdrawn)

    _run_expiry()

    assert _status_of(client, seller, rejected) == "rejected"
    assert _status_of(client, seller, withdrawn) == "withdrawn"


def test_should_change_nothing_when_the_expiry_runs_twice(client, seller, published, buyer):
    _verify(seller)
    offer_id = _made(client, buyer, published())
    _age(offer_id)
    _run_expiry()

    second_run = _run_expiry()

    assert second_run["expired"] == 0
    assert _status_of(client, buyer, offer_id) == "expired"


def test_should_carry_the_moment_an_offer_will_expire(client, published, buyer):
    response = _offer(client, buyer, published())

    assert response.status_code == 201, response.text
    expires_at = datetime.fromisoformat(response.json()["expires_at"])
    assert timedelta(hours=71) < expires_at - datetime.utcnow() < timedelta(hours=73)
