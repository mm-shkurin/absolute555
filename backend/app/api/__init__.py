from fastapi import APIRouter
from app.api import auth,user,upload,role,task,spare_parts,cars,sale_car,offer

api_router =  APIRouter()

api_router.include_router(auth.auth_router,prefix="/auth",tags=["auth"])
api_router.include_router(user.user_router,prefix="/user",tags=["user"])
api_router.include_router(upload.upload_router,prefix="/photos",tags=["photos"])
api_router.include_router(role.role_router,prefix="/role",tags=["role"])
api_router.include_router(task.task_router, prefix="/task", tags=["task"])
api_router.include_router(spare_parts.spare_parts_router, prefix="/spare", tags=["spare-parts"])
api_router.include_router(cars.cars_router, prefix="/cars", tags=["cars"])
api_router.include_router(sale_car.sale_car_router, prefix="/sale_car", tags=["sale_car"])
api_router.include_router(offer.offer_router,prefix="/offer",tags=["offer"])
__all__ = ["api_router"]