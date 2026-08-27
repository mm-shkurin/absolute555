import enum

class UserRole(str, enum.Enum):
    USER = "user"
    GUEST = "guest"
    ADMIN = "admin"
    MANAGER = "manager"
