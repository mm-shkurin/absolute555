"""Подсказка со снимка прибора: число читается, но не сохраняется.

Распознавание ошибается на бликах и срезанном крае экрана, поэтому число продавцу
показывается для сверки, а в карту попадает только по «Сохранить».
"""

from tests.conftest import make_image
from tests.test_thickness_map import read_map
from tests.test_thickness_ocr import draft, gauge_photo, owner  # noqa: F401 -- фикстуры по имени


def _read(client, listing_id, headers, body):
    return client.post(
        f"/api/v1/sale_car/{listing_id}/thickness/read",
        headers=headers,
        files={"photo": ("gauge.png", body, "image/png")},
    )


def test_should_suggest_the_number_without_saving_it(client, owner, draft):
    suggested = _read(client, draft, owner, gauge_photo(180))

    assert suggested.status_code == 200, suggested.text
    assert suggested.json()["value_um"] == 180
    assert read_map(client, draft, owner).json()["measurements"] == []


def test_should_answer_nothing_for_a_frame_without_digits(client, owner, draft):
    suggested = _read(client, draft, owner, make_image())

    assert suggested.status_code == 200, suggested.text
    assert suggested.json()["value_um"] is None


def test_should_not_read_for_someone_elses_listing(client, signed_in, draft):
    assert _read(client, draft, signed_in(), gauge_photo(180)).status_code == 404
