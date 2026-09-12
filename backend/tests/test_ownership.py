"""Владение: кто вправе трогать конкретное объявление и конкретное предложение.

Владение — не роль. Продавец правит своё, модератор — любое, а посторонний ничего, и
третий случай виден только тестом: в коде отказ выглядит так же, как забытая проверка.
База здесь не нужна — кроме тех проверок, что читают строку объявления; для них хватает
крошечной подделки сессии, потому что предмет проверки — правило, а не запрос.
"""

from types import SimpleNamespace

import pytest

from app.permissions.dependencies import (
    has_all_permissions,
    has_any_permission,
    has_permission,
    require_all_permissions,
    require_any_permission,
    require_permission,
)
from app.permissions.ownership import (
    can_delete_sale_car_photos,
    can_manage_offer,
    can_manage_offer_as_owner,
    can_manage_sale_car,
)
from app.permissions.permissions import Permission
from app.permissions.roles import UserRole
from app.core.exceptions import AuthorizationError

OWNER = "00000000-0000-4000-8000-00000000000a"
STRANGER = "00000000-0000-4000-8000-00000000000b"
LISTING = "00000000-0000-4000-8000-00000000000c"


def _user(user_id=OWNER, role=UserRole.USER):
    return SimpleNamespace(id=user_id, role=role.value if hasattr(role, "value") else role)


class _Db:
    """Сессия ровно настолько, насколько её спрашивает проверка владения."""

    def __init__(self, car=None):
        self.car = car

    async def execute(self, statement):
        car = self.car
        return SimpleNamespace(scalar_one_or_none=lambda: car)


async def test_should_let_the_seller_manage_their_own_listing():
    assert await can_manage_sale_car(_user(), OWNER) is True


async def test_should_let_a_moderator_manage_any_listing():
    assert await can_manage_sale_car(_user(STRANGER, UserRole.MANAGER), OWNER) is True


async def test_should_refuse_a_stranger():
    assert await can_manage_sale_car(_user(STRANGER), OWNER) is False


async def test_should_refuse_a_role_the_application_does_not_have():
    assert await can_manage_sale_car(_user(STRANGER, "архивариус"), OWNER) is False


async def test_should_let_the_seller_delete_their_own_photographs():
    assert await can_delete_sale_car_photos(_user(), OWNER) is True


async def test_should_let_a_moderator_delete_photographs_of_any_listing():
    assert await can_delete_sale_car_photos(_user(STRANGER, UserRole.MANAGER), OWNER) is True


async def test_should_refuse_photograph_deletion_to_a_stranger():
    assert await can_delete_sale_car_photos(_user(STRANGER), OWNER) is False
    assert await can_delete_sale_car_photos(_user(STRANGER, "архивариус"), OWNER) is False


async def test_should_let_the_car_owner_answer_an_offer():
    db = _Db(SimpleNamespace(user_id=OWNER))

    assert await can_manage_offer_as_owner(_user(), LISTING, db) is True


async def test_should_refuse_to_answer_an_offer_on_someone_elses_car():
    db = _Db(SimpleNamespace(user_id=OWNER))

    assert await can_manage_offer_as_owner(_user(STRANGER), LISTING, db) is False


async def test_should_refuse_when_the_car_is_gone():
    assert await can_manage_offer_as_owner(_user(), LISTING, _Db(None)) is False


async def test_should_let_a_moderator_answer_without_reading_the_car():
    # Ни одной строки не читается: право решает раньше, чем запрос.
    assert await can_manage_offer_as_owner(_user(STRANGER, UserRole.MANAGER), LISTING, _Db(None)) is True


async def test_should_refuse_an_unknown_role_before_reading_the_car():
    assert await can_manage_offer_as_owner(_user(STRANGER, "архивариус"), LISTING, _Db(None)) is False


async def test_should_let_the_buyer_see_their_own_offer():
    offer = SimpleNamespace(user_id=STRANGER, sale_car_id=LISTING)

    assert await can_manage_offer(_user(STRANGER), offer, _Db(None)) is True


async def test_should_let_the_seller_see_an_offer_on_their_car():
    offer = SimpleNamespace(user_id=STRANGER, sale_car_id=LISTING)
    db = _Db(SimpleNamespace(user_id=OWNER))

    assert await can_manage_offer(_user(OWNER), offer, db) is True


async def test_should_hide_an_offer_from_a_third_party():
    offer = SimpleNamespace(user_id=STRANGER, sale_car_id=LISTING)
    db = _Db(SimpleNamespace(user_id=OWNER))
    third = _user("00000000-0000-4000-8000-00000000000d")

    assert await can_manage_offer(third, offer, db) is False


async def test_should_answer_the_three_shapes_of_permission_question():
    both = [Permission.VIEW_USERS, Permission.BLOCK_USERS]
    mixed = [Permission.VIEW_USERS, Permission.MANAGE_ALL_USERS]

    assert await has_permission(UserRole.MANAGER, Permission.VIEW_USERS) is True
    assert await has_any_permission(UserRole.MANAGER, mixed) is True
    assert await has_all_permissions(UserRole.MANAGER, both) is True
    assert await has_all_permissions(UserRole.MANAGER, mixed) is False
    assert await has_any_permission(UserRole.USER, both) is False


@pytest.mark.parametrize(
    "guard",
    [
        require_permission(Permission.VIEW_USERS),
        require_any_permission([Permission.VIEW_USERS, Permission.MANAGE_ALL_USERS]),
        require_all_permissions([Permission.VIEW_USERS, Permission.BLOCK_USERS]),
    ],
)
async def test_should_let_a_manager_through_every_gate(guard):
    manager = _user(STRANGER, UserRole.MANAGER)

    assert await guard(manager) is manager


@pytest.mark.parametrize(
    "guard",
    [
        require_permission(Permission.VIEW_USERS),
        require_any_permission([Permission.VIEW_USERS, Permission.MANAGE_ALL_USERS]),
        require_all_permissions([Permission.VIEW_USERS, Permission.BLOCK_USERS]),
    ],
)
async def test_should_stop_an_ordinary_user_at_every_gate(guard):
    with pytest.raises(AuthorizationError) as refused:
        await guard(_user())

    assert refused.value.code == "PERMISSION_DENIED"
    assert refused.value.details["required"]


@pytest.mark.parametrize(
    "guard",
    [
        require_permission(Permission.VIEW_USERS),
        require_any_permission([Permission.VIEW_USERS]),
        require_all_permissions([Permission.VIEW_USERS]),
    ],
)
async def test_should_name_an_unknown_role_as_the_reason(guard):
    with pytest.raises(AuthorizationError) as refused:
        await guard(_user(role="архивариус"))

    assert refused.value.code == "ROLE_UNKNOWN"
