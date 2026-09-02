"""Отказы профиля поставщика, на языке предметной области."""


class SupplierError(Exception):
    """База отказов импортного канала."""


class SupplierNotFound(SupplierError):
    def __init__(self, user_id: str):
        super().__init__("Supplier profile not found")
        self.user_id = user_id


class ProfileIncomplete(SupplierError):
    def __init__(self, missing: list):
        super().__init__("the profile is not complete enough to be reviewed")
        self.missing = missing


class ProfileFrozen(SupplierError):
    def __init__(self, current: str):
        super().__init__(f"a profile in {current} cannot be edited")
        self.current = current


class RejectionNeedsReason(SupplierError):
    def __init__(self):
        super().__init__("a rejection without a reason gives the supplier nothing to fix")
