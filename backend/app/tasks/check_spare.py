import asyncio
import json
from loguru import logger
from sqlalchemy import select
from app.tasks.decorators import async_task
from app.tasks.status_updater import update_task_status, TaskStatus
from app.ml.check_spare import check_spare
from app.services.chromadb_service import ChromaService
from app.db.database import get_db_session
from app.models.spare_parts import SpareParts
from app.models.cars import Cars

@async_task("check_spare_task")
async def check_spare_task(part_id: str):
    try:
        await update_task_status(part_id, TaskStatus.STARTED, "spare_part")
        
        async with get_db_session() as db:
            res = await db.execute(select(SpareParts).where(SpareParts.part_id == part_id))
            spare_part = res.scalar_one_or_none()
            
            if not spare_part:
                raise ValueError(f"Spare part with id {part_id} not found")
            
            await update_task_status(part_id, TaskStatus.PredictionStarted, "spare_part")
            
            car_res = await db.execute(select(Cars).where(Cars.car_id == spare_part.car_id))
            car = car_res.scalar_one_or_none()
            
            if not car:
                raise ValueError(f"Car with id {spare_part.car_id} not found")
            
            car_data = {
                "mark": "Неизвестно",
                "model": "Неизвестно", 
                "year": "Неизвестно"
            }
            
            if car.chroma_document_id:
                try:
                    chroma = ChromaService()
                    chroma_data = await chroma.get_document(car.chroma_document_id)
                    if chroma_data and isinstance(chroma_data, dict):
                        car_data.update(chroma_data)
                except Exception as e:
                    logger.warning(f"Failed to load car data from ChromaDB: {e}")
            
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
            
            await update_task_status(part_id, TaskStatus.PredictionProcessing, "spare_part")
            
            try:
                prediction = await check_spare(data_for_gigachat)
                await update_task_status(part_id, TaskStatus.PredictionSuccess, "spare_part")
            except Exception as prediction_error:
                await update_task_status(part_id, TaskStatus.PredictionFailed, "spare_part")
                raise
            
            await update_task_status(part_id, TaskStatus.ChromaSaveStarted, "spare_part")
            
            try:
                chroma = ChromaService()
                chroma_doc_id = f"{spare_part.part_id}_prediction_{asyncio.get_event_loop().time()}"
                await chroma.save_document(
                    document_id=chroma_doc_id,
                    data=prediction
                )
                
                spare_part.chroma_document_id = chroma_doc_id
                spare_part.task_status = TaskStatus.SUCCESS
                await db.commit()
                
                await update_task_status(part_id, TaskStatus.ChromaSaveSuccess, "spare_part")
            except Exception as chroma_error:
                await update_task_status(part_id, TaskStatus.ChromaSaveFailed, "spare_part")
                raise
            
            await update_task_status(part_id, TaskStatus.SUCCESS, "spare_part")
            
            return {
                "part_id": part_id,
                "prediction": prediction,
                "chroma_document_id": chroma_doc_id
            }
    
    except Exception as e:
        logger.exception(f"Error in check_spare_task part_id={part_id}: {e}")
        
        async with get_db_session() as db:
            res = await db.execute(select(SpareParts).where(SpareParts.part_id == part_id))
            spare_part = res.scalar_one_or_none()
            if spare_part:
                spare_part.task_status = TaskStatus.FAILURE
                await db.commit()
        
        await update_task_status(part_id, TaskStatus.FAILURE, "spare_part")
        raise
