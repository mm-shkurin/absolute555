import enum

class UserRole(str, enum.Enum):
    USER = "user"
    GUEST = "guest"
    OWNER = "owner"
    ADMIN = "admin"
    MANAGER = "manager"
    SERVICE_OWNER = "service_owner"