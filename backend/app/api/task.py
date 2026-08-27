import asyncio
import json
import time
import uuid
import redis
from fastapi import APIRouter, HTTPException, Request
from fastapi.responses import StreamingResponse, HTMLResponse
from fastapi.templating import Jinja2Templates
from sqlalchemy import select
from loguru import logger

from app.sse.manager import sse_manager
from app.db.database import get_db_session
from app.models.sale_car import SaleCars
from app.tasks.status_updater import TaskStatus

task_router = APIRouter()
templates = Jinja2Templates(directory="app/templates")

def _get_redis_message(pubsub, timeout=0.1):
    """Синхронная функция для получения сообщения из Redis pubsub"""
    return pubsub.get_message(timeout=timeout)

@task_router.get("/sse/{sale_car_id}")
async def sse_endpoint(sale_car_id: str):
    async def event_generator():
        queue = asyncio.Queue()
        pubsub = None

        try:
            try:
                uuid.UUID(sale_car_id)
            except ValueError:
                yield f"data: {json.dumps({'type': 'error', 'message': 'Invalid sale_car_id format'})}\n\n"
                return
            
            sse_manager.add_connection(sale_car_id, queue)
            
            from app.core.config import RedisSettings
            redis_settings = RedisSettings()
            redis_params = {
                'host': redis_settings.redis_network_name,
                'port': redis_settings.redis_port,
                'decode_responses': True
            }
            
            if redis_settings.redis_user and redis_settings.redis_user_password:
                redis_params['username'] = redis_settings.redis_user
                redis_params['password'] = redis_settings.redis_user_password
            elif redis_settings.redis_password:
                redis_params['password'] = redis_settings.redis_password
            
            redis_client = redis.Redis(**redis_params)
            pubsub = redis_client.pubsub(ignore_subscribe_messages=False)
            
            redis_channel = f"sse_messages:{sale_car_id}"
            pubsub.subscribe(redis_channel)
            logger.info(f"Subscribed to Redis channel: {redis_channel} for sale_car_id={sale_car_id}")
            
            try:
                loop = asyncio.get_event_loop()
                subscribe_message = await loop.run_in_executor(
                    None,
                    _get_redis_message,
                    pubsub,
                    1.0
                )
                if subscribe_message:
                    confirmed_channel = subscribe_message.get('channel', 'unknown')
                    logger.info(f"✅ Redis subscription confirmed for channel: {confirmed_channel}")
                    if confirmed_channel != redis_channel:
                        logger.warning(f"⚠️ Subscribed to different channel! Expected: {redis_channel}, Got: {confirmed_channel}")
            except Exception as e:
                logger.warning(f"Could not confirm Redis subscription: {e}")

            current_status = TaskStatus.PENDING
            try:
                async with get_db_session() as db:
                    result = await db.execute(select(SaleCars).where(SaleCars.sale_car_id == sale_car_id))
                    sale_car = result.scalar_one_or_none()
                    if sale_car and sale_car.task_status:
                        current_status = sale_car.task_status
            except Exception as e:
                logger.warning(f"Could not fetch listing status from DB: {e}, using PENDING")

            initial_message = {
                "sale_car_id": sale_car_id,
                "status": current_status,
                "type": "initial",
                "timestamp": time.time()
            }
            initial_sse_data = f"data: {json.dumps(initial_message)}\n\n"
            logger.info(f"📤 Sending initial SSE message for sale_car_id={sale_car_id}, status={current_status}")
            yield initial_sse_data
            
            last_heartbeat = time.time()
            heartbeat_interval = 30.0  
            
            while True:
                try:
                    try:
                        message = queue.get_nowait()
                        msg_sale_car_id = message.get('sale_car_id')
                        msg_sale_car_id_str = str(msg_sale_car_id) if msg_sale_car_id else None
                        sale_car_id_str = str(sale_car_id)
                        
                        if msg_sale_car_id_str == sale_car_id_str or msg_sale_car_id is None:
                            logger.info(f"📨 Sending local queue message for sale_car_id={sale_car_id}: {message.get('status', 'unknown')}")
                            yield f"data: {json.dumps(message)}\n\n"
                        else:
                            logger.debug(f"⏭️ Skipping local message for different sale_car_id: {msg_sale_car_id_str} != {sale_car_id_str}")
                        continue
                    except asyncio.QueueEmpty:
                        pass
                    
                    try:
                        loop = asyncio.get_event_loop()
                        redis_message = await loop.run_in_executor(
                            None,
                            _get_redis_message,
                            pubsub,
                            0.01  
                        )
                        if redis_message:
                            if redis_message['type'] == 'message':
                                try:
                                    message_channel = redis_message.get('channel', b'').decode('utf-8') if isinstance(redis_message.get('channel'), bytes) else redis_message.get('channel', '')
                                    expected_channel = f"sse_messages:{sale_car_id}"
                                    
                                    if message_channel == expected_channel:
                                        message_data = json.loads(redis_message['data'])
                                        logger.info(f"📨 Received Redis message from channel {message_channel} for sale_car_id={sale_car_id}: {message_data}")
                                        
                                        sse_data = f"data: {json.dumps(message_data)}\n\n"
                                        logger.info(f"✅ Sending SSE message to client for sale_car_id={sale_car_id}: status={message_data.get('status', 'unknown')}, type={message_data.get('type', 'unknown')}")
                                        logger.debug(f"📤 SSE data: {sse_data.strip()}")
                                        yield sse_data
                                    else:
                                        logger.warning(f"⚠️ Received message from unexpected channel: {message_channel}, expected: {expected_channel}")
                                except json.JSONDecodeError as e:
                                    logger.warning(f"Failed to parse Redis message: {e}, raw: {redis_message.get('data', '')}")
                                except Exception as e:
                                    logger.error(f"Error processing Redis message: {e}")
                            elif redis_message['type'] == 'subscribe':
                                subscribed_channel = redis_message.get('channel', b'').decode('utf-8') if isinstance(redis_message.get('channel'), bytes) else redis_message.get('channel', '')
                                logger.debug(f"Subscribed to channel: {subscribed_channel}")
                    except Exception as e:
                        logger.debug(f"Error getting Redis message: {e}")
                    
                    current_time = time.time()
                    if current_time - last_heartbeat >= heartbeat_interval:
                        heartbeat_message = {
                            "type": "heartbeat",
                            "sale_car_id": sale_car_id,
                            "timestamp": current_time
                        }
                        yield f"data: {json.dumps(heartbeat_message)}\n\n"
                        last_heartbeat = current_time
                    
                    await asyncio.sleep(0.01)  
                    
                except asyncio.CancelledError:
                    raise
                except Exception as e:
                    logger.error(f"Error in message loop for sale_car_id={sale_car_id}: {e}")
                    await asyncio.sleep(0.1)
                
        except asyncio.CancelledError:
            logger.info(f"SSE connection cancelled for sale_car_id={sale_car_id}")
        except Exception as e:
            logger.error(f"Error in SSE stream for sale_car_id={sale_car_id}: {e}")
            yield f"data: {json.dumps({'type': 'error', 'message': str(e), 'sale_car_id': sale_car_id})}\n\n"
        finally:
            sse_manager.remove_connection(sale_car_id, queue)
            if pubsub:
                try:
                    redis_channel = f"sse_messages:{sale_car_id}"
                    pubsub.unsubscribe(redis_channel)
                    pubsub.close()
                    logger.info(f"Unsubscribed from Redis channel: {redis_channel}")
                except Exception as e:
                    logger.error(f"Error unsubscribing from Redis: {e}")
    
    return StreamingResponse(
        event_generator(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no",  
            "Access-Control-Allow-Origin": "*"
        }
    )

@task_router.post("/test-update")
async def test_update_status(request: Request):
    from app.tasks.status_updater import update_task_status
    
    try:
        body = await request.json()
        sale_car_id = body.get("sale_car_id")
        status = body.get("status", "TestStatus")
        
        if not sale_car_id:
            return {"error": "sale_car_id is required"}
        
        await update_task_status(sale_car_id, status)
        return {
            "message": "Status updated successfully",
            "sale_car_id": sale_car_id,
            "status": status
        }
    except Exception as e:
        logger.error(f"Error updating status: {e}")
        return {"error": str(e)}

@task_router.get("/test-page", response_class=HTMLResponse)
async def get_test_page(request: Request):
    return templates.TemplateResponse(
        "sse_test.html",
        {
            "request": request,
            "title": "SSE Task Status Test"
        }
    )
