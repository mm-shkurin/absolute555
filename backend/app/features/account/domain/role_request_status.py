from enum import Enum


class RoleRequestStatus(str, Enum):
    """Три исхода заявки на роль."""

    PENDING = "pending"
    APPROVED = "approved"
    REJECTED = "rejected"
