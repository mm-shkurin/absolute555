import asyncio
from sqlalchemy import select
from loguru import logger
from app.db.database import get_db_session
from app.models.cars import Cars
from app.sse.manager import sse_manager

async def update_task_status(entity_id: str, status: str, entity_type: str = "car"):

    try:
        async with get_db_session() as db:
            if entity_type == "car":
                res = await db.execute(select(Cars).where(Cars.car_id == entity_id))
                entity = res.scalar_one_or_none()
                if entity:
                    entity.task_status = status
                    await db.commit()
                    logger.info(f"Updated task status for car_id={entity_id}: {status}")
                    
                    try:
                        message = {
                            "status": status, 
                            "car_id": entity_id,
                            "timestamp": asyncio.get_event_loop().time(),
                            "type": "status_update"
                        }
                        logger.info(f"Sending SSE message to car_id={entity_id}: {message}")
                        await sse_manager.send_message(entity_id, message)
                        logger.info(f"SSE message sent successfully to car_id={entity_id}")
                    except Exception as sse_error:
                        logger.error(f"Failed to send SSE message to car_id={entity_id}: {sse_error}")
                else:
                    logger.warning(f"Car not found for car_id={entity_id}")
            
            elif entity_type == "spare_part":
                from app.models.spare_parts import SpareParts
                res = await db.execute(select(SpareParts).where(SpareParts.part_id == entity_id))
                entity = res.scalar_one_or_none()
                if entity:
                    entity.task_status = status
                    await db.commit()
                    logger.info(f"Updated task status for part_id={entity_id}: {status}")
                    
                    try:
                        message = {
                            "status": status, 
                            "part_id": entity_id,
                            "timestamp": asyncio.get_event_loop().time(),
                            "type": "maintenance_status_update"
                        }
                        logger.info(f"Sending SSE message to part_id={entity_id}: {message}")
                        await sse_manager.send_message(entity_id, message)
                        logger.info(f"SSE message sent successfully to part_id={entity_id}")
                    except Exception as sse_error:
                        logger.error(f"Failed to send SSE message to part_id={entity_id}: {sse_error}")
                else:
                    logger.warning(f"Spare part not found for part_id={entity_id}")
            
            
            
            
            elif entity_type == "sale_car":
                from app.models.sale_car import SaleCars
                res = await db.execute(select(SaleCars).where(SaleCars.sale_car_id == entity_id))
                entity = res.scalar_one_or_none()
                if entity:
                    entity.task_status = status
                    await db.commit()
                    logger.info(f"Updated task status for sale_car_id={entity_id}: {status}")

                    try:
                        message = {
                            "status": status,
                            "sale_car_id": entity_id,
                            "timestamp": asyncio.get_event_loop().time(),
                            "type": "status_update",
                        }
                        logger.info(f"Sending SSE message to sale_car_id={entity_id}: {message}")
                        await sse_manager.send_message(entity_id, message)
                        logger.info(f"SSE message sent successfully to sale_car_id={entity_id}")
                    except Exception as sse_error:
                        logger.error(f"Failed to send SSE message to sale_car_id={entity_id}: {sse_error}")
                else:
                    logger.warning(f"SaleCar not found for sale_car_id={entity_id}")
            
    except Exception as e:
        logger.error(f"Failed to update task status for {entity_type}_id={entity_id}: {e}")
        raise


class TaskStatus:
    PENDING = "Pending"
    STARTED = "Started"
    
    OcrStarted = "OcrStarted"
    OcrSuccess = "OcrSuccess"
    OcrFailed = "OcrFailed"
    DecodeStarted = "DecodeStarted"
    DecodeProcessing = "DecodeProcessing"
    DecodeSuccess = "DecodeSuccess"
    DecodeFailed = "DecodeFailed"
    
    PredictionStarted = "PredictionStarted"
    PredictionProcessing = "PredictionProcessing"
    PredictionSuccess = "PredictionSuccess"
    PredictionFailed = "PredictionFailed"
    ChromaSaveStarted = "ChromaSaveStarted"
    ChromaSaveSuccess = "ChromaSaveSuccess"
    ChromaSaveFailed = "ChromaSaveFailed"
    
    SUCCESS = "Success"
    FAILURE = "Failure"
