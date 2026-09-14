"""One way to reach Redis from RedisSettings, shared by the cache and the SSE fan-out."""

import redis

from app.core.config_storage import RedisSettings


def make_redis_client(settings: RedisSettings | None = None) -> redis.Redis:
    settings = settings or RedisSettings()
    params = {
        "host": settings.redis_network_name,
        "port": settings.redis_port,
        "decode_responses": True,
    }
    if settings.redis_user and settings.redis_user_password:
        params["username"] = settings.redis_user
        params["password"] = settings.redis_user_password
    elif settings.redis_password:
        params["password"] = settings.redis_password
    return redis.Redis(**params)
