"""The shape every error this API returns.

One envelope for every failure -- `error`, `message`, `code`, `details` -- so a client
branches on `code` rather than parsing prose out of `detail`. FastAPI's own
HTTPException produces a different body, which is why the handlers translate it too.
"""

from typing import Any, Dict, Optional


class BaseErrorApp(Exception):
    """An error that knows its own status, its machine code and its payload."""

    default_status = 500
    default_code = "INTERNAL_ERROR"
    default_message = "Internal error"

    def __init__(
        self,
        message: Optional[str] = None,
        details: Optional[Dict[str, Any]] = None,
        code: Optional[str] = None,
        http_status: Optional[int] = None,
    ):
        self.http_status = http_status or self.default_status
        self.code = code or self.default_code
        self.message = message or self.default_message
        self.details = details or {}
        super().__init__(self.message)

    def to_payload(self) -> Dict[str, Any]:
        return {
            "error": True,
            "message": self.message,
            "code": self.code,
            "details": self.details,
        }
