import asyncio
import json

import redis
from typing import Dict, List, Any
from loguru import logger
from app.shared.redis_client import make_redis_client

class SSEManager:

    def __init__(self):
        self.active_connections: Dict[str,List[asyncio.Queue]] = {}

        self.redis_client = make_redis_client()

        self.pubsub = self.redis_client.pubsub()
        logger.info("SSE Manager initialized with Redis support")

        try:
            self.redis_client.ping()
            logger.info("Redis connection test successful")
        except redis.RedisError as e:
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
        except (redis.RedisError, TypeError) as e:
            logger.error(f"Error publishing to Redis for car_id={car_id}: {e}")

        if car_id in self.active_connections:
            connections = self.active_connections[car_id].copy()
            for queue in connections:
                try:
                    await queue.put(message)
                    logger.info(f"Sent message locally to car_id={car_id}")
                except RuntimeError as e:
                    logger.error(f"Error sending local message to car_id={car_id}: {e}")
                    self.remove_connection(car_id, queue)

sse_manager = SSEManager()
