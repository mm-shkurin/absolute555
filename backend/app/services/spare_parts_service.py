from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, update
from app.models.spare_parts import SpareParts
from app.models.cars import Cars
from app.services.chromadb_service import ChromaService
from app.ml.check_spare import check_spare
from typing import List, Optional, Dict, Any
from uuid import UUID
import uuid
from datetime import datetime

class SparePartsService:
    def __init__(self, db: AsyncSession):
        self.db = db
        self.chroma = ChromaService()

    async def create_spare_part(self, user_id: UUID, car_id: UUID, name: str, input_mileage: int, mileage_average_value: Optional[int] = None) -> SpareParts:
        spare_part = SpareParts(
            car_id=car_id,
            user_id=user_id,
            name=name,
            mileage_last_replaced=input_mileage,
            array_mileage=[input_mileage],
            mileage_average_value=mileage_average_value,
            task_status="PENDING",
        )
        self.db.add(spare_part)
        await self.db.commit()
        await self.db.refresh(spare_part)
        return spare_part

    async def get_spare_part_by_id(self, spare_part_id: str) -> SpareParts | None:
        res = await self.db.execute(select(SpareParts).where(SpareParts.part_id == uuid.UUID(spare_part_id)))
        return res.scalar_one_or_none()

    async def update_spare_part(self, spare_part_id: str, input_mileage: int, mileage_average_value: Optional[int] = None) -> SpareParts:
        spare_part = await self.get_spare_part_by_id(spare_part_id)

        if not spare_part:
            raise ValueError("Spare part not found")
    
        print(f"DEBUG: Before update - array_mileage: {spare_part.array_mileage}, input_mileage: {input_mileage}")
        
        if input_mileage not in spare_part.array_mileage:
            new_array = spare_part.array_mileage.copy()
            new_array.append(input_mileage)
            new_array.sort()
            spare_part.array_mileage = new_array
            print(f"DEBUG: Added to array - new_array: {new_array}")
        else:
            print(f"DEBUG: Mileage {input_mileage} already exists in array")
        
        spare_part.mileage_last_replaced = input_mileage
    
        if mileage_average_value is not None:
            spare_part.mileage_average_value = mileage_average_value

        spare_part.updated_at = datetime.now()
        await self.db.commit()
        await self.db.refresh(spare_part)
        
        print(f"DEBUG: After commit - array_mileage: {spare_part.array_mileage}")
        return spare_part

    async def update_spare_part_alternative(self, spare_part_id: str, input_mileage: int, mileage_average_value: Optional[int] = None) -> Dict[str, Any]:
        spare_part = await self.get_spare_part_by_id(spare_part_id)

        if not spare_part:
            raise ValueError("Spare part not found")
    
        print(f"DEBUG ALT: Before update - array_mileage: {spare_part.array_mileage}, input_mileage: {input_mileage}")
        print(f"DEBUG ALT: mileage_last_replaced (неизменный): {spare_part.mileage_last_replaced}")
        
        new_array = spare_part.array_mileage.copy()
        if input_mileage not in new_array:
            new_array.append(input_mileage)
            new_array.sort()
        
        await self.db.execute(
            update(SpareParts)
            .where(SpareParts.part_id == uuid.UUID(spare_part_id))
            .values(
                array_mileage=new_array,
                mileage_average_value=mileage_average_value if mileage_average_value is not None else spare_part.mileage_average_value,
                updated_at=datetime.now()
            )
        )
        
        await self.db.commit()
        
        updated_spare_part = await self.get_spare_part_by_id(spare_part_id)
        print(f"DEBUG ALT: After commit - array_mileage: {updated_spare_part.array_mileage}")
        print(f"DEBUG ALT: mileage_last_replaced (должен остаться): {updated_spare_part.mileage_last_replaced}")
        
        try:
            prediction = None
            if updated_spare_part.chroma_document_id:
                try:
                    prediction_data = await self.chroma.get_document(updated_spare_part.chroma_document_id)
                    if prediction_data and isinstance(prediction_data, dict):
                        prediction = prediction_data
                except Exception as e:
                    print(f"Error getting prediction from ChromaDB: {e}")
            
            last_replaced_mileage = updated_spare_part.mileage_last_replaced  
            latest_mileage = input_mileage  
            mileage_difference = latest_mileage - last_replaced_mileage  
            
            predicted_mileage = None
            remaining_km = 0
            remaining_weeks = None
            
            if prediction and "error" not in prediction:
                predicted_mileage = prediction.get("predicted_replacement_mileage", 0)
                remaining_km = predicted_mileage - latest_mileage  
                
                if updated_spare_part.mileage_average_value and updated_spare_part.mileage_average_value > 0:
                    remaining_weeks = max(0, remaining_km / updated_spare_part.mileage_average_value)
            
            return {
                "spare_part": updated_spare_part,
                "mileage_calculations": {
                    "latest_mileage": latest_mileage,
                    "last_replaced_mileage": last_replaced_mileage,
                    "mileage_since_last_replacement": mileage_difference,
                    "predicted_next_replacement_mileage": predicted_mileage,
                    "remaining_km_to_next_replacement": remaining_km,
                    "remaining_weeks": round(remaining_weeks, 1) if remaining_weeks is not None else None,
                    "notification_needed": remaining_km <= 1000,
                    "array_mileage": updated_spare_part.array_mileage,
                    "average_weekly_mileage": updated_spare_part.mileage_average_value
                },
                "gigachat_prediction": prediction
            }
            
        except Exception as e:
            print(f"Error calculating mileage differences: {e}")
            return {
                "spare_part": updated_spare_part,
                "mileage_calculations": {
                    "latest_mileage": input_mileage,
                    "array_mileage": updated_spare_part.array_mileage,
                    "error": "Failed to calculate differences with GigaChat prediction"
                }
            }
    
    async def calculate_mileage_difference(self, spare_part_id: str, current_mileage: int) -> Dict[str, Any]:
        spare_part = await self.get_spare_part_by_id(spare_part_id)
        if not spare_part:
            raise ValueError("Spare part not found")
        
        last_mileage = spare_part.mileage_last_replaced or 0
        mileage_difference = current_mileage - last_mileage

        predicted_mileage = None

        if spare_part.chroma_document_id:
            try:
                gigachat_response = await self.chroma.get_document(spare_part.chroma_document_id)
        
                if gigachat_response and isinstance(gigachat_response, dict):
                    predicted_mileage = gigachat_response.get("predicted_replacement_mileage")
            except Exception as e:
                print(f"Error getting gigachat response: {e}")
        
        remaining_km = 0
        if predicted_mileage:
            remaining_km = predicted_mileage - current_mileage
        
        return {
            "spare_part_id": spare_part.part_id,
            "part_name": spare_part.name,
            "current_mileage": current_mileage,
            "last_replaced_mileage": last_mileage,
            "mileage_since_last_replacement": mileage_difference,
            "predicted_next_replacement_mileage": predicted_mileage,
            "remaining_km_to_next_replacement": remaining_km,
            "array_mileage": spare_part.array_mileage,
            "average_weekly_mileage": spare_part.mileage_average_value
        }

    async def get_spare_parts_by_car(self, car_id: str) -> List[SpareParts]:
        res = await self.db.execute(select(SpareParts).where(SpareParts.car_id == uuid.UUID(car_id)))
        return res.scalars().all()

    async def get_spare_parts_by_user(self, user_id: str) -> List[SpareParts]:
        res = await self.db.execute(select(SpareParts).where(SpareParts.user_id == uuid.UUID(user_id)))
        return res.scalars().all()


    async def delete_spare_part(self, spare_part_id: str) -> bool:
        spare_part = await self.get_spare_part_by_id(spare_part_id)
        if not spare_part:
            return False
        
        await self.db.delete(spare_part)
        await self.db.commit()
        return True

    async def get_gigachat_prediction(self, spare_part_id: str) -> Dict[str, Any]:
        spare_part = await self.get_spare_part_by_id(spare_part_id)
        if not spare_part:
            raise ValueError("Spare part not found")
        
        car_data = await self.get_car_data_for_gigachat(spare_part.car_id)
        
        average_interval = 0
        if len(spare_part.array_mileage) > 1:
            intervals = []
            for i in range(1, len(spare_part.array_mileage)):
                intervals.append(spare_part.array_mileage[i] - spare_part.array_mileage[i-1])
            average_interval = sum(intervals) / len(intervals) if intervals else 0
        
        data_for_gigachat = {
            "vehicle_info": car_data,
            "part_info": {
                "name": spare_part.name
            },
            "maintenance_history": {
                "mileage_last_replaced": spare_part.mileage_last_replaced,
                "array_mileage": spare_part.array_mileage,
                "average_interval": round(average_interval) if average_interval > 0 else None
            },
            "average_weekly_mileage": spare_part.mileage_average_value
        }
        
        prediction = await check_spare(data_for_gigachat)
        
        chroma_doc_id = f"{spare_part.part_id}_prediction_{datetime.now().timestamp()}"
        await self.chroma.save_document(
            document_id=chroma_doc_id,
            data=prediction
        )
        
        spare_part.chroma_document_id = chroma_doc_id
        spare_part.updated_at = datetime.now()
        
        await self.db.commit()
        return prediction

    async def get_car_data_for_gigachat(self, car_id: UUID) -> Dict[str, Any]:
        result = await self.db.execute(
            select(Cars).where(Cars.car_id == car_id)
        )
        car = result.scalar_one_or_none()
        
        if not car:
            raise ValueError(f"Car with id {car_id} not found")
        
        basic_car_data = {
            "mark": car.make or "Неизвестно",
            "model": car.model or "Неизвестно", 
            "year": car.year or "Неизвестно"
        }
        
        if car.chroma_document_id:
            try:
                chroma_data = await self.chroma.get_document(car.chroma_document_id)
                if chroma_data:
                    enhanced_data = {**basic_car_data}
                    if isinstance(chroma_data, dict):
                        enhanced_data.update(chroma_data)
                    return enhanced_data
            except Exception as e:
                print(f"Error loading ChromaDB data: {e}")
        
        return basic_car_data

    async def check_current_mileage(self, spare_part_id: str, current_mileage: int) -> Dict[str, Any]:
        spare_part = await self.get_spare_part_by_id(spare_part_id)
        if not spare_part:
            raise ValueError("Spare part not found")

        if not spare_part.chroma_document_id:
            await self.get_gigachat_prediction(spare_part_id)
            spare_part = await self.get_spare_part_by_id(spare_part_id)
        
        prediction = None
        if spare_part.chroma_document_id:
            try:
                prediction_data = await self.chroma.get_document(spare_part.chroma_document_id)
                if prediction_data and isinstance(prediction_data, dict):
                    prediction = prediction_data
            except Exception as e:
                print(f"Error getting prediction from ChromaDB: {e}")
        
        if not prediction or "error" in prediction:
            raise ValueError("No valid prediction available")
        
        predicted_mileage = prediction.get("predicted_replacement_mileage", 0)
        remaining_km = predicted_mileage - current_mileage
        
        remaining_weeks = None
        if spare_part.mileage_average_value and spare_part.mileage_average_value > 0:
            remaining_weeks = max(0, remaining_km / spare_part.mileage_average_value)
        
        return {
            "part_name": spare_part.name,
            "current_mileage": current_mileage,
            "mileage_last_replaced": spare_part.mileage_last_replaced,
            "array_mileage": spare_part.array_mileage,
            "mileage_average_value": spare_part.mileage_average_value,
            "gigachat_prediction": {
                "predicted_replacement_mileage": predicted_mileage,
                "estimated_replacement_date": prediction.get("estimated_replacement_date", ""),
                "part_recommendation": prediction.get("part_recommendation", ""),
                "estimated_cost": prediction.get("estimated_cost", 0)
            },
            "remaining_km": remaining_km,
            "remaining_weeks": round(remaining_weeks, 1) if remaining_weeks is not None else None,
            "notification_needed": remaining_km <= 1000
        }