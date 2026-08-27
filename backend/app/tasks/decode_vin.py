import base64
from loguru import logger
from sqlalchemy import select

from app.tasks.decorators import async_task
from app.tasks.status_updater import update_task_status, TaskStatus
from app.ml.decode_vin import decode_vin
from app.services.chromadb_service import ChromaService
from app.db.database import get_db_session  
from app.models.cars import Cars
from app.models.sale_car import SaleCars


@async_task("decode_vin_from_sts")
async def decode_vin_from_sts_task(car_id: str, file_b64: str):

    try:
        await update_task_status(car_id, TaskStatus.STARTED)
        
        file_bytes = base64.b64decode(file_b64)

        await update_task_status(car_id, TaskStatus.OcrStarted)
        
        try:
            result = await decode_vin(file_bytes=file_bytes, car_id=car_id)
            
            if result.get("error"):
                error_type = result.get("error")
                if error_type in ["gigachat_connection_error", "gigachat_error"]:
                    logger.error(f"GigaChat error in decode_vin for car_id={car_id}: {result.get('message', 'Unknown error')}")
                    await update_task_status(car_id, TaskStatus.DecodeFailed)
                    await update_task_status(car_id, TaskStatus.FAILURE)
                    return {"car_id": car_id, "result": result, "error": True}
                else:
                    await update_task_status(car_id, TaskStatus.OcrFailed)
                    await update_task_status(car_id, TaskStatus.FAILURE)
                    return {"car_id": car_id, "result": result, "error": True}
            
            await update_task_status(car_id, TaskStatus.OcrSuccess)
        except Exception as ocr_error:
            logger.exception(f"Exception in decode_vin for car_id={car_id}: {ocr_error}")
            await update_task_status(car_id, TaskStatus.OcrFailed)
            raise

        await update_task_status(car_id, TaskStatus.DecodeStarted)
        await update_task_status(car_id, TaskStatus.DecodeProcessing)
        
        try:
            chroma = ChromaService()
            await chroma.save_document(document_id=car_id, data=result)
            await update_task_status(car_id, TaskStatus.DecodeSuccess)
        except Exception as decode_error:
            await update_task_status(car_id, TaskStatus.DecodeFailed)
            raise

        await update_task_status(car_id, TaskStatus.SUCCESS)

        async with get_db_session() as db:
            res = await db.execute(select(Cars).where(Cars.car_id == car_id))
            car = res.scalar_one_or_none()
            if car:
                if result.get("vin"):
                    car.vin = result["vin"]
                car.chroma_document_id = car_id
                await db.commit()

        return {"car_id": car_id, "result": result}

    except Exception as e:
        logger.exception(f"Error in decode_vin_from_sts_task car_id={car_id}: {e}")
        
        await update_task_status(car_id, TaskStatus.FAILURE)
        
        raise


@async_task("decode_vin_from_sts_sale_car")
async def decode_vin_from_sts_sale_car_task(sale_car_id: str, file_b64: str):

    try:
        await update_task_status(sale_car_id, TaskStatus.STARTED, entity_type="sale_car")

        file_bytes = base64.b64decode(file_b64)

        await update_task_status(sale_car_id, TaskStatus.OcrStarted, entity_type="sale_car")

        try:
            result = await decode_vin(file_bytes=file_bytes, car_id=sale_car_id)
            
            if result.get("error"):
                error_type = result.get("error")
                if error_type in ["gigachat_connection_error", "gigachat_error"]:
                    logger.error(f"GigaChat error in decode_vin for sale_car_id={sale_car_id}: {result.get('message', 'Unknown error')}")
                    await update_task_status(sale_car_id, TaskStatus.DecodeFailed, entity_type="sale_car")
                    await update_task_status(sale_car_id, TaskStatus.FAILURE, entity_type="sale_car")
                    return {"sale_car_id": sale_car_id, "result": result, "error": True}
                else:
                    await update_task_status(sale_car_id, TaskStatus.OcrFailed, entity_type="sale_car")
                    await update_task_status(sale_car_id, TaskStatus.FAILURE, entity_type="sale_car")
                    return {"sale_car_id": sale_car_id, "result": result, "error": True}
            
            await update_task_status(sale_car_id, TaskStatus.OcrSuccess, entity_type="sale_car")
        except Exception as e:
            logger.exception(f"Exception in decode_vin for sale_car_id={sale_car_id}: {e}")
            await update_task_status(sale_car_id, TaskStatus.OcrFailed, entity_type="sale_car")
            raise

        await update_task_status(sale_car_id, TaskStatus.DecodeStarted, entity_type="sale_car")
        await update_task_status(sale_car_id, TaskStatus.DecodeProcessing, entity_type="sale_car")

        try:
            chroma = ChromaService()
            await chroma.save_document(document_id=sale_car_id, data=result)
            await update_task_status(sale_car_id, TaskStatus.DecodeSuccess, entity_type="sale_car")
        except Exception:
            await update_task_status(sale_car_id, TaskStatus.DecodeFailed, entity_type="sale_car")
            raise

        await update_task_status(sale_car_id, TaskStatus.SUCCESS, entity_type="sale_car")

        async with get_db_session() as db:
            res = await db.execute(select(SaleCars).where(SaleCars.sale_car_id == sale_car_id))
            sale_car = res.scalar_one_or_none()
            if sale_car:
                if result.get("vin"):
                    sale_car.vin = result["vin"]
                sale_car.chroma_document_id = sale_car_id
                await db.commit()

        return {"sale_car_id": sale_car_id, "result": result}

    except Exception as e:
        logger.exception(f"Error in decode_vin_from_sts_sale_car_task sale_car_id={sale_car_id}: {e}")

        await update_task_status(sale_car_id, TaskStatus.FAILURE, entity_type="sale_car")

        raise