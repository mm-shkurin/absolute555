import httpx
from loguru import logger
from app.core.config import WebhookSettings
from sqlalchemy.ext.asyncio import AsyncSession
from datetime import datetime

webhook_settings = WebhookSettings()

class WebhookService:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def send_tg_webhook(
        self,
        sale_car_id: str,
        sale_car_data: dict
    ):
        if not webhook_settings.tg_webhook_url:
            logger.warning("Telegram webhook URL not configured")
            return
        
        webhook_url = str(webhook_settings.tg_webhook_url)
        
        payload = {
            "event": "sale_car_ready",
            "sale_car_id": sale_car_id,
            "timestamp": datetime.now().isoformat(),
            "data": sale_car_data
        }

        try:
            async with httpx.AsyncClient(timeout=10.0) as client:
                response = await client.post(
                    webhook_url,
                    json=payload,
                    headers={"X-Webhook-Secret": webhook_settings.webhook_secret}
                )
                response.raise_for_status()
                logger.info(f"Webhook sent successfully for sale_car_id={sale_car_id}")
        except Exception as e:
            logger.error(f"Failed to send webhook for sale_car_id={sale_car_id}: {e}")

    async def send_tg_webhook_delete(
        self,
        sale_car_id: str
    ):
        """Отправляет вебхук на удаление сообщения в Telegram"""
        if not webhook_settings.tg_webhook_url:
            logger.warning("Telegram webhook URL not configured")
            return
        
        webhook_url = str(webhook_settings.tg_webhook_url)
        
        payload = {
            "event": "sale_car_deleted",
            "sale_car_id": sale_car_id,
            "timestamp": datetime.now().isoformat()
        }

        try:
            async with httpx.AsyncClient(timeout=10.0) as client:
                response = await client.post(
                    webhook_url,
                    json=payload,
                    headers={"X-Webhook-Secret": webhook_settings.webhook_secret}
                )
                response.raise_for_status()
                logger.info(f"Delete webhook sent successfully for sale_car_id={sale_car_id}")
        except Exception as e:
            logger.error(f"Failed to send delete webhook for sale_car_id={sale_car_id}: {e}")

    async def send_tg_webhook_status_change(
        self,
        sale_car_id: str,
        old_status: str,
        new_status: str,
        sale_car_data: dict = None
    ):
        """Отправляет вебхук об изменении статуса объявления в Telegram"""
        if not webhook_settings.tg_webhook_url:
            logger.warning("Telegram webhook URL not configured")
            return
        
        webhook_url = str(webhook_settings.tg_webhook_url)
        
        payload = {
            "event": "sale_car_status_changed",
            "sale_car_id": sale_car_id,
            "old_status": old_status,
            "new_status": new_status,
            "timestamp": datetime.now().isoformat()
        }
        
        if sale_car_data:
            payload["data"] = sale_car_data

        try:
            async with httpx.AsyncClient(timeout=10.0) as client:
                response = await client.post(
                    webhook_url,
                    json=payload,
                    headers={"X-Webhook-Secret": webhook_settings.webhook_secret}
                )
                response.raise_for_status()
                logger.info(f"Status change webhook sent successfully for sale_car_id={sale_car_id}: {old_status} -> {new_status}")
        except Exception as e:
            logger.error(f"Failed to send status change webhook for sale_car_id={sale_car_id}: {e}")