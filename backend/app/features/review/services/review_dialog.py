"""Отзыв, заработанный перепиской, а не принятым предложением.

Право оценивать даёт разговор: продавца оценивает покупатель, писавший ему по объявлению,
поставщика — автор заявки, на которую тот откликнулся. Спрашивающий в переписке всегда
`buyer_id`, отвечающий — `seller_id`, поэтому правило одно для обоих случаев. Один отзыв
на переписку держит база.
"""

import uuid
from typing import Dict, List, Optional

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.features.chat.models.chat import Dialog
from app.features.review.models.review import Review
from app.features.review.services.review_errors import (
    DialogNotReviewable,
    ReviewAlreadyWritten,
)
from app.features.review.services.review_service import ReviewService, as_uuid


class DialogReviewService:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def create(
        self, dialog_id: str, author_id: str, rating: int, text: Optional[str]
    ) -> Review:
        dialog = await self.db.get(Dialog, as_uuid(dialog_id, "dialog_id"))
        # Посторонний и отвечающий получают один отказ: другой сказал бы чужому, что
        # переписка существует.
        if dialog is None or str(dialog.buyer_id) != str(author_id):
            raise DialogNotReviewable(dialog_id)
        if str(dialog.seller_id) == str(author_id):
            raise DialogNotReviewable(dialog_id)

        found = await self.db.execute(select(Review).where(Review.dialog_id == dialog.dialog_id))
        already = found.scalar_one_or_none()
        if already is not None:
            raise ReviewAlreadyWritten(str(already.review_id))

        review = Review(
            dialog_id=dialog.dialog_id,
            seller_id=dialog.seller_id,
            author_id=as_uuid(author_id, "author_id"),
            rating=rating,
            text=text or None,
        )
        self.db.add(review)
        await self.db.flush()
        # Агрегат — в той же транзакции, что и отзыв: общий пересчёт живёт в ReviewService.
        await ReviewService(self.db)._recount(dialog.seller_id)
        await self.db.commit()
        await self.db.refresh(review)
        return review

    async def by_dialog(self, dialog_ids: List[uuid.UUID]) -> Dict[str, Review]:
        """Какие из переписок уже оценены — для списка чатов одним запросом."""
        if not dialog_ids:
            return {}
        found = await self.db.execute(select(Review).where(Review.dialog_id.in_(dialog_ids)))
        return {str(review.dialog_id): review for review in found.scalars()}
