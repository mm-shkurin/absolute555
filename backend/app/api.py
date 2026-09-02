"""Where the features are mounted, and the only place that knows the URL space.

One table rather than a router assembled inside each feature: the prefix a feature answers
on is a decision about the API as a whole, and a feature that chose its own could collide
with another without either of them saying so.
"""

from fastapi import APIRouter

from app.features.account.api import role, role_request, user
from app.features.auth.api import auth
from app.features.catalog.api import catalog
from app.features.chat.api import chat
from app.features.listing.api import sale_car
from app.features.moderation.api import moderation
from app.features.offer.api import offer
from app.features.recognition.api import task
from app.features.review.api import review, seller

api_router = APIRouter()

api_router.include_router(auth.auth_router, prefix="/auth", tags=["auth"])
api_router.include_router(user.user_router, prefix="/user", tags=["user"])
api_router.include_router(role.role_router, prefix="/role", tags=["role"])
api_router.include_router(role_request.role_request_router, prefix="/role", tags=["role"])
api_router.include_router(task.task_router, prefix="/task", tags=["task"])
api_router.include_router(sale_car.sale_car_router, prefix="/sale_car", tags=["sale_car"])
api_router.include_router(offer.offer_router, prefix="/offer", tags=["offer"])
api_router.include_router(catalog.catalog_router, prefix="/catalog", tags=["catalog"])
api_router.include_router(moderation.moderation_router, prefix="/moderation", tags=["moderation"])
api_router.include_router(chat.chat_router, prefix="/chat", tags=["chat"])
api_router.include_router(review.review_router, tags=["review"])
api_router.include_router(seller.seller_router, prefix="/seller", tags=["seller"])

__all__ = ["api_router"]
