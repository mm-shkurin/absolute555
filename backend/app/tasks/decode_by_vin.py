"""Распознавание по VIN, который продавец вписал руками.

Второй вход в ту же очередь, что и чтение снимка СТС, и отличается он ровно двумя
вещами. Шага OCR здесь нет: читать нечего, снимка нет — поэтому исход `unreadable`
по построению невозможен, а VIN, по которому машина не нашлась, это `undecoded`.
И сам номер задача не трогает: его выбрал продавец, а распознавание выбор продавца
не перетирает.
"""

from loguru import logger

from app.ml.sts_vision import VisionUnavailable
from app.ml.vin_decode import read_vin
from app.tasks.decode_persist import persist_decoded
from app.tasks.status_updater import TaskStatus, update_task_status


def _decoded(vin: str) -> dict | None:
    """Поля по VIN, либо None, если по нему ничего не нашлось."""
    try:
        fields = read_vin(vin)
    except VisionUnavailable as error:
        logger.error(f"vin provider unavailable: {error}")
        return None
    except Exception as error:
        logger.exception(f"decoding VIN {vin} failed: {error}")
        return None

    if not any(fields.get(name) for name in ("mark", "model", "year")):
        return None

    # Ключи те же, что у чтения СТС: дальше поля кладёт на строку один и тот же
    # `persist_decoded`, и расхождение в именах здесь означало бы два разных объявления
    # из двух источников одних и тех же полей.
    return {
        "year": fields.get("year"),
        "engine_power": fields.get("power"),
        "transmission": fields.get("transmission"),
        "mark": fields.get("mark"),
        "model": fields.get("model"),
    }


async def decode_car_from_vin(ctx: dict, sale_car_id: str, vin: str):
    """Прочитать характеристики по вписанному VIN и записать их на объявление."""
    try:
        await update_task_status(sale_car_id, TaskStatus.STARTED, entity_type="sale_car")
        await update_task_status(sale_car_id, TaskStatus.DecodeStarted, entity_type="sale_car")

        result = _decoded(vin)
        if result is None:
            logger.info(f"nothing decoded from VIN {vin} for sale_car_id={sale_car_id}")
            await update_task_status(sale_car_id, TaskStatus.DecodeFailed, entity_type="sale_car")
            await update_task_status(sale_car_id, TaskStatus.FAILURE, entity_type="sale_car")
            return {"sale_car_id": sale_car_id, "error": True}

        try:
            if not await persist_decoded(sale_car_id, result):
                await update_task_status(sale_car_id, TaskStatus.DecodeFailed, entity_type="sale_car")
                await update_task_status(sale_car_id, TaskStatus.FAILURE, entity_type="sale_car")
                return {"sale_car_id": sale_car_id, "error": True}

            await update_task_status(sale_car_id, TaskStatus.DecodeSuccess, entity_type="sale_car")
        except Exception:
            await update_task_status(sale_car_id, TaskStatus.DecodeFailed, entity_type="sale_car")
            raise

        await update_task_status(sale_car_id, TaskStatus.SUCCESS, entity_type="sale_car")
        return {"sale_car_id": sale_car_id, "result": result}

    except Exception as error:
        logger.exception(f"decode_car_from_vin failed for sale_car_id={sale_car_id}: {error}")
        await update_task_status(sale_car_id, TaskStatus.FAILURE, entity_type="sale_car")
        raise
