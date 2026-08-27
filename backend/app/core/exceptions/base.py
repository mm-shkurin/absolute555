from typing import Any, Dict, Optional
from fastapi.responses import JSONResponse
class BaseErrorApp(Exception):
    def __init__(
        self,
        http_status:int,
        message:str,
        details:Optional[Dict[str, Any]] = None,
        code:Optional[str] = None,
    ):
        self.message = message
        self.details = details
        self.code = code
        super().__init__(self.message)
    def to_response(self) -> JSONResponse:
        return JSONResponse(
            status_code=self.http_status,
            content={
            "message": self.message,
            "details": self.details,
            "code": self.code,
        }
    )