import json
import redis
import asyncio
from typing import Optional, Dict, Any
from loguru import logger
from app.core.config import RedisSettings

redis_settings = RedisSettings()

class CacheService:
    
    def __init__(self):
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
        
        try:
            self.redis_client = redis.Redis(**redis_params)
            self.redis_client.ping()
        except Exception as e:
            logger.error(f"Failed to connect to Redis for caching: {e}")
            self.redis_client = None
    
    def _get_key(self, prefix: str, document_id: str) -> str:
        return f"cache:{prefix}:{document_id}"
    
    async def get(self, prefix: str, document_id: str) -> Optional[Dict[str, Any]]:
        
        if not self.redis_client:
            return None
        
        try:
            key = self._get_key(prefix, document_id)
            loop = asyncio.get_event_loop()
            cached_data = await loop.run_in_executor(
                None,
                self.redis_client.get,
                key
            )
            if cached_data:
                return json.loads(cached_data)
        except Exception as e:
            logger.warning(f"Failed to get from cache: {e}")
        
        return None
    
    async def set(self, prefix: str, document_id: str, data: Dict[str, Any], ttl: Optional[int] = None) -> bool:
        
        if not self.redis_client:
            return False
        
        try:
            key = self._get_key(prefix, document_id)
            ttl = ttl or redis_settings.redis_ttl
            payload = json.dumps(data, ensure_ascii=False)
            loop = asyncio.get_event_loop()
            await loop.run_in_executor(
                None,
                lambda: self.redis_client.setex(key, ttl, payload)
            )
            return True
        except Exception as e:
            logger.warning(f"Failed to set cache: {e}")
            return False
    
    async def delete(self, prefix: str, document_id: str) -> bool:
        
        if not self.redis_client:
            return False
        
        try:
            key = self._get_key(prefix, document_id)
            loop = asyncio.get_event_loop()
            await loop.run_in_executor(
                None,
                self.redis_client.delete,
                key
            )
            return True
        except Exception as e:
            logger.warning(f"Failed to delete from cache: {e}")
            return False
    
    async def delete_many(self, prefix: str, document_ids: list[str]) -> int:
       
        if not self.redis_client or not document_ids:
            return 0
        
        try:
            keys = [self._get_key(prefix, doc_id) for doc_id in document_ids]
            loop = asyncio.get_event_loop()
            deleted = await loop.run_in_executor(
                None,
                lambda: self.redis_client.delete(*keys)
            )
            return deleted
        except Exception as e:
            logger.warning(f"Failed to delete many from cache: {e}")
            return 0

cache_service = CacheService()

