"""Отказы заявок и откликов."""

from app.features.importing.services.supplier_errors import SupplierError


class RequestNotFound(SupplierError):
    def __init__(self, request_id: str):
        super().__init__("Request not found")
        self.request_id = request_id


class RequestLimitReached(SupplierError):
    def __init__(self, limit: int):
        super().__init__(f"no more than {limit} open requests at a time")
        self.limit = limit


class RequestClosed(SupplierError):
    def __init__(self, request_id: str):
        super().__init__("the request is closed and takes no more responses")
        self.request_id = request_id
