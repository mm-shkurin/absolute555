"""Two requests racing on one listing.

Story 4 and story 5, Tier 2 hazards. Each result waits a bounded time: a deadlock in the
row lock must fail the run, not hang it.
"""

from concurrent.futures import ThreadPoolExecutor

from tests.test_listing_gallery import _gallery, _upload
from tests.test_listing_lifecycle import _create, _publish, _status

RACE_TIMEOUT_SECONDS = 30


def test_should_not_overfill_the_gallery_when_two_uploads_race(client, seller, attach_photo):
    listing_id = _create(client, seller)
    attach_photo(listing_id, seller, count=14)

    with ThreadPoolExecutor(max_workers=2) as pool:
        calls = [pool.submit(_upload, client, seller, listing_id) for _ in range(2)]
        outcomes = sorted(call.result(timeout=RACE_TIMEOUT_SECONDS).status_code for call in calls)

    assert outcomes == [200, 409]
    assert len(_gallery(client, seller, listing_id)) == 15


def test_should_leave_one_status_when_two_actions_race(
    client, seller, moderator, catalogue, attach_photo
):
    listing_id = _create(client, seller)
    _publish(client, seller, moderator, listing_id, *catalogue, attach_photo)

    # Two threads, one listing: the second action must read a status the first has
    # already changed, which sequential calls would demonstrate by construction.
    actions = {"withdraw": "withdrawn", "sold": "sold"}
    with ThreadPoolExecutor(max_workers=2) as pool:
        calls = {
            action: pool.submit(
                client.post, f"/api/v1/sale_car/{listing_id}/{action}", headers=seller
            )
            for action in actions
        }
        responses = {
            action: call.result(timeout=RACE_TIMEOUT_SECONDS) for action, call in calls.items()
        }

    assert sorted(response.status_code for response in responses.values()) == [200, 409]
    winner = next(action for action, response in responses.items() if response.status_code == 200)
    assert _status(client, seller, listing_id) == actions[winner]
