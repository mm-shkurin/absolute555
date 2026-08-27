from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, delete
from app.models.sale_car import SaleCars, SaleCarStatus
from app.schemas.sale_cars import SaleCarCreate, SaleCarUpdate

from typing import List, Optional
from app.services.webhook_service import WebhookService
from app.services.chromadb_service import ChromaService
from app.services.s3_service import s3_service
from app.core.config import FrontendSettings
from loguru import logger
import uuid

frontend_settings = FrontendSettings()


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
            status=SaleCarStatus.ON_SALE,
            sts_photos=payload.sts_photos_b64 or [],
            task_status="PENDING",
        )
        self.db.add(sale_car)
        await self.db.commit()
        await self.db.refresh(sale_car)
        return sale_car

    async def get_sale_car_by_id(self, sale_car_id: str) -> Optional[SaleCars]:
        res = await self.db.execute(
            select(SaleCars).where(SaleCars.sale_car_id == uuid.UUID(sale_car_id))
        )
        return res.scalar_one_or_none()


    async def get_all_sale_cars(self, status: Optional[SaleCarStatus] = None) -> List[SaleCars]:
        query = select(SaleCars)
        if status:
            query = query.where(SaleCars.status == status.value)
        query = query.order_by(SaleCars.created_at.desc())
        res = await self.db.execute(query)
        return list(res.scalars().all())

    async def get_sale_cars_on_sale(self) -> List[SaleCars]:
        return await self.get_all_sale_cars(status=SaleCarStatus.ON_SALE)

    async def get_sale_cars_sold(self) -> List[SaleCars]:
        return await self.get_all_sale_cars(status=SaleCarStatus.SOLD)

    async def get_sale_cars_by_user(self, user_id: str, status: Optional[SaleCarStatus] = None) -> List[SaleCars]:
        query = select(SaleCars).where(SaleCars.user_id == uuid.UUID(user_id))
        if status:
            query = query.where(SaleCars.status == status.value)
        query = query.order_by(SaleCars.created_at.desc())
        res = await self.db.execute(query)
        return list(res.scalars().all())

    async def add_sale_car_photos(self, sale_car_id: str, photos_b64: List[str]) -> SaleCars:
        sale_car = await self.get_sale_car_by_id(sale_car_id)
        if not sale_car:
            raise ValueError("Sale car not found")
        existing = sale_car.sts_photos or []
        sale_car.sts_photos = existing + list(photos_b64)
        await self.db.commit()
        await self.db.refresh(sale_car)
        return sale_car

    async def delete_sale_car_photos(self, sale_car_id: str, photo_keys: List[str]) -> dict:
        sale_car = await self.get_sale_car_by_id(sale_car_id)
        if not sale_car:
            raise ValueError("Sale car not found")
        
        existing_keys = sale_car.s3_photo_car_keys or []
        
        keys_to_delete = [key for key in photo_keys if key in existing_keys]
        keys_not_found = [key for key in photo_keys if key not in existing_keys]
        
        if not keys_to_delete:
            return {
                "deleted": [],
                "not_found": keys_not_found,
                "message": "No valid photo keys found to delete"
            }
        
        from app.services.s3_service import s3_service
        delete_results = await s3_service.delete_files(keys_to_delete)
        
        remaining_keys = [key for key in existing_keys if key not in delete_results["deleted"]]
        sale_car.s3_photo_car_keys = remaining_keys
        await self.db.commit()
        await self.db.refresh(sale_car)
        
        return {
            "deleted": delete_results["deleted"],
            "failed": delete_results["failed"],
            "not_found": keys_not_found,
            "remaining_count": len(remaining_keys),
            "message": f"Deleted {len(delete_results['deleted'])} photo(s)"
        }

    async def update_vin(self, sale_car_id: str, vin: str) -> SaleCars:
        sale_car = await self.get_sale_car_by_id(sale_car_id)
        if not sale_car:
            raise ValueError("Sale car not found")
        sale_car.vin = vin
        sale_car.task_status = "SUCCESS"
        await self.db.commit()
        await self.db.refresh(sale_car)
        return sale_car

    async def update_sale_car(self, sale_car_id: str, update_data: dict) -> SaleCars:
        sale_car = await self.get_sale_car_by_id(sale_car_id)
        if not sale_car:
            raise ValueError("Sale car not found")
        
        old_status = sale_car.status
        status_changed = False
        
        if "vin" in update_data and update_data["vin"] is not None:
            sale_car.vin = update_data["vin"]
        if "phone_number" in update_data and update_data["phone_number"] is not None:
            sale_car.phone_number = update_data["phone_number"]
        if "price" in update_data and update_data["price"] is not None:
            sale_car.price = update_data["price"]
        if "milleage" in update_data and update_data["milleage"] is not None:
            sale_car.milleage = update_data["milleage"]
        if "description" in update_data:
            sale_car.description = update_data["description"]
        if "status" in update_data and update_data["status"] is not None:
            new_status_value = None
            if isinstance(update_data["status"], SaleCarStatus):
                new_status_value = update_data["status"].value
            else:
                new_status_value = update_data["status"]
            
            if sale_car.status != new_status_value:
                status_changed = True
                sale_car.status = new_status_value
        
        
        await self.db.commit()
        await self.db.refresh(sale_car)
        
        if status_changed:
            try:
                sale_car_data = await self._prepare_webhook_data(sale_car)
                webhook_service = WebhookService(self.db)
                await webhook_service.send_tg_webhook_status_change(
                    sale_car_id=str(sale_car.sale_car_id),
                    old_status=old_status,
                    new_status=sale_car.status,
                    sale_car_data=sale_car_data
                )
            except Exception as e:
                logger.warning(f"Failed to send status change webhook for sale_car_id={sale_car_id}: {e}")
        
        if sale_car.chroma_document_id:
            try:
                from app.services.chromadb_service import ChromaService
                chroma = ChromaService()
                
                current_data = await chroma.get_document(sale_car.chroma_document_id)
                if current_data and isinstance(current_data, dict):
                    updated_data = current_data.copy()
                    for key, value in update_data.items():
                        if value is not None and key != "vin":  
                            updated_data[key] = value
                    
                    await chroma.update_document(sale_car.chroma_document_id, updated_data)
            except Exception as e:
                print(f"Error updating ChromaDB for sale car {sale_car_id}: {e}")
        
        return sale_car

    async def delete_sale_car(self, sale_car_id: str) -> bool:
        sale_car = await self.get_sale_car_by_id(sale_car_id)
        if not sale_car:
            raise ValueError("Sale car not found")

        try:
            webhook_service = WebhookService(self.db)
            await webhook_service.send_tg_webhook_delete(sale_car_id)
        except Exception as e:
            logger.warning(f"Failed to send delete webhook for sale_car_id={sale_car_id}: {e}")

        if sale_car.s3_photo_car_keys:
            try:
                from app.services.s3_service import s3_service
                await s3_service.delete_files(sale_car.s3_photo_car_keys)
            except Exception as e:
                logger.warning(f"Failed to delete photos from S3 for sale_car_id={sale_car_id}: {e}")

        if sale_car.chroma_document_id:
            try:
                from app.services.chromadb_service import ChromaService

                chroma = ChromaService()
                await chroma.delete_document(sale_car.chroma_document_id)
            except Exception:
                pass

        await self.db.execute(
            delete(SaleCars).where(SaleCars.sale_car_id == uuid.UUID(sale_car_id))
        )
        await self.db.commit()
        return True

    async def check_and_send_webhook_if_ready(self, sale_car_id: str) -> bool:
        sale_car = await self.get_sale_car_by_id(sale_car_id)
        if not sale_car:
            return False
        
        has_photos = bool(
            sale_car.s3_photo_car_keys and 
            len(sale_car.s3_photo_car_keys) > 0
        )
        
        if not has_photos:
            logger.debug(f"Sale car {sale_car_id} has no photos, skipping webhook")
            return False
        
        try:
            sale_car_data = await self._prepare_webhook_data(sale_car)
            
            webhook_service = WebhookService(self.db)
            await webhook_service.send_tg_webhook(
                sale_car_id=str(sale_car.sale_car_id),
                sale_car_data=sale_car_data
            )
            
            return True
            
        except Exception as e:
            logger.error(f"Failed to send webhook for sale_car_id={sale_car_id}: {e}")
            return False

    async def _prepare_webhook_data(self, sale_car: SaleCars) -> dict:
        data = {
            "sale_car_id": str(sale_car.sale_car_id),
            "user_id": str(sale_car.user_id),
            "price": sale_car.price,
            "milleage": sale_car.milleage,
            "phone_number": sale_car.phone_number,
            "vin": sale_car.vin,
            "description": sale_car.description,
            "photo_count": len(sale_car.s3_photo_car_keys) if sale_car.s3_photo_car_keys else 0,
            "listing_url": f"{str(frontend_settings.frontend_url).rstrip('/')}/cars/{sale_car.sale_car_id}",
        }
        
        photo_urls = []
        if sale_car.s3_photo_car_keys:
            for key in sale_car.s3_photo_car_keys:
                public_url = s3_service.get_public_photo_url(key)
                photo_urls.append(public_url)
        
        data["photo_urls"] = photo_urls
        
        if sale_car.chroma_document_id:
            try:
                chroma = ChromaService()
                car_data = await chroma.get_document(sale_car.chroma_document_id)
                if car_data and isinstance(car_data, dict):
                    data["car_data"] = car_data
            except Exception as e:
                logger.warning(f"Failed to get ChromaDB data: {e}")
        
        return data

    