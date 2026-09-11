"""Полоска окрасов в карточке: статус каждой из тринадцати панелей в сводке объявления."""

from tests.test_thickness_map import measure
from tests.test_thickness_ocr import draft, owner  # noqa: F401 -- фикстуры по имени

PANEL_ORDER = [
    "hood", "roof", "trunk_lid",
    "front_left_door", "front_right_door", "rear_left_door", "rear_right_door",
    "front_left_fender", "front_right_fender", "rear_left_fender", "rear_right_fender",
    "front_bumper", "rear_bumper",
]


def test_should_carry_a_status_for_every_panel_in_order(client, owner, draft):
    measure(client, draft, owner, panel="hood", value_um=120)
    measure(client, draft, owner, panel="rear_bumper", value_um=640)

    summary = client.get(f"/api/v1/sale_car/{draft}", headers=owner).json()["thickness"]

    assert len(summary["panels"]) == 13
    assert summary["panels"][PANEL_ORDER.index("hood")] == "factory"
    assert summary["panels"][PANEL_ORDER.index("rear_bumper")] == "filler"
    assert summary["panels"].count(None) == 11
