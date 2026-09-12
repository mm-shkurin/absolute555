"""Кто что вправе: матрица ролей и запреты для гостя.

Матрица проверяется целиком, а не по одной ручке: право, случайно добавленное менеджеру,
не видно ни в одном тесте конкретного экрана — оно видно только здесь. Гостевые запреты
живут рядом, потому что гость — обычная строка пользователя, и отказ ему это проверка
вызывающего, а не того, куда он тянется.
"""

from types import SimpleNamespace

import pytest

from app.core.exceptions import AuthorizationError
from app.permissions.checker import PermissionChecker
from app.permissions.guests import (
    forbid_guest,
    forbid_guest_publish_sale,
    forbid_guest_view_prices,
)
from app.permissions.mapping import ROLE_PERMISSIONS
from app.permissions.permissions import Permission
from app.permissions.roles import UserRole

GUEST_GUARDS = (forbid_guest, forbid_guest_view_prices, forbid_guest_publish_sale)


def _user(role: UserRole = UserRole.USER, is_guest: bool = False):
    return SimpleNamespace(role=role, is_guest=is_guest, id="00000000-0000-0000-0000-000000000001")


def test_should_give_an_admin_every_permission():
    assert ROLE_PERMISSIONS[UserRole.ADMIN] == set(Permission)


def test_should_keep_roles_and_the_journal_out_of_a_managers_hands():
    manager = ROLE_PERMISSIONS[UserRole.MANAGER]

    assert Permission.MANAGE_ALL_USERS not in manager
    assert Permission.VIEW_ACCOUNT_AUDIT not in manager
    # Разбор жалоб без этих двух ничем не заканчивается.
    assert Permission.VIEW_USERS in manager
    assert Permission.BLOCK_USERS in manager


def test_should_give_an_importer_exactly_one_right_above_a_user():
    extra = ROLE_PERMISSIONS[UserRole.IMPORTER] - ROLE_PERMISSIONS[UserRole.USER]

    assert extra == {Permission.MANAGE_SUPPLIER_PROFILE}


def test_should_keep_a_guest_to_reading_their_own_and_uploading():
    assert ROLE_PERMISSIONS[UserRole.GUEST] == {
        Permission.VIEW_GUEST_OWN_DATA,
        Permission.UPLOAD_FILES,
    }


@pytest.mark.parametrize("role", list(UserRole))
def test_should_describe_every_role_in_the_matrix(role):
    assert role in ROLE_PERMISSIONS


async def test_should_allow_what_the_role_holds():
    checker = PermissionChecker(_user(UserRole.MANAGER))

    assert await checker.can(Permission.EDIT_ANY_SALE_CAR) is True
    await checker.assert_can(Permission.EDIT_ANY_SALE_CAR)


async def test_should_refuse_what_the_role_does_not_hold():
    checker = PermissionChecker(_user(UserRole.USER))

    assert await checker.can(Permission.EDIT_ANY_SALE_CAR) is False
    with pytest.raises(AuthorizationError) as refused:
        await checker.assert_can(Permission.EDIT_ANY_SALE_CAR)
    assert refused.value.details["required"] == Permission.EDIT_ANY_SALE_CAR.value


async def test_should_refuse_a_role_the_matrix_never_heard_of():
    checker = PermissionChecker(_user("archivist"))

    assert await checker.can(Permission.UPLOAD_FILES) is False


async def test_should_answer_the_second_question_from_the_same_answer():
    checker = PermissionChecker(_user(UserRole.MANAGER))
    await checker.can(Permission.VIEW_USERS)

    # Кэш не должен превращаться в другое решение при том же пользователе.
    assert await checker.can(Permission.VIEW_USERS) is True


@pytest.mark.parametrize("guard", GUEST_GUARDS)
async def test_should_stop_a_guest_at_every_guard(guard):
    with pytest.raises(AuthorizationError) as refused:
        await guard(_user(UserRole.GUEST, is_guest=True))

    assert refused.value.code == "GUEST_FORBIDDEN"


@pytest.mark.parametrize("guard", GUEST_GUARDS)
async def test_should_let_a_verified_person_through_every_guard(guard):
    person = _user(is_guest=False)

    assert await guard(person) is person
