"""May this caller see or settle an offer: its author, the car's owner, or a moderator."""

from sqlalchemy.ext.asyncio import AsyncSession

from app.features.account.models.users import Users
from app.features.offer.models.offer import Offer
from app.permissions.ownership import can_manage_offer, can_manage_offer_as_owner


class OfferAccessService:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def manages_as_owner(self, user: Users, sale_car_id: str) -> bool:
        return await can_manage_offer_as_owner(user, sale_car_id, self.db)

    async def manages(self, user: Users, offer: Offer) -> bool:
        return await can_manage_offer(user, offer, self.db)
