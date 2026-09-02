"""Кому карта замеров пишется и кому читается.

История 14, Tier 2. Чужое объявление и объявление, которого нет, отвечают одинаково:
403 подтвердил бы, что идентификатор живой, а это ровно то, что выясняет тот, кто их
перебирает.
"""

import uuid

import pytest

from tests.conftest import make_image
from tests.seller_rating_fixtures import publish, verify  # noqa: F401 -- фикстуры по имени
from tests.test_listing_lifecycle import _create
from tests.test_thickness_map import PANELS, measure, read_map


@pytest.fixture
def owner(seller):
    return verify(seller)


def test_should_hide_somebody_elses_listing(client, owner, signed_in):
    listing_id = _create(client, owner)
    stranger = verify(signed_in())

    assert measure(client, listing_id, stranger).status_code == 404


def test_should_allow_editing_after_publication(client, owner, publish):
    listing_id = publish(owner)
    measure(client, listing_id, owner, panel="hood", value_um=110)

    corrected = measure(client, listing_id, owner, panel="hood", value_um=260)

    assert corrected.status_code == 200, corrected.text
    assert corrected.json()["measurements"][0]["status"] == "repaint"


def test_should_refuse_a_file_that_is_not_an_image(client, owner):
    listing_id = _create(client, owner)

    refused = client.put(
        f"/api/v1/sale_car/{listing_id}/thickness/hood",
        headers=owner,
        data={"value_um": 120},
        files={"photo": ("gauge.txt", b"not a photograph", "text/plain")},
    )

    assert refused.status_code == 422, refused.text
    assert refused.json()["code"] == "NOT_AN_IMAGE"


def test_should_hide_the_map_of_a_draft_from_a_stranger(client, owner, signed_in):
    listing_id = _create(client, owner)
    measure(client, listing_id, owner)

    assert read_map(client, listing_id, verify(signed_in())).status_code == 404


@pytest.mark.parametrize(
    "value_um,expected", [(150, "factory"), (300, "repaint"), (700, "filler")]
)
def test_should_place_a_reading_on_the_scale(client, owner, value_um, expected):
    listing_id = _create(client, owner)

    written = measure(client, listing_id, owner, value_um=value_um)

    assert written.json()["measurements"][0]["status"] == expected


def test_should_answer_an_empty_map_when_nothing_is_measured(client, owner, publish):
    listing_id = publish(owner)

    empty = read_map(client, listing_id)

    assert empty.status_code == 200, empty.text
    assert empty.json()["measurements"] == []
    assert empty.json()["measured_panels"] == 0


def test_should_refuse_a_caller_who_has_not_signed_in(client, owner):
    listing_id = _create(client, owner)

    refused = client.put(
        f"/api/v1/sale_car/{listing_id}/thickness/hood",
        data={"value_um": 120},
        files={"photo": ("gauge.png", make_image(), "image/png")},
    )

    assert refused.status_code in (401, 403), refused.text


def test_should_hold_one_measurement_per_panel(client, owner):
    """Единственность держит база: тринадцать панелей — тринадцать строк, не больше."""
    listing_id = _create(client, owner)
    for panel in PANELS:
        measure(client, listing_id, owner, panel=panel)
        measure(client, listing_id, owner, panel=panel, value_um=333)

    whole = read_map(client, listing_id, owner).json()

    assert whole["measured_panels"] == 13
    assert {one["value_um"] for one in whole["measurements"]} == {333}


def test_should_not_find_a_listing_that_does_not_exist(client, owner):
    assert measure(client, str(uuid.uuid4()), owner).status_code == 404
