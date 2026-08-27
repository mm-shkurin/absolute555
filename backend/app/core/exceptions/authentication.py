from .base import BaseErrorApp
from typing import Any, Dict, Optional
from fastapi.responses import JSONResponse

class AuthenticationError(BaseErrorApp):
    def __init__(
        self,
        message="ERROR_AUTHENTICATION",
        details:Optional[Dict[str, Any]] = None,
        code:Optional[str] = None,
    ):
        super().__init__(
            http_status=401,
            message=message,
            code=code,
            details=details
        )

class AuthorizationError(BaseErrorApp):
    def __init__(
        self,
        message="ERROR PERMISSION DENIED",
        details:Optional[Dict[str, Any]] = None,
        code:Optional[str] = None,
    ):
        super().__init__(
            http_status=403,
            message=message,
            code=code,
            details=details
        )
class ResourceNotFoundError(BaseErrorApp):
    def __init__(
        self,
        message="ERROR RESOURCE NOT FOUND",
        details:Optional[Dict[str, Any]] = None,
        code:Optional[str] = None,
    ):
        super().__init__(
            http_status=404,
            message=message,
            code=code,
            details=details
        )

class ConflictError(BaseErrorApp):
    def __init__(
        self,
        message="ERROR CONFLICT",
        details:Optional[Dict[str, Any]] = None,
        code:Optional[str] = None,
    ):
        super().__init__(
            http_status=409,
            message=message,
            code=code,
            details=details
        )