"""Очередь заявок на роль, доступ к ней и жизнь роли после решения, по HTTP.

Продолжение `test_role_requests.py`: там подача заявки и правила решения.
"""

import uuid

import pytest

from tests.conftest import user_id_of as _id_of
from tests.test_role_requests import _as, _ask, _decide, _role_of, admin, applicant  # noqa: F401


def test_should_show_the_queue_with_the_name_of_who_asked(client, applicant, moderator):
    asked = _ask(client, applicant)

    queue = client.get("/api/v1/role/role-requests", headers=moderator)

    assert queue.status_code == 200, queue.text
    row = next(one for one in queue.json() if one["id"] == asked.json()["id"])
    assert "user_name" in row


def test_should_narrow_the_queue_by_status(client, applicant, moderator):
    asked = _ask(client, applicant)
    assert _decide(client, moderator, asked.json()["id"], "approved").status_code == 200

    approved = client.get("/api/v1/role/role-requests?status=approved", headers=moderator)
    waiting = client.get("/api/v1/role/role-requests?status=pending", headers=moderator)

    assert asked.json()["id"] in [one["id"] for one in approved.json()]
    assert asked.json()["id"] not in [one["id"] for one in waiting.json()]


def test_should_let_an_importer_do_what_a_user_could(client, applicant, moderator, catalogue, attach_photo):
    from tests.test_listing_lifecycle import COMPLETE, _create

    asked = _ask(client, applicant)
    assert _decide(client, moderator, asked.json()["id"], "approved").status_code == 200

    listing_id = _create(client, applicant)
    brand_id, model_id = catalogue
    body = dict(COMPLETE, brand_id=brand_id, model_id=model_id)
    assert client.patch(f"/api/v1/sale_car/{listing_id}", headers=applicant, json=body).status_code == 200
    attach_photo(listing_id, applicant, count=3)

    submitted = client.post(f"/api/v1/sale_car/{listing_id}/submit", headers=applicant)
    assert submitted.status_code == 200, submitted.text


def test_should_leave_the_listings_alone_when_the_role_is_taken_away(
    client, applicant, moderator, admin, catalogue, attach_photo
):
    from tests.test_listing_lifecycle import COMPLETE, _create

    asked = _ask(client, applicant)
    assert _decide(client, moderator, asked.json()["id"], "approved").status_code == 200
    listing_id = _create(client, applicant)
    brand_id, model_id = catalogue
    assert client.patch(
        f"/api/v1/sale_car/{listing_id}",
        headers=applicant,
        json=dict(COMPLETE, brand_id=brand_id, model_id=model_id),
    ).status_code == 200
    attach_photo(listing_id, applicant, count=3)
    client.post(f"/api/v1/sale_car/{listing_id}/submit", headers=applicant)
    assert client.post(f"/api/v1/sale_car/{listing_id}/approve", headers=moderator).status_code == 200

    demoted = client.put(
        f"/api/v1/role/users/{_id_of(applicant)}/role",
        headers=admin,
        json={"new_role": "user", "reason": "истёк договор"},
    )

    assert demoted.status_code == 200, demoted.text
    listing = client.get(f"/api/v1/sale_car/{listing_id}", headers=applicant)
    assert listing.json()["status"] == "published"


def test_should_refuse_an_ordinary_user_the_queue_and_the_decision(client, applicant, signed_in):
    asked = _ask(client, applicant)
    stranger = _as(signed_in(), "user")

    assert client.get("/api/v1/role/role-requests", headers=stranger).status_code == 403
    assert _decide(client, stranger, asked.json()["id"], "approved").status_code == 403


def test_should_not_let_a_moderator_promote_themselves(client, moderator, admin):
    # Общая фикстура модератора приходит из гостевого входа и остаётся с флагом гостя;
    # заявку подаёт настоящий пользователь, поэтому флаг снимается.
    _as(moderator, "manager")
    asked = _ask(client, moderator, role="admin", reason="повышаю себя")

    decided = _decide(client, moderator, asked.json()["id"], "approved")

    assert decided.status_code == 403, decided.text
    assert _role_of(client, admin, moderator) == "manager"


@pytest.mark.parametrize(
    "call",
    [
        lambda client: client.post("/api/v1/role/role-request", json={"requested_role": "importer", "reason": "x"}),
        lambda client: client.get("/api/v1/role/role-requests"),
        lambda client: client.put(f"/api/v1/role/role-requests/{uuid.uuid4()}", json={"status": "approved"}),
    ],
)
def test_should_refuse_a_caller_who_has_not_signed_in(client, call):
    refused = call(client)
    assert refused.status_code == 401, refused.text
    assert refused.json()["code"] == "CREDENTIALS_INVALID"


def test_should_refuse_a_queue_filter_that_names_no_status(client, moderator):
    """Сценарий: фильтр очереди с неизвестным статусом.

    Дано: модератор, которому очередь заявок видна.
    Когда: он просит очередь со статусом «bogus».
    Тогда: запрос отклоняется как невалидный, с кодом VALIDATION_ERROR.
    """
    refused = client.get("/api/v1/role/role-requests?status=bogus", headers=moderator)

    assert refused.status_code == 422, refused.text
    assert refused.json()["code"] == "VALIDATION_ERROR"


def test_should_refuse_a_decision_on_an_id_that_is_not_an_id(client, moderator):
    """Сценарий: решение по заявке с идентификатором не той формы.

    Дано: модератор, которому решения по заявкам доступны.
    Когда: он решает заявку «not-a-uuid».
    Тогда: запрос отклоняется как невалидный, с кодом VALIDATION_ERROR, а не 404 или 500.
    """
    refused = _decide(client, moderator, "not-a-uuid", "approved")

    assert refused.status_code == 422, refused.text
    assert refused.json()["code"] == "VALIDATION_ERROR"
