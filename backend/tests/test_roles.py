"""Who may do what, and the application to become someone else.

The permission ladder is enforced by a dependency, so every rung of it is invisible in
the handler it guards. These hold the two directions that matter: an ordinary user is
refused the moderator's routes, and a moderator is not thereby an administrator.
"""

import uuid

import jwt
import pytest

from tests.conftest import run_sql

# Reading the user list and the application queue is an administrator's, not a
# moderator's: ROLE_PERMISSIONS gives MANAGER analytics and listing moderation and stops
# there. The split is the point of these tests, so the two sets stay apart.
ADMIN_ROUTES = ["/api/v1/role/users", "/api/v1/role/role-requests"]
MODERATOR_ROUTES = ["/api/v1/role/stats"]
PRIVILEGED_ROUTES = ADMIN_ROUTES + MODERATOR_ROUTES


def _id_of(headers):
    return jwt.decode(
        headers["Authorization"].removeprefix("Bearer "), options={"verify_signature": False}
    )["id"]


def _as(headers, role):
    run_sql("UPDATE users SET role = :role WHERE id = :id", {"role": role, "id": uuid.UUID(_id_of(headers))})
    return headers


@pytest.fixture
def admin(signed_in):
    return _as(signed_in(), "admin")


@pytest.mark.parametrize("path", PRIVILEGED_ROUTES)
def test_should_refuse_an_ordinary_user_the_moderator_routes(client, seller, path):
    response = client.get(path, headers=seller)

    assert response.status_code == 403, response.text
    assert response.json()["code"] == "PERMISSION_DENIED"


@pytest.mark.parametrize("path", PRIVILEGED_ROUTES)
def test_should_refuse_an_unauthenticated_caller_the_moderator_routes(client, path):
    assert client.get(path).status_code == 401


def test_should_let_a_moderator_read_the_counts_but_not_the_users(client, moderator):
    stats = client.get("/api/v1/role/stats", headers=moderator)

    assert stats.status_code == 200, stats.text
    assert stats.json()["total_users"] >= 1
    assert isinstance(stats.json()["users_by_role"], dict)

    for path in ADMIN_ROUTES:
        refused = client.get(path, headers=moderator)
        assert refused.status_code == 403, f"{path}: {refused.text}"


def test_should_let_an_administrator_read_the_users(client, admin):
    users = client.get("/api/v1/role/users", headers=admin)

    assert users.status_code == 200, users.text
    assert users.json()


def test_should_not_let_a_moderator_hand_out_roles(client, moderator, seller):
    response = client.put(
        f"/api/v1/role/users/{_id_of(seller)}/role",
        headers=moderator,
        json={"new_role": "admin", "reason": "because"},
    )

    assert response.status_code == 403, response.text


def test_should_let_an_administrator_change_a_role(client, admin, signed_in):
    subject = signed_in()

    response = client.put(
        f"/api/v1/role/users/{_id_of(subject)}/role",
        headers=admin,
        json={"new_role": "manager", "reason": "promoted for the test"},
    )

    assert response.status_code == 200, response.text
    info = client.get(f"/api/v1/role/users/{_id_of(subject)}/role-info", headers=admin)
    assert info.json()["current_role"] == "manager"


def test_should_report_a_role_change_for_a_user_who_is_not_there(client, admin):
    response = client.put(
        f"/api/v1/role/users/{uuid.uuid4()}/role",
        headers=admin,
        json={"new_role": "manager", "reason": "nobody"},
    )

    assert response.status_code == 404, response.text
    assert response.json()["code"] == "USER_NOT_FOUND"


def test_should_take_one_application_per_role_and_show_it_back(client, seller):
    first = client.post(
        "/api/v1/role/role-request",
        headers=seller,
        json={"requested_role": "manager", "reason": "I moderate well"},
    )

    assert first.status_code == 201, first.text
    assert first.json()["status"] == "pending"

    again = client.post(
        "/api/v1/role/role-request",
        headers=seller,
        json={"requested_role": "manager", "reason": "asking twice"},
    )
    assert again.status_code == 409, again.text
    assert again.json()["code"] == "ROLE_REQUEST_REFUSED"

    mine = client.get("/api/v1/role/my-role-requests", headers=seller)
    assert [request["id"] for request in mine.json()] == [first.json()["id"]]


def test_should_show_an_application_only_to_its_author_until_the_queue_is_read(
    client, signed_in, admin
):
    applicant = signed_in()
    created = client.post(
        "/api/v1/role/role-request",
        headers=applicant,
        json={"requested_role": "manager", "reason": "I bring cars in"},
    )
    assert created.status_code == 201, created.text

    stranger = signed_in()
    assert client.get("/api/v1/role/my-role-requests", headers=stranger).json() == []

    queue = client.get("/api/v1/role/role-requests", headers=admin)
    assert queue.status_code == 200, queue.text
    assert created.json()["id"] in [request["id"] for request in queue.json()]
