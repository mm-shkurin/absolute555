from app.core.exceptions import AuthorizationError, ConflictError, ResourceNotFoundError


class AccessRefused(AuthorizationError):
    """Действие запрещено этому исполнителю."""


class AccessConflict(ConflictError):
    """Доступ уже в том состоянии, которого просят, или цель — сам исполнитель."""

    default_code = "ACCESS_UNCHANGED"


class AccountMissing(ResourceNotFoundError):
    """Такой учётной записи нет."""

    default_code = "USER_NOT_FOUND"
