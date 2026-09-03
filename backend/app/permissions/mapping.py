from typing import Set, Dict
from .roles import UserRole
from .permissions import Permission

# Service-domain permissions (services, repairs, reviews) went with story 1, and so did
# the SERVICE_OWNER and OWNER roles. ADMIN is now the top role and holds every
# permission — OWNER used to be that, one rung above an admin who could not touch it.
ROLE_PERMISSIONS: Dict[UserRole, Set[Permission]] = {
    UserRole.GUEST: {
        Permission.VIEW_GUEST_OWN_DATA,
        Permission.UPLOAD_FILES,
    },
    UserRole.USER: {
        Permission.UPLOAD_FILES,
        Permission.EDIT_OWN_PROFILE,
        Permission.CREATE_ROLE_REQUEST,
        Permission.PUBLISH_CAR_FOR_SALE,
        Permission.VIEW_PRICE_OFFERS,
    },

    # Права обычного пользователя плюс одно своё: роль, не дающая ничего, превращает
    # одобрение заявки в запись в журнале.
    UserRole.IMPORTER: {
        Permission.UPLOAD_FILES,
        Permission.EDIT_OWN_PROFILE,
        Permission.PUBLISH_CAR_FOR_SALE,
        Permission.VIEW_PRICE_OFFERS,
        Permission.MANAGE_SUPPLIER_PROFILE,
    },

    UserRole.MANAGER: {
        Permission.VIEW_ANALYTICS,
        # Люди и блокировка — инструменты того, кто разбирает жалобы. Роли и журнал
        # остаются у admin: ручка разбора иначе становится дорогой наверх.
        Permission.VIEW_USERS,
        Permission.BLOCK_USERS,
        # Заявки разбирает тот же человек, что и очередь объявлений. Какие роли он
        # вправе выдать — правило истории 13, и оно живёт в сервисе, а не здесь.
        Permission.VIEW_ROLE_REQUESTS,
        Permission.MANAGE_ROLE_REQUESTS,
        Permission.UPLOAD_FILES,
        Permission.EDIT_OWN_PROFILE,
        Permission.PUBLISH_CAR_FOR_SALE,
        Permission.VIEW_PRICE_OFFERS,
        Permission.EDIT_ANY_SALE_CAR,
        Permission.DELETE_ANY_SALE_CAR,
        Permission.DELETE_ANY_SALE_CAR_PHOTOS,
    },

    UserRole.ADMIN: {
        *set(Permission),
    },
}
