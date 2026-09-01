"""What an offer says in the conversation it belongs to.

Kept apart from the offer service so that the rules of bargaining and the words shown to
a buyer do not share a file -- and so that offer_service stays inside the 200-line limit
it had just reached.

The lines are written by the server with no human author: a client able to send one could
sign "the offer was accepted" as the seller.
"""

from app.features.chat.models.chat import MessageKind
from app.features.listing.models.sale_car import SaleCars
from app.features.chat.services.chat_service import ChatService


class OfferNotices:
    def __init__(self, db):
        self.chat = ChatService(db)

    async def offered(self, car: SaleCars, buyer_id, price: float) -> None:
        dialog = await self.chat.open_for_offer(car, buyer_id)
        await self.chat.say(
            dialog, f"Предложена цена {price:.0f} \u20bd", kind=MessageKind.SYSTEM.value
        )

    async def sold(self, car: SaleCars, winner_id, losers) -> None:
        """Each buyer told in their own room, and told the truth.

        One of them was accepted; the others were not turned down -- somebody bought the
        car first, which is a different sentence to read.
        """
        won = await self.chat.open_for_offer(car, winner_id)
        await self.chat.say(won, "Предложение принято", kind=MessageKind.SYSTEM.value)

        for buyer_id in losers:
            room = await self.chat.open_for_offer(car, buyer_id)
            await self.chat.say(room, "Машину продали", kind=MessageKind.SYSTEM.value)
