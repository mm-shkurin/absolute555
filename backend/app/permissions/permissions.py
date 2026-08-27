from enum import Enum

class Permission(str, Enum):
    VIEW_SERVICES = "view_services"
    VIEW_USERS = "view_users"
    VIEW_ROLE_REQUESTS = "view_role_requests"
    VIEW_ANALYTICS = "view_analytics"
    VIEW_REVIEWS = "view_reviews"

    CREATE_SERVICE = "create_service"
    CREATE_REVIEW = "create_review"
    CREATE_ROLE_REQUEST = "create_role_request"
    UPLOAD_FILES = "upload_files"
    
    EDIT_OWN_PROFILE = "edit_own_profile"
    EDIT_OWN_SERVICE = "edit_own_service"
    EDIT_ANY_SERVICE = "edit_any_service"
    EDIT_OWN_REVIEW = "edit_own_review"
    EDIT_USER_ROLE = "edit_user_role"
    
    DELETE_OWN_SERVICE = "delete_own_service"
    DELETE_ANY_SERVICE = "delete_any_service"
    DELETE_OWN_REVIEW = "delete_own_review"
    DELETE_ANY_REVIEW = "delete_any_review"
    DELETE_USER = "delete_user"
    
    MANAGE_ALL_USERS = "manage_all_users"
    MANAGE_ROLE_REQUESTS = "manage_role_requests"
    MANAGE_SYSTEM_SETTINGS = "manage_system_settings"
    MANAGE_ALL_SERVICES = "manage_all_services"

    EDIT_ANY_SALE_CAR = "edit_any_sale_car"
    DELETE_ANY_SALE_CAR = "delete_any_sale_car"
    DELETE_ANY_SALE_CAR_PHOTOS = "delete_any_sale_car_photos"

    CREATE_GUEST_CAR = "create_guest_car"        
    CREATE_GUEST_REPAIR = "create_guest_repair"  
    VIEW_GUEST_OWN_DATA = "view_guest_own_data"  
    
    VIEW_PRICE_OFFERS = "view_price_offers"      
    PUBLISH_CAR_FOR_SALE = "publish_car_for_sale"