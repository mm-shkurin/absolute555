"""Domain errors of the chat."""


class ChatError(Exception):
    """Base of every chat refusal."""


class DialogNotFound(ChatError):
    def __init__(self, dialog_id: str = ""):
        super().__init__("Dialog not found")
        self.dialog_id = dialog_id


class EmptyMessage(ChatError):
    def __init__(self):
        super().__init__("A message needs something in it")
