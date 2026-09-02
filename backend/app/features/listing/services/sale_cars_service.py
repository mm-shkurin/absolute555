from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, delete
from sqlalchemy.orm import selectinload
from app.features.listing.models.sale_car import SaleCars, SaleCarStatus
from app.features.listing.schemas.sale_cars import SaleCarCreate, SaleCarUpdate

from typing import List, Optional
from app.features.recognition.services.webhook_service import WebhookService
from app.shared.storage.s3_service import s3_service
from loguru import logger
import uuid



class SaleCarService:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def create_sale_car(
        self,
        user_id: str,
        payload: SaleCarCreate,
    ) -> SaleCars:
        sale_car = SaleCars(
            sale_car_id=uuid.uuid4(),
            user_id=uuid.UUID(user_id),
            vin=payload.vin,
            phone_number=payload.phone_number,
            price=payload.price,
            milleage=payload.milleage,
            description=payload.description,
            status=SaleCarStatus.DRAFT,
            task_status="PENDING",
        )
        self.db.add(sale_car)
        await self.db.commit()
        await self.db.refresh(sale_car)
        return sale_car

    async def get_sale_car_by_id(self, sale_car_id: str) -> Optional[SaleCars]:
        res = await self.db.execute(
            select(SaleCars)
            .options(
                selectinload(SaleCars.brand),
                selectinload(SaleCars.model),
                selectinload(SaleCars.owner),
            )
            .where(SaleCars.sale_car_id == uuid.UUID(sale_car_id))
        )
        return res.scalar_one_or_none()


    async def get_all_sale_cars(self, status: Optional[SaleCarStatus] = None) -> List[SaleCars]:
        query = select(SaleCars).options(
            selectinload(SaleCars.brand),
            selectinload(SaleCars.model),
            selectinload(SaleCars.owner),
        )
        if status:
            query = query.where(SaleCars.status == status.value)
        query = query.order_by(SaleCars.created_at.desc())
        res = await self.db.execute(query)
        return list(res.scalars().all())

    async def get_sale_cars_by_user(self, user_id: str, status: Optional[SaleCarStatus] = None) -> List[SaleCars]:
        query = (
            select(SaleCars)
            .options(
                selectinload(SaleCars.brand),
                selectinload(SaleCars.model),
                selectinload(SaleCars.owner),
            )
            .where(SaleCars.user_id == uuid.UUID(user_id))
        )
        if status:
            query = query.where(SaleCars.status == status.value)
        query = query.order_by(SaleCars.created_at.desc())
        res = await self.db.execute(query)
        return list(res.scalars().all())

    async def update_vin(self, sale_car_id: str, vin: str) -> SaleCars:
        sale_car = await self.get_sale_car_by_id(sale_car_id)
        if not sale_car:
            raise ValueError("Sale car not found")
        sale_car.vin = vin
        sale_car.task_status = "SUCCESS"
        await self.db.commit()
        await self.db.refresh(sale_car)
        return sale_car

    @staticmethod
    async def _forget_document(sale_car: SaleCars) -> None:
        try:
            await s3_service.delete_document(sale_car.sts_key)
        except Exception as error:
            logger.warning(f"Failed to delete document for {sale_car.sale_car_id}: {error}")

    async def delete_sale_car(self, sale_car_id: str) -> bool:
        sale_car = await self.get_sale_car_by_id(sale_car_id)
        if not sale_car:
            raise ValueError("Sale car not found")

        try:
            webhook_service = WebhookService(self.db)
            await webhook_service.send_tg_webhook_delete(sale_car_id)
        except Exception as e:
            logger.warning(f"Failed to send delete webhook for sale_car_id={sale_car_id}: {e}")

        keys = [photo["key"] for photo in (sale_car.photos or [])]
        keys += [p["preview_key"] for p in (sale_car.photos or []) if p.get("preview_key")]
        if sale_car.sts_key:
            await self._forget_document(sale_car)
        if keys:
            try:
                await s3_service.delete_files(keys)
            except Exception as e:
                logger.warning(f"Failed to delete photos from S3 for sale_car_id={sale_car_id}: {e}")

        await self.db.execute(
            delete(SaleCars).where(SaleCars.sale_car_id == uuid.UUID(sale_car_id))
        )
        await self.db.commit()
        return True
