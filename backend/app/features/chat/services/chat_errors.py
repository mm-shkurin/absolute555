"""Domain errors of the chat, each with the status and code that say it on the wire."""

from app.core.exceptions import BaseErrorApp, ResourceNotFoundError, ValidationError


class ChatError(BaseErrorApp):
    """Base of every chat refusal."""


class DialogNotFound(ChatError, ResourceNotFoundError):
    """Not "forbidden": a refusal would confirm the conversation exists, and with it
    that somebody is bargaining over that car."""

    default_code = "DIALOG_NOT_FOUND"

    def __init__(self, dialog_id: str = ""):
        super().__init__("Dialog not found")
        self.dialog_id = dialog_id


class EmptyMessage(ChatError, ValidationError):
    default_code = "EMPTY_MESSAGE"

    def __init__(self):
        super().__init__("A message needs something in it")
