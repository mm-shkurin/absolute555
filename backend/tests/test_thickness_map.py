"""Карта толщиномера, по HTTP.

История 14. Замер — число и фотография экрана прибора; панель адресуется путём, поэтому
повторная запись перезаписывает её, а не заводит вторую. Статус панели считает сервер:
клиент красит карту по нему, а не по числу.
"""

import pytest

from tests.conftest import make_image
from tests.seller_rating_fixtures import id_of, publish, verify  # noqa: F401 -- фикстуры по имени
from tests.test_listing_lifecycle import _create

PANELS = [
    "hood",
    "roof",
    "trunk_lid",
    "front_left_door",
    "front_right_door",
    "rear_left_door",
    "rear_right_door",
    "front_left_fender",
    "front_right_fender",
    "rear_left_fender",
    "rear_right_fender",
    "front_bumper",
    "rear_bumper",
]


def measure(client, listing_id, headers, panel="hood", value_um=120, photo=True):
    files = {"photo": ("gauge.png", make_image(), "image/png")} if photo else None
    return client.put(
        f"/api/v1/sale_car/{listing_id}/thickness/{panel}",
        headers=headers,
        data={"value_um": value_um},
        files=files,
    )


def read_map(client, listing_id, headers=None):
    return client.get(f"/api/v1/sale_car/{listing_id}/thickness", headers=headers or {})


@pytest.fixture
def owner(seller):
    return verify(seller)


@pytest.fixture
def draft(client, owner):
    return _create(client, owner)


def test_should_record_a_measurement_on_a_panel(client, owner, draft):
    written = measure(client, draft, owner, panel="hood", value_um=120)

    assert written.status_code == 200, written.text
    body = written.json()
    assert body["measured_panels"] == 1
    assert body["total_panels"] == 13
    assert body["is_complete"] is False
    measured = body["measurements"][0]
    assert measured["panel"] == "hood"
    assert measured["value_um"] == 120
    assert measured["status"] == "factory"
    assert measured["photo_url"]


def test_should_overwrite_the_same_panel(client, owner, draft):
    measure(client, draft, owner, panel="roof", value_um=120)

    again = measure(client, draft, owner, panel="roof", value_um=340)

    assert again.status_code == 200, again.text
    body = again.json()
    assert body["measured_panels"] == 1
    assert body["measurements"][0]["value_um"] == 340
    assert body["measurements"][0]["status"] == "repaint"


def test_should_show_the_map_to_a_buyer(client, owner, publish, signed_in):
    listing_id = publish(owner)
    measure(client, listing_id, owner, panel="hood", value_um=110)

    seen = read_map(client, listing_id, signed_in())

    assert seen.status_code == 200, seen.text
    assert [one["panel"] for one in seen.json()["measurements"]] == ["hood"]


def test_should_refuse_a_measurement_without_a_photograph(client, owner, draft):
    refused = measure(client, draft, owner, photo=False)

    assert refused.status_code == 422, refused.text
    assert read_map(client, draft, owner).json()["measured_panels"] == 0


def test_should_refuse_a_panel_outside_the_set(client, owner, draft):
    refused = measure(client, draft, owner, panel="spoiler")

    assert refused.status_code == 422, refused.text


@pytest.mark.parametrize("value_um", [0, 4000])
def test_should_refuse_a_value_outside_the_range(client, owner, draft, value_um):
    refused = measure(client, draft, owner, value_um=value_um)

    assert refused.status_code == 422, refused.text
    assert read_map(client, draft, owner).json()["measured_panels"] == 0


def test_should_call_a_map_of_every_panel_complete(client, owner, draft):
    for panel in PANELS:
        assert measure(client, draft, owner, panel=panel).status_code == 200

    whole = read_map(client, draft, owner).json()

    assert whole["measured_panels"] == 13
    assert whole["is_complete"] is True


def test_should_carry_the_summary_on_the_listing_card(client, owner, publish):
    listing_id = publish(owner)
    measure(client, listing_id, owner, panel="hood")

    card = client.get(f"/api/v1/sale_car/{listing_id}").json()

    assert card["thickness"] == {
        "measured_panels": 1,
        "total_panels": 13,
        "is_complete": False,
    }


def test_should_lose_completeness_when_a_measurement_is_removed(client, owner, draft):
    for panel in PANELS:
        measure(client, draft, owner, panel=panel)

    removed = client.delete(f"/api/v1/sale_car/{draft}/thickness/hood", headers=owner)

    assert removed.status_code == 200, removed.text
    assert removed.json()["is_complete"] is False
    assert removed.json()["measured_panels"] == 12
