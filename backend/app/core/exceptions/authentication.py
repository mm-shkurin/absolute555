"""Who the caller is, and what they may do."""

from .base import BaseErrorApp


class AuthenticationError(BaseErrorApp):
    default_status = 401
    default_code = "UNAUTHENTICATED"
    default_message = "Authentication required"


class AuthorizationError(BaseErrorApp):
    default_status = 403
    default_code = "PERMISSION_DENIED"
    default_message = "Permission denied"


class ResourceNotFoundError(BaseErrorApp):
    default_status = 404
    default_code = "NOT_FOUND"
    default_message = "Resource not found"


class ConflictError(BaseErrorApp):
    default_status = 409
    default_code = "CONFLICT"
    default_message = "The resource is not in a state that allows this"
