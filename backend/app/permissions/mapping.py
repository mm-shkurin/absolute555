from typing import Set, Dict
from .roles import UserRole
from .permissions import Permission

ROLE_PERMISSIONS: Dict[UserRole, Set[Permission]] = {
    UserRole.GUEST: { 
        Permission.CREATE_GUEST_CAR,
        Permission.CREATE_GUEST_REPAIR,
        Permission.VIEW_GUEST_OWN_DATA,
        Permission.UPLOAD_FILES, 
    },
    UserRole.USER: {
        Permission.VIEW_SERVICES,
        Permission.VIEW_REVIEWS,
        Permission.CREATE_REVIEW,
        Permission.UPLOAD_FILES,
        Permission.EDIT_OWN_PROFILE,
        Permission.EDIT_OWN_REVIEW,
        Permission.DELETE_OWN_REVIEW,
        Permission.CREATE_ROLE_REQUEST,
    },
    
    UserRole.MANAGER: {
        Permission.VIEW_SERVICES,
        Permission.VIEW_REVIEWS,
        Permission.VIEW_ANALYTICS,
        Permission.EDIT_ANY_SERVICE,
        Permission.CREATE_REVIEW,
        Permission.EDIT_OWN_REVIEW,
        Permission.DELETE_OWN_REVIEW,
        Permission.UPLOAD_FILES,
        Permission.EDIT_OWN_PROFILE,
    },
    
    UserRole.SERVICE_OWNER: {
        Permission.VIEW_SERVICES,
        Permission.VIEW_REVIEWS,
        Permission.VIEW_ANALYTICS,
        Permission.CREATE_SERVICE,
        Permission.EDIT_OWN_SERVICE,
        Permission.DELETE_OWN_SERVICE,
        Permission.CREATE_REVIEW,
        Permission.EDIT_OWN_REVIEW,
        Permission.DELETE_OWN_REVIEW,
        Permission.UPLOAD_FILES,
        Permission.EDIT_OWN_PROFILE,
        Permission.CREATE_ROLE_REQUEST,
    },
    
    UserRole.ADMIN: {
        Permission.VIEW_SERVICES,
        Permission.VIEW_USERS,
        Permission.VIEW_REVIEWS,
        Permission.VIEW_ROLE_REQUESTS,
        Permission.VIEW_ANALYTICS,
        Permission.EDIT_ANY_SERVICE,
        Permission.DELETE_ANY_REVIEW,
        Permission.DELETE_ANY_SERVICE,
        Permission.MANAGE_ROLE_REQUESTS,
        Permission.MANAGE_ALL_SERVICES,
        Permission.MANAGE_ALL_USERS,
        Permission.EDIT_OWN_PROFILE,
        Permission.EDIT_ANY_SALE_CAR,
        Permission.DELETE_ANY_SALE_CAR,
        Permission.DELETE_ANY_SALE_CAR_PHOTOS,
    },
    
    UserRole.OWNER: {
        *set(Permission), 
    }
}