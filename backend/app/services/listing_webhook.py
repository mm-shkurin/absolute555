"""The payload the Telegram channel receives about a listing.

Lifted out of SaleCarService when that file passed the 200-line limit. Its only caller
is the announcement path; nothing in the request cycle depends on it.
"""

from loguru import logger

from app.core.config import FrontendSettings
from app.models.sale_car import SaleCars
from app.services.s3_service import s3_service
from app.services.webhook_service import WebhookService

frontend_settings = FrontendSettings()


async def announce_when_ready(db, sale_car: SaleCars) -> bool:
    """Tell the channel about a listing, once it has at least one photo."""
    if not (sale_car.photos or []):
        logger.debug(f"Sale car {sale_car.sale_car_id} has no photos, skipping webhook")
        return False

    try:
        await WebhookService(db).send_tg_webhook(
            sale_car_id=str(sale_car.sale_car_id),
            sale_car_data=to_payload(sale_car),
        )
        return True
    except Exception as error:
        logger.error(f"Failed to send webhook for sale_car_id={sale_car.sale_car_id}: {error}")
        return False


def to_payload(sale_car: SaleCars) -> dict:
    keys = [photo["key"] for photo in (sale_car.photos or [])]
    return {
        "sale_car_id": str(sale_car.sale_car_id),
        "user_id": str(sale_car.user_id),
        "price": sale_car.price,
        "milleage": sale_car.milleage,
        "phone_number": sale_car.phone_number,
        "vin": sale_car.vin,
        "description": sale_car.description,
        "photo_count": len(keys),
        "photo_urls": [s3_service.get_public_photo_url(key) for key in keys],
        "listing_url": f"{str(frontend_settings.frontend_url).rstrip('/')}/cars/{sale_car.sale_car_id}",
        # The decoded СТС fields used to be fetched from ChromaDB by document id and
        # nested under a "car_data" key. They are columns now, so they are flat here.
        "brand": sale_car.brand.name_ru if sale_car.brand else None,
        "model": sale_car.model.name if sale_car.model else None,
        "year": sale_car.year,
        "transmission": sale_car.transmission,
        "engine_power": sale_car.engine_power,
    }
