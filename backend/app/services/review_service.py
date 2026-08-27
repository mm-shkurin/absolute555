"""from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload
from app.models.review import Review
from app.schemas.review import (
    ReviewRead,
    ReviewWithComment,
    ReviewCreate,
    ReviewUpdate,
    ReviewFull, 
)
from app.services.chromadb_service import ChromaService
from uuid import UUID
import uuid
from typing import List, Optional
import json

class ReviewService:
    def __init__(self, db: AsyncSession, chroma_service: ChromaService):
        self.db = db
        self.chroma = chroma_service

    async def create_review(
        self,
        user_id: UUID,
        repairs_id: UUID,
        review_in: ReviewCreate
    ) -> Review:
        review_id = uuid.uuid4()
        chroma_id = str(review_id) if review_in.comment is not None else None

        if review_in.comment is not None:
            await self.chroma.save_document(
                document_id=chroma_id,
                data={"comment": review_in.comment}
            )

        db_review = Review(
            review_id=review_id,
            rating=review_in.rating,
            chroma_document_id=chroma_id,
            repairs_id=repairs_id,
            user_id=user_id
        )
        self.db.add(db_review)
        await self.db.commit()
        await self.db.refresh(db_review)
        return db_review

    async def get_review_by_id(self, review_id: UUID) -> Optional[Review]:
        return await self.db.get(Review, review_id)

    async def get_reviews_by_repairs_id(self, repairs_id: UUID) -> List[ReviewRead]:
        result = await self.db.execute(
            select(Review).where(Review.repairs_id == repairs_id)
        )
        reviews = result.scalars().all()
        return [
            ReviewRead(
                review_id=r.review_id,
                rating=r.rating,
                chroma_document_id=r.chroma_document_id,
                repairs_id=r.repairs_id,
                user_id=r.user_id,
                created_at=r.created_at
            )
            for r in reviews
        ]

    async def get_review_with_comment(self, review_id: UUID) -> Optional[ReviewWithComment]:
        review = await self.db.get(Review, review_id)
        if not review:
            return None

        comment = None
        if review.chroma_document_id:
            doc = await self.chroma.get_document(review.chroma_document_id)
            if doc and isinstance(doc, dict):
                comment = doc.get("comment")

        return ReviewWithComment(
            review_id=review.review_id,
            rating=review.rating,
            chroma_document_id=review.chroma_document_id,
            repairs_id=review.repairs_id,
            user_id=review.user_id,
            created_at=review.created_at,
            comment=comment
        )

    async def get_reviews_with_comments_by_repairs_id(self, repairs_id: UUID) -> List[ReviewWithComment]:
        result = await self.db.execute(
            select(Review).where(Review.repairs_id == repairs_id)
        )
        reviews = result.scalars().all()
        enriched = []
        for r in reviews:
            comment = None
            if r.chroma_document_id:
                doc = await self.chroma.get_document(r.chroma_document_id)
                if doc and isinstance(doc, dict):
                    comment = doc.get("comment")
            enriched.append(
                ReviewWithComment(
                    review_id=r.review_id,
                    rating=r.rating,
                    chroma_document_id=r.chroma_document_id,
                    repairs_id=r.repairs_id,
                    user_id=r.user_id,
                    created_at=r.created_at,
                    comment=comment
                )
            )
        return enriched


    async def get_reviews_with_user_and_comment(self, repairs_id: UUID) -> List["ReviewFull"]:

        result = await self.db.execute(
            select(Review)
            .where(Review.repairs_id == repairs_id)
            .options(selectinload(Review.user))
        )
        reviews = result.scalars().all()
        enriched = []
        for r in reviews:
            comment = None
            if r.chroma_document_id:
                doc = await self.chroma.get_document(r.chroma_document_id)
                if doc and isinstance(doc, dict):
                    comment = doc.get("comment")

            from app.schemas.user import User_Data
            def parse_json_field(value):
                if value is None:
                    return None
                if isinstance(value, str):
                    try:
                        return json.loads(value)
                    except (json.JSONDecodeError, TypeError):
                        return None
                return value

            vk_json_parsed = parse_json_field(r.user.vk_json)
            yandex_json_parsed = parse_json_field(r.user.yandex_json)

            user_data = User_Data(
                id=r.user.id,
                vk_id=r.user.vk_id,
                yandex_id=r.user.yandex_id,
                vk_json=vk_json_parsed,
                yandex_json=yandex_json_parsed,
                user_type="regular",
                created_at=r.user.created_at,
                updated_at=r.user.updated_at
            )
            enriched.append(
                ReviewFull(
                    review_id=r.review_id,
                    rating=r.rating,
                    chroma_document_id=r.chroma_document_id,
                    repairs_id=r.repairs_id,
                    created_at=r.created_at,
                    comment=comment,
                    user=user_data
                )
            )
        return enriched


    async def update_review(self, review_id: UUID, review_in: ReviewUpdate) -> Optional[Review]:
        review = await self.db.get(Review, review_id)
        if not review:
            return None

        if review_in.rating is not None:
            review.rating = review_in.rating

        if review_in.comment is not None:
            if not review.chroma_document_id:
                review.chroma_document_id = str(review.review_id)
                await self.chroma.save_document(
                    document_id=review.chroma_document_id,
                    data={"comment": review_in.comment}
                )
            else:
                await self.chroma.update_document(
                    document_id=review.chroma_document_id,
                    data={"comment": review_in.comment}
                )

        await self.db.commit()
        await self.db.refresh(review)
        return review

    async def delete_review(self, review_id: UUID) -> bool:
        review = await self.db.get(Review, review_id)
        if not review:
            return False
        if review.chroma_document_id:
            await self.chroma.delete_document(review.chroma_document_id)

        await self.db.delete(review)
        await self.db.commit()
        return True"""