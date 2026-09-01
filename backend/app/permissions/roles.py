import enum

class UserRole(str, enum.Enum):
    USER = "user"
    GUEST = "guest"
    ADMIN = "admin"
    IMPORTER = "importer"
    MANAGER = "manager"
