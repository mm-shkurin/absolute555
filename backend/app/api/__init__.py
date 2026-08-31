from fastapi import APIRouter
from app.api import auth, user, role, task, sale_car, offer, catalog

api_router = APIRouter()

api_router.include_router(auth.auth_router, prefix="/auth", tags=["auth"])
api_router.include_router(user.user_router, prefix="/user", tags=["user"])
api_router.include_router(role.role_router, prefix="/role", tags=["role"])
api_router.include_router(task.task_router, prefix="/task", tags=["task"])
api_router.include_router(sale_car.sale_car_router, prefix="/sale_car", tags=["sale_car"])
api_router.include_router(offer.offer_router, prefix="/offer", tags=["offer"])
api_router.include_router(catalog.catalog_router, prefix="/catalog", tags=["catalog"])
__all__ = ["api_router"]
