import asyncio
import json
import redis
from typing import Dict, List, Any
from loguru import logger
from app.core.config import RedisSettings

class SSEManager:

    def __init__(self):
        self.active_connections: Dict[str,List[asyncio.Queue]] = {}
        
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
        
        self.redis_client = redis.Redis(**redis_params)
        
        self.pubsub = self.redis_client.pubsub()
        logger.info("SSE Manager initialized with Redis support")
        
        try:
            self.redis_client.ping()
            logger.info("Redis connection test successful")
        except Exception as e:
            logger.error(f"Redis connection test failed: {e}")

    def add_connection(self, car_id:str, queue:asyncio.Queue):
        if car_id not in self.active_connections:
            self.active_connections[car_id] = []
        self.active_connections[car_id].append(queue)
        logger.info(f"Added connection for car_id: {car_id}")

    def remove_connection(self, car_id: str, queue: asyncio.Queue):
        if car_id in self.active_connections:
            try:
                self.active_connections[car_id].remove(queue)
                if not self.active_connections[car_id]:
                    del self.active_connections[car_id]
                logger.info(f"Removed SSE connection for car_id={car_id}")
            except ValueError:
                pass

    async def send_message(self, car_id: str, message: Dict[str, Any]):
        logger.info(f"Attempting to send SSE message to car_id={car_id}")
        
        try:
            channel = f"sse_messages:{car_id}"
            message_json = json.dumps(message)
            self.redis_client.publish(channel, message_json)
            logger.info(f"Published SSE message to Redis channel {channel}")
        except Exception as e:
            logger.error(f"Error publishing to Redis for car_id={car_id}: {e}")
        
        if car_id in self.active_connections:
            connections = self.active_connections[car_id].copy()
            for queue in connections:
                try:
                    await queue.put(message)
                    logger.info(f"Sent message locally to car_id={car_id}")
                except Exception as e:
                    logger.error(f"Error sending local message to car_id={car_id}: {e}")
                    self.remove_connection(car_id, queue)

sse_manager = SSEManager()