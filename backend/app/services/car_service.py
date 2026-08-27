from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, delete
from app.models.cars import Cars
from app.models.spare_parts import SpareParts
from typing import List, Dict, Any
import uuid
from datetime import datetime

class CarService:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def create_car(self, user_id: str, sts_photo_bytes: bytes) -> Cars:
        car_uuid = uuid.uuid4()
        car = Cars(
            car_id=car_uuid,
            user_id=uuid.UUID(user_id),
            sts_photo_bytes=sts_photo_bytes,
            task_status="PENDING",
        )
        self.db.add(car)
        await self.db.commit()
        await self.db.refresh(car)
        return car

    async def get_car_by_id(self, car_id: str) -> Cars | None:
        res = await self.db.execute(select(Cars).where(Cars.car_id == uuid.UUID(car_id)))
        return res.scalar_one_or_none()

    async def add_car_photos(self, car_id: str, photos_bytes: List[bytes]) -> Cars:
        car = await self.get_car_by_id(car_id)
        if not car:
            raise ValueError("Car not found")
        if not hasattr(car, "photos_bytes") or car.photos_bytes is None:
            car.photos_bytes = []
        car.photos_bytes.extend(photos_bytes)
        await self.db.commit()
        await self.db.refresh(car)
        return car

    async def update_vin(self, car_id: str, vin: str) -> Cars:
        car = await self.get_car_by_id(car_id)
        if not car:
            raise ValueError("Car not found")
        car.vin = vin
        car.task_status = "SUCCESS"
        await self.db.commit()
        await self.db.refresh(car)
        return car

    async def get_cars_by_user(self, user_id: str) -> List[Cars]:
        res = await self.db.execute(select(Cars).where(Cars.user_id == uuid.UUID(user_id)))
        return res.scalars().all()

    async def update_car(self, car_id: str, update_data: Dict[str, Any]) -> Cars:
        car = await self.get_car_by_id(car_id)
        if not car:
            raise ValueError("Car not found")
        
        if "vin" in update_data and update_data["vin"] is not None:
            car.vin = update_data["vin"]
        
        
        await self.db.commit()
        await self.db.refresh(car)
        
        if car.chroma_document_id:
            try:
                from app.services.chromadb_service import ChromaService
                chroma = ChromaService()
                
                current_data = await chroma.get_document(car.chroma_document_id)
                if current_data and isinstance(current_data, dict):
                    updated_data = current_data.copy()
                    for key, value in update_data.items():
                        if value is not None and key != "vin":  
                            updated_data[key] = value
                    
                    await chroma.update_document(car.chroma_document_id, updated_data)
            except Exception as e:
                print(f"Error updating ChromaDB for car {car_id}: {e}")
        
        return car

    async def delete_car(self, car_id: str) -> bool:
        car = await self.get_car_by_id(car_id)
        if not car:
            raise ValueError("Car not found")
        
        await self.db.execute(
            delete(SpareParts).where(SpareParts.car_id == uuid.UUID(car_id))
        )
        
        if car.chroma_document_id:
            try:
                from app.services.chromadb_service import ChromaService
                chroma = ChromaService()
                await chroma.delete_document(car.chroma_document_id)
            except Exception as e:
                print(f"Error deleting from ChromaDB for car {car_id}: {e}")
        
        await self.db.execute(delete(Cars).where(Cars.car_id == uuid.UUID(car_id)))
        await self.db.commit()
        
        return True
    