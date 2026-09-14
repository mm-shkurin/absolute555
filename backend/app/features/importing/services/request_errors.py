"""Отказы заявок и откликов."""

from app.core.exceptions import BusinessRuleError, ConflictError, ResourceNotFoundError
from app.features.importing.services.supplier_errors import SupplierError


class RequestNotFound(SupplierError, ResourceNotFoundError):
    default_code = "REQUEST_NOT_FOUND"

    def __init__(self, request_id: str):
        super().__init__("Request not found")
        self.request_id = request_id


class RequestLimitReached(SupplierError, BusinessRuleError):
    default_code = "REQUEST_LIMIT_REACHED"

    def __init__(self, limit: int):
        super().__init__(f"no more than {limit} open requests at a time", details={"limit": limit})
        self.limit = limit


class RequestClosed(SupplierError, ConflictError):
    default_code = "REQUEST_CLOSED"

    def __init__(self, request_id: str):
        super().__init__("the request is closed and takes no more responses")
        self.request_id = request_id
