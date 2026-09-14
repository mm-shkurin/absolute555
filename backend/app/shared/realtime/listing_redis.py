"""The Redis side of a listing's stream: the channel the ARQ worker publishes on."""

import asyncio
import json

import redis

from loguru import logger

from app.shared.redis_client import make_redis_client


POLL_SECONDS = 0.1


def get_redis_message(pubsub, timeout=POLL_SECONDS):
    """Blocking read, run in an executor: redis-py's pubsub has no async client here."""
    return pubsub.get_message(timeout=timeout)


def channel_of(sale_car_id: str) -> str:
    return f"sse_messages:{sale_car_id}"


def _channel_name(value) -> str:
    return value.decode("utf-8") if isinstance(value, bytes) else (value or "")


def open_pubsub():
    return make_redis_client().pubsub(ignore_subscribe_messages=False)


async def subscribe(pubsub, sale_car_id: str) -> None:
    channel = channel_of(sale_car_id)
    pubsub.subscribe(channel)
    logger.info("Subscribed to Redis channel: {} for sale_car_id={}", channel, sale_car_id)
    try:
        loop = asyncio.get_event_loop()
        confirmation = await loop.run_in_executor(None, get_redis_message, pubsub, 1.0)
        if confirmation:
            confirmed = confirmation.get("channel", "unknown")
            logger.info("Redis subscription confirmed for channel: {}", confirmed)
            if confirmed != channel:
                logger.warning("Subscribed to different channel! Expected: {}, Got: {}", channel, confirmed)
    except redis.RedisError as e:
        logger.warning("Could not confirm Redis subscription: {}", e)


async def read_channel_frame(pubsub, sale_car_id: str) -> str | None:
    """The next frame the worker published, or None. A broker hiccup never ends the stream."""
    try:
        loop = asyncio.get_event_loop()
        message = await loop.run_in_executor(None, get_redis_message, pubsub, 0.01)
    except redis.RedisError as e:
        logger.debug("Error getting Redis message: {}", e)
        return None
    if not message:
        return None
    if message.get("type") == "subscribe":
        logger.debug("Subscribed to channel: {}", _channel_name(message.get('channel')))
        return None
    if message.get("type") != "message":
        return None
    return _frame_from(message, sale_car_id)


def _frame_from(message: dict, sale_car_id: str) -> str | None:
    channel = _channel_name(message.get("channel"))
    expected = channel_of(sale_car_id)
    if channel != expected:
        logger.warning("Received message from unexpected channel: {}, expected: {}", channel, expected)
        return None
    try:
        data = json.loads(message["data"])
    except json.JSONDecodeError as e:
        logger.warning("Failed to parse Redis message: {}, raw: {}", e, message.get('data', ''))
        return None
    except (KeyError, TypeError) as e:
        logger.error("Error processing Redis message: {}", e)
        return None
    logger.info("Received Redis message for sale_car_id={}: status={}", sale_car_id, data.get('status', 'unknown'))
    return f"data: {json.dumps(data)}\n\n"


def close_subscription(pubsub, sale_car_id: str) -> None:
    if not pubsub:
        return
    channel = channel_of(sale_car_id)
    try:
        pubsub.unsubscribe(channel)
        pubsub.close()
        logger.info("Unsubscribed from Redis channel: {}", channel)
    except redis.RedisError as e:
        logger.error("Error unsubscribing from Redis: {}", e)
