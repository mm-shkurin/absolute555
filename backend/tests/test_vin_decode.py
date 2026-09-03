"""Распознавание по VIN, который продавец вписал руками, по HTTP.

История 20, Tier 1. Экран «документ прочитали, VIN — нет» предлагает переписать номер
из документа; здесь — то, что делает с ним сервер: форма проверяется до очереди, номер
остаётся выбором продавца, а исход приезжает тем же полем autofill, что и у снимка.
"""

import pytest

from app.tasks.decode_by_vin import _decoded
from tests.test_listing_lifecycle import COMPLETE, _create

VIN = "XTA21074051234567"


def _decode(client, headers, listing_id, vin=VIN):
    return client.post(
        f"/api/v1/sale_car/{listing_id}/decode-vin", headers=headers, json={"vin": vin}
    )


def _listing(client, headers, listing_id):
    response = client.get(f"/api/v1/sale_car/{listing_id}", headers=headers)
    assert response.status_code == 200, response.text
    return response.json()


def test_should_accept_a_typed_vin_and_start_reading_by_it(client, seller):
    listing_id = _create(client, seller)

    response = _decode(client, seller, listing_id)

    assert response.status_code == 202, response.text
    assert response.json()["sale_car_id"] == listing_id
    assert response.json()["autofill"]["state"] == "pending"


def test_should_keep_the_typed_vin_as_the_sellers_own_value(client, seller):
    listing_id = _create(client, seller)

    _decode(client, seller, listing_id, vin="xta-2107 4051234567")

    assert _listing(client, seller, listing_id)["vin"] == VIN


def test_should_hand_the_reading_a_job_of_its_own(client, seller):
    listing_id = _create(client, seller)

    _decode(client, seller, listing_id)

    assert _listing(client, seller, listing_id)["task_id"]


def test_should_report_the_outcome_on_a_fresh_connection(client, seller):
    listing_id = _create(client, seller)
    _decode(client, seller, listing_id)

    assert _listing(client, seller, listing_id)["autofill"]["state"] == "pending"


@pytest.mark.parametrize(
    "vin",
    [
        "XTA2107405123456",  # шестнадцать символов
        "XTA210740512345678",  # восемнадцать
        "XTA2IO7405I234567",  # I и O, исключённые стандартом
        "GB6-1000952",  # номер кузова: расшифровывать нечего
        "",
    ],
)
def test_should_refuse_a_string_that_is_not_a_vin_before_queueing_anything(client, seller, vin):
    listing_id = _create(client, seller)

    response = _decode(client, seller, listing_id, vin=vin)

    assert response.status_code == 422, response.text
    assert response.json()["code"] == "VIN_MALFORMED"
    assert _listing(client, seller, listing_id)["autofill"]["state"] == "none"


def test_should_hide_someone_elses_listing_from_a_stranger(client, seller, signed_in):
    listing_id = _create(client, seller)

    response = _decode(client, signed_in(), listing_id)

    assert response.status_code == 404, response.text
    assert _listing(client, seller, listing_id)["autofill"]["state"] == "none"


def test_should_refuse_a_typed_vin_from_an_unauthenticated_caller(client, seller):
    response = _decode(client, {}, _create(client, seller))

    assert response.status_code == 401, response.text


def test_should_refuse_a_typed_vin_on_a_listing_under_review(
    client, seller, catalogue, attach_photo
):
    brand_id, model_id = catalogue
    listing_id = _create(client, seller)
    client.patch(
        f"/api/v1/sale_car/{listing_id}",
        headers=seller,
        json=dict(COMPLETE, brand_id=brand_id, model_id=model_id),
    )
    attach_photo(listing_id, seller, count=3)
    assert client.post(f"/api/v1/sale_car/{listing_id}/submit", headers=seller).status_code == 200

    response = _decode(client, seller, listing_id)

    assert response.status_code == 409, response.text
    assert response.json()["code"] == "LISTING_FROZEN"


def test_should_call_a_vin_that_matched_nothing_undecoded(monkeypatch):
    """Не «нечитаемо»: читать было нечего, снимка нет — машина просто не нашлась."""
    from app.tasks import decode_by_vin

    monkeypatch.setattr(
        decode_by_vin, "read_vin", lambda vin: dict.fromkeys(("mark", "model", "year"), None)
    )

    assert _decoded(VIN) is None


def test_should_pass_decoded_fields_on_under_the_names_the_listing_uses(monkeypatch):
    from app.tasks import decode_by_vin

    monkeypatch.setattr(
        decode_by_vin,
        "read_vin",
        lambda vin: {"mark": "LADA", "model": "2107", "year": "2005", "power": "74",
                     "transmission": "manual"},
    )

    assert _decoded(VIN) == {
        "year": "2005",
        "engine_power": "74",
        "transmission": "manual",
        "mark": "LADA",
        "model": "2107",
    }
