from app.core.exceptions import ValidationError


class NameNotAllowed(ValidationError):
    """Имя пустое после обрезки пробелов или длиннее допустимого."""

    default_code = "NAME_NOT_ALLOWED"
