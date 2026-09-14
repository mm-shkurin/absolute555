"""Заявка на роль и решение по ней, по HTTP.

История 13. Поток заявок существовал с самого начала и не имел правил: решённую заявку
можно было перерешать, отказ обходился без причины, а модератор мог одобрить заявку на
администратора — то есть выдать роль выше своей. Эти тесты держат правила, а не поток.
"""

import uuid

import pytest

from tests.conftest import run_sql
from tests.conftest import user_id_of as _id_of


def _as(headers, role):
    run_sql(
        "UPDATE users SET role = :role, is_guest = false WHERE id = :id",
        {"role": role, "id": uuid.UUID(_id_of(headers))},
    )
    return headers


@pytest.fixture
def admin(signed_in):
    return _as(signed_in(), "admin")


@pytest.fixture
def applicant(signed_in):
    return _as(signed_in(), "user")


def _ask(client, headers, role="importer", reason="вожу машины из Японии"):
    return client.post(
        "/api/v1/role/role-request",
        headers=headers,
        json={"requested_role": role, "reason": reason},
    )


def _decide(client, headers, request_id, status, comment=None):
    body = {"status": status}
    if comment is not None:
        body["review_comment"] = comment
    return client.put(f"/api/v1/role/role-requests/{request_id}", headers=headers, json=body)


def _role_of(client, admin, headers):
    info = client.get(f"/api/v1/role/users/{_id_of(headers)}/role-info", headers=admin)
    assert info.status_code == 200, info.text
    return info.json()["current_role"]


def test_should_take_an_application_for_the_importer_role(client, applicant):
    asked = _ask(client, applicant)

    assert asked.status_code == 201, asked.text
    assert asked.json()["requested_role"] == "importer"
    assert asked.json()["status"] == "pending"

    mine = client.get("/api/v1/role/my-role-requests", headers=applicant)
    assert asked.json()["id"] in [request["id"] for request in mine.json()]


def test_should_grant_the_role_when_the_application_is_approved(client, applicant, moderator, admin):
    asked = _ask(client, applicant)

    decided = _decide(client, moderator, asked.json()["id"], "approved")

    assert decided.status_code == 200, decided.text
    assert decided.json()["status"] == "approved"
    assert _role_of(client, admin, applicant) == "importer"


def test_should_keep_the_old_role_when_the_application_is_refused(client, applicant, moderator, admin):
    asked = _ask(client, applicant)

    decided = _decide(client, moderator, asked.json()["id"], "rejected", "не хватает документов")

    assert decided.status_code == 200, decided.text
    assert decided.json()["review_comment"] == "не хватает документов"
    assert _role_of(client, admin, applicant) == "user"


def test_should_refuse_a_rejection_that_says_nothing(client, applicant, moderator):
    asked = _ask(client, applicant)

    decided = _decide(client, moderator, asked.json()["id"], "rejected")

    assert decided.status_code == 422, decided.text
    mine = client.get("/api/v1/role/my-role-requests", headers=applicant)
    assert mine.json()[0]["status"] == "pending"


def test_should_decide_an_application_once(client, applicant, moderator, admin):
    asked = _ask(client, applicant)
    assert _decide(client, moderator, asked.json()["id"], "rejected", "нет").status_code == 200

    again = _decide(client, moderator, asked.json()["id"], "approved")

    assert again.status_code == 409, again.text
    assert _role_of(client, admin, applicant) == "user"


def test_should_not_let_a_moderator_hand_out_their_own_level(client, applicant, moderator, admin):
    asked = _ask(client, applicant, role="admin", reason="хочу всё")

    decided = _decide(client, moderator, asked.json()["id"], "approved")

    assert decided.status_code == 403, decided.text
    assert _role_of(client, admin, applicant) == "user"


def test_should_let_an_administrator_hand_out_any_role(client, applicant, admin):
    asked = _ask(client, applicant, role="manager", reason="буду модерировать")

    decided = _decide(client, admin, asked.json()["id"], "approved")

    assert decided.status_code == 200, decided.text
    assert _role_of(client, admin, applicant) == "manager"


def test_should_take_one_live_application_per_role(client, applicant):
    assert _ask(client, applicant).status_code == 201

    again = _ask(client, applicant)

    assert again.status_code == 409, again.text


def test_should_let_a_refused_applicant_ask_again(client, applicant, moderator):
    asked = _ask(client, applicant)
    assert _decide(client, moderator, asked.json()["id"], "rejected", "исправьте и приходите").status_code == 200

    again = _ask(client, applicant)

    assert again.status_code == 201, again.text
    assert again.json()["status"] == "pending"


def test_should_refuse_an_application_for_a_role_already_held(client, applicant, moderator):
    asked = _ask(client, applicant)
    assert _decide(client, moderator, asked.json()["id"], "approved").status_code == 200

    again = _ask(client, applicant)

    assert again.status_code == 409, again.text


def test_should_report_a_decision_on_an_application_that_is_not_there(client, moderator):
    decided = _decide(client, moderator, str(uuid.uuid4()), "approved")

    assert decided.status_code == 404, decided.text


def test_should_refuse_a_guest_an_application(client, signed_in):
    guest = signed_in()

    asked = _ask(client, guest)

    assert asked.status_code == 403, asked.text
