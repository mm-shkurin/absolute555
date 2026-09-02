"""Where chat refusals become HTTP errors."""

from app.core.exceptions import ResourceNotFoundError, ValidationError
from app.features.chat.services.chat_errors import DialogNotFound, EmptyMessage


def to_http(error: Exception):
    if isinstance(error, DialogNotFound):
        # Not "forbidden": a refusal would confirm the conversation exists, and with it
        # that somebody is bargaining over that car.
        return ResourceNotFoundError(str(error), code="DIALOG_NOT_FOUND")

    if isinstance(error, EmptyMessage):
        return ValidationError(str(error), code="EMPTY_MESSAGE")

    raise error
