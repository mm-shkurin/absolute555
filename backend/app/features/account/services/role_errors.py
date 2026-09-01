"""Чего не бывает с заявкой на роль. Статус выбирает роутер."""


class RoleRequestError(Exception):
    pass


class RoleRequestNotFound(RoleRequestError):
    def __init__(self, request_id: str):
        self.request_id = request_id
        super().__init__("заявки нет")


class DuplicateLiveRequest(RoleRequestError):
    def __init__(self, role: str):
        self.role = role
        super().__init__("заявка на эту роль уже ждёт решения")


class RoleAlreadyHeld(RoleRequestError):
    def __init__(self, role: str):
        self.role = role
        super().__init__("эта роль у вас уже есть")


class RequestAlreadyDecided(RoleRequestError):
    """Решение принимается один раз.

    Повторное одобрение выдаёт роль ещё раз, а перевод отказа в одобрение делает то же
    самое позже и незаметнее.
    """

    def __init__(self, current: str):
        self.current = current
        super().__init__("заявка уже решена")


class RejectionWithoutReason(RoleRequestError):
    def __init__(self):
        super().__init__("отказ без причины не даёт человеку того, что можно исправить")


class CannotGrantRole(RoleRequestError):
    """Модератор не выдаёт роли своего уровня и выше.

    Запросить admin может любой, и без этого правила ручка «рассмотреть заявку» —
    дорога наверх.
    """

    def __init__(self, role: str):
        self.role = role
        super().__init__("эту роль выдаёт только администратор")
