from enum import Enum

class Permission(str, Enum):
    VIEW_USERS = "view_users"
    VIEW_ROLE_REQUESTS = "view_role_requests"
    VIEW_ANALYTICS = "view_analytics"

    CREATE_ROLE_REQUEST = "create_role_request"
    UPLOAD_FILES = "upload_files"

    EDIT_OWN_PROFILE = "edit_own_profile"
    EDIT_USER_ROLE = "edit_user_role"

    DELETE_USER = "delete_user"

    MANAGE_ALL_USERS = "manage_all_users"
    MANAGE_ROLE_REQUESTS = "manage_role_requests"
    MANAGE_SYSTEM_SETTINGS = "manage_system_settings"

    EDIT_ANY_SALE_CAR = "edit_any_sale_car"
    DELETE_ANY_SALE_CAR = "delete_any_sale_car"
    DELETE_ANY_SALE_CAR_PHOTOS = "delete_any_sale_car_photos"

    VIEW_GUEST_OWN_DATA = "view_guest_own_data"

    VIEW_PRICE_OFFERS = "view_price_offers"
    PUBLISH_CAR_FOR_SALE = "publish_car_for_sale"
