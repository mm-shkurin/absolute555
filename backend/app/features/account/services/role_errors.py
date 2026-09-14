"""Чего не бывает с заявкой на роль, вместе с кодом ответа, которым это сказано."""

from app.core.exceptions import (
    BaseErrorApp,
    AuthorizationError,
    BusinessRuleError,
    ResourceNotFoundError,
    ValidationError,
)


class RoleRequestError(BaseErrorApp):
    pass


class RoleRequestNotFound(RoleRequestError, ResourceNotFoundError):
    default_code = "ROLE_REQUEST_NOT_FOUND"

    def __init__(self, request_id: str):
        self.request_id = request_id
        super().__init__("заявки нет")


class UserNotFound(RoleRequestError, ResourceNotFoundError):
    default_code = "USER_NOT_FOUND"

    def __init__(self, user_id):
        self.user_id = user_id
        super().__init__("пользователя нет")


class DuplicateLiveRequest(RoleRequestError, BusinessRuleError):
    default_code = "DUPLICATE_ROLE_REQUEST"

    def __init__(self, role: str):
        self.role = role
        super().__init__("заявка на эту роль уже ждёт решения")


class RoleAlreadyHeld(RoleRequestError, BusinessRuleError):
    default_code = "ROLE_ALREADY_HELD"

    def __init__(self, role: str):
        self.role = role
        super().__init__("эта роль у вас уже есть")


class RequestAlreadyDecided(RoleRequestError, BusinessRuleError):
    """Решение принимается один раз.

    Повторное одобрение выдаёт роль ещё раз, а перевод отказа в одобрение делает то же
    самое позже и незаметнее.
    """

    default_code = "ROLE_REQUEST_DECIDED"

    def __init__(self, current: str):
        self.current = current
        super().__init__("заявка уже решена", details={"current_status": current})


class RejectionWithoutReason(RoleRequestError, ValidationError):
    default_code = "REJECTION_WITHOUT_REASON"

    def __init__(self):
        super().__init__("отказ без причины не даёт человеку того, что можно исправить", details={"field": "review_comment"})


class CannotGrantRole(RoleRequestError, AuthorizationError):
    """Модератор не выдаёт роли своего уровня и выше.

    Запросить admin может любой, и без этого правила ручка «рассмотреть заявку» —
    дорога наверх.
    """

    default_code = "ROLE_ABOVE_REVIEWER"

    def __init__(self, role: str):
        self.role = role
        super().__init__("эту роль выдаёт только администратор")
