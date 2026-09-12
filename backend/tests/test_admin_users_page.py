"""Страница списка людей, фильтры и сводка по ролям.

Список отдаётся страницей, а не всей таблицей: при плановых тысячах учётных записей
ответ «весь массив» — это ответ на всю базу ради одного экрана. Фильтр, который молча
ничего не фильтрует, выглядит рабочим ровно до дня, когда по нему кого-то ищут.
"""

import uuid

import pytest

from tests.conftest import run_sql
from tests.test_admin_console import _as, _id_of, admin  # noqa: F401


@pytest.fixture
def manager(signed_in):
    return _as(signed_in(), "manager")


def _page(client, headers, **params):
    response = client.get("/api/v1/role/users", headers=headers, params=params)
    assert response.status_code == 200, response.text
    return response.json()


def test_should_answer_with_one_page_rather_than_the_whole_table(client, manager, signed_in):
    signed_in()

    page = _page(client, manager, page=1, page_size=5)

    assert page["page"] == 1 and page["page_size"] == 5
    assert len(page["items"]) <= 5
    assert page["total"] >= len(page["items"])


def test_should_filter_by_role(client, manager, signed_in):
    _as(signed_in(), "importer")

    page = _page(client, manager, role="importer", page_size=100)

    assert page["items"], "ни одного поставщика в выдаче фильтра по роли"
    assert {person["role"] for person in page["items"]} == {"importer"}


def test_should_filter_the_blocked_apart_from_the_rest(client, admin, signed_in):
    victim = signed_in()
    victim_id = _id_of(victim)
    blocked = client.post(
        f"/api/v1/role/users/{victim_id}/block", headers=admin, json={"reason": "накрутка"}
    )
    assert blocked.status_code == 200, blocked.text

    closed = _page(client, admin, blocked=True, page_size=100)
    open_ones = _page(client, admin, blocked=False, page_size=100)

    assert victim_id in [person["id"] for person in closed["items"]]
    assert victim_id not in [person["id"] for person in open_ones["items"]]


@pytest.mark.xfail(
    strict=True,
    reason="БАГ: поиск в PeopleService идёт только по yandex_json и vk_json, а своё имя "
    "лежит в колонке profile_name — переименовавшегося человека консоль не находит",
)
def test_should_find_a_person_by_name(client, manager, signed_in):
    person = signed_in()
    name = f"Фильтруемый {uuid.uuid4().hex[:6]}"
    renamed = client.patch("/api/v1/user/profile", headers=person, json={"name": name})
    assert renamed.status_code == 200, renamed.text

    page = _page(client, manager, query=name, page_size=100)

    assert [found["id"] for found in page["items"]] == [_id_of(person)]


def test_should_refuse_a_page_outside_its_bounds(client, manager):
    for params in ({"page": 0}, {"page_size": 0}, {"page_size": 101}):
        answer = client.get("/api/v1/role/users", headers=manager, params=params)
        assert answer.status_code == 422, answer.text


def test_should_tell_the_current_role_of_one_person(client, manager, signed_in):
    person = _as(signed_in(), "importer")

    info = client.get(f"/api/v1/role/users/{_id_of(person)}/role-info", headers=manager)

    assert info.status_code == 200, info.text
    assert info.json()["current_role"] == "importer"


def test_should_answer_404_for_a_person_who_does_not_exist(client, manager):
    info = client.get(f"/api/v1/role/users/{uuid.uuid4()}/role-info", headers=manager)

    assert info.status_code == 404, info.text
    assert info.json()["code"] == "USER_NOT_FOUND"


def test_should_sum_the_role_breakdown_to_the_total(client, manager):
    stats = client.get("/api/v1/role/stats", headers=manager)

    assert stats.status_code == 200, stats.text
    body = stats.json()
    assert sum(body["users_by_role"].values()) == body["total_users"]
    assert body["verified_users"] + body["unverified_users"] == body["total_users"]


def test_should_refuse_the_console_to_an_ordinary_user(client, seller, signed_in):
    other_id = _id_of(signed_in())

    assert client.get("/api/v1/role/users", headers=seller).status_code == 403
    assert client.get("/api/v1/role/stats", headers=seller).status_code == 403
    assert (
        client.get(f"/api/v1/role/users/{other_id}/role-info", headers=seller).status_code == 403
    )
    assert client.get(f"/api/v1/role/users/{other_id}", headers=seller).status_code == 403


def test_should_keep_the_audit_journal_for_admins_only(client, manager, signed_in):
    person_id = _id_of(signed_in())

    refused = client.get(f"/api/v1/role/users/{person_id}/audit", headers=manager)

    assert refused.status_code == 403, refused.text


def test_should_show_a_deleted_person_as_gone(client, admin, signed_in):
    leaving = signed_in()
    person_id = _id_of(leaving)
    run_sql(
        "UPDATE users SET deleted_at = now() WHERE id = :id", {"id": uuid.UUID(person_id)}
    )

    page = _page(client, admin, deleted=True, page_size=100)

    found = next(one for one in page["items"] if one["id"] == person_id)
    assert found["deleted_at"] is not None
