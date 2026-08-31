"""Burying offers nobody answered.

A scheduled job rather than a calculation at read time. Computed lazily the row stays
`pending`, so a seller who opens the screen accepts an offer that by the rule expired
yesterday — and the buyer, who was told it had lapsed, is suddenly in a sale.

One UPDATE rather than a read and a loop of writes: several workers may run this at the
same moment, and the WHERE clause is what makes the second one a no-op.
"""

from datetime import datetime

from loguru import logger
from sqlalchemy import update

from app.db.database import get_db_session
from app.models.offer import Offer, OfferStatus


async def expire_stale_offers(ctx: dict) -> dict:
    async with get_db_session() as db:
        lapsed = await db.execute(
            update(Offer)
            .where(
                Offer.status == OfferStatus.PENDING.value,
                Offer.expires_at.is_not(None),
                Offer.expires_at <= datetime.utcnow(),
            )
            .values(status=OfferStatus.EXPIRED.value)
        )
        await db.commit()

    if lapsed.rowcount:
        logger.info(f"offers expired: {lapsed.rowcount}")
    return {"expired": lapsed.rowcount}
