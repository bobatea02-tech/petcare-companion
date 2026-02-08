"""
Caching layer for improved performance using Redis.
"""

import json
import pickle
from typing import Any, Optional, Callable, Union
from functools import wraps
from datetime import timedelta
import hashlib

try:
    import redis.asyncio as redis
    REDIS_AVAILABLE = True
except ImportError:
    REDIS_AVAILABLE = False

from app.core.config import settings


class CacheManager:
    """
    Centralized cache manager supporting both Redis and in-memory fallback.
    """
    
    def __init__(self):
        """Initialize cache manager with Redis or in-memory fallback."""
        self._redis_client: Optional[redis.Redis] = None
        self._memory_cache: dict = {}
        self._use_redis = False
        
    async def initialize(self):
        """Initialize Redis connection if available."""
        if not REDIS_AVAILABLE:
            print("Redis not available, using in-memory cache")
            return
        
        try:
            redis_url = getattr(settings, 'REDIS_URL', 'redis://localhost:6379/0')
            self._redis_client = redis.from_url(
                redis_url,
                encoding="utf-8",
                decode_responses=False,
                socket_connect_timeout=5,
                socket_timeout=5,
                retry_on_timeout=True,
                max_connections=50
            )
            # Test connection
            await self._redis_client.ping()
            self._use_redis = True
            print("Redis cache initialized successfully")
        except Exception as e:
            print(f"Redis connection failed: {e}, using in-memory cache")
            self._redis_client = None
            self._use_redis = False
    
    async def close(self):
        """Close Redis connection."""
        if self._redis_client:
            await self._redis_client.close()
    
    def _generate_key(self, prefix: str, *args, **kwargs) -> str:
        """
        Generate a cache key from prefix and arguments.
        
        Args:
            prefix: Key prefix
            *args: Positional arguments
            **kwargs: Keyword arguments
            
        Returns:
            Cache key string
        """
        key_parts = [prefix]
        
        # Add positional arguments
        for arg in args:
            if isinstance(arg, (str, int, float, bool)):
                key_parts.append(str(arg))
            else:
                # Hash complex objects
                key_parts.append(hashlib.md5(str(arg).encode()).hexdigest()[:8])
        
        # Add keyword arguments
        for k, v in sorted(kwargs.items()):
            if isinstance(v, (str, int, float, bool)):
                key_parts.append(f"{k}:{v}")
            else:
                key_parts.append(f"{k}:{hashlib.md5(str(v).encode()).hexdigest()[:8]}")
        
        return ":".join(key_parts)
    
    async def get(self, key: str) -> Optional[Any]:
        """
        Get value from cache.
        
        Args:
            key: Cache key
            
        Returns:
            Cached value or None
        """
        if self._use_redis and self._redis_client:
            try:
                value = await self._redis_client.get(key)
                if value:
                    return pickle.loads(value)
            except Exception as e:
                print(f"Redis get error: {e}")
                return None
        else:
            # In-memory cache
            cache_entry = self._memory_cache.get(key)
            if cache_entry:
                return cache_entry.get('value')
        
        return None
    
    async def set(
        self,
        key: str,
        value: Any,
        ttl: Optional[int] = None
    ) -> bool:
        """
        Set value in cache with optional TTL.
        
        Args:
            key: Cache key
            value: Value to cache
            ttl: Time to live in seconds
            
        Returns:
            True if successful
        """
        if self._use_redis and self._redis_client:
            try:
                serialized = pickle.dumps(value)
                if ttl:
                    await self._redis_client.setex(key, ttl, serialized)
                else:
                    await self._redis_client.set(key, serialized)
                return True
            except Exception as e:
                print(f"Redis set error: {e}")
                return False
        else:
            # In-memory cache
            self._memory_cache[key] = {
                'value': value,
                'ttl': ttl
            }
            return True
    
    async def delete(self, key: str) -> bool:
        """
        Delete value from cache.
        
        Args:
            key: Cache key
            
        Returns:
            True if successful
        """
        if self._use_redis and self._redis_client:
            try:
                await self._redis_client.delete(key)
                return True
            except Exception as e:
                print(f"Redis delete error: {e}")
                return False
        else:
            # In-memory cache
            if key in self._memory_cache:
                del self._memory_cache[key]
            return True
    
    async def delete_pattern(self, pattern: str) -> int:
        """
        Delete all keys matching pattern.
        
        Args:
            pattern: Key pattern (e.g., "user:*")
            
        Returns:
            Number of keys deleted
        """
        if self._use_redis and self._redis_client:
            try:
                keys = []
                async for key in self._redis_client.scan_iter(match=pattern):
                    keys.append(key)
                
                if keys:
                    await self._redis_client.delete(*keys)
                    return len(keys)
                return 0
            except Exception as e:
                print(f"Redis delete pattern error: {e}")
                return 0
        else:
            # In-memory cache
            keys_to_delete = [
                k for k in self._memory_cache.keys()
                if pattern.replace('*', '') in k
            ]
            for key in keys_to_delete:
                del self._memory_cache[key]
            return len(keys_to_delete)
    
    async def exists(self, key: str) -> bool:
        """
        Check if key exists in cache.
        
        Args:
            key: Cache key
            
        Returns:
            True if key exists
        """
        if self._use_redis and self._redis_client:
            try:
                return await self._redis_client.exists(key) > 0
            except Exception as e:
                print(f"Redis exists error: {e}")
                return False
        else:
            return key in self._memory_cache
    
    async def increment(self, key: str, amount: int = 1) -> int:
        """
        Increment a counter in cache.
        
        Args:
            key: Cache key
            amount: Amount to increment
            
        Returns:
            New value
        """
        if self._use_redis and self._redis_client:
            try:
                return await self._redis_client.incrby(key, amount)
            except Exception as e:
                print(f"Redis increment error: {e}")
                return 0
        else:
            # In-memory cache
            current = self._memory_cache.get(key, {}).get('value', 0)
            new_value = current + amount
            self._memory_cache[key] = {'value': new_value}
            return new_value
    
    async def get_many(self, keys: list[str]) -> dict[str, Any]:
        """
        Get multiple values from cache.
        
        Args:
            keys: List of cache keys
            
        Returns:
            Dictionary of key-value pairs
        """
        result = {}
        
        if self._use_redis and self._redis_client:
            try:
                values = await self._redis_client.mget(keys)
                for key, value in zip(keys, values):
                    if value:
                        result[key] = pickle.loads(value)
            except Exception as e:
                print(f"Redis get_many error: {e}")
        else:
            # In-memory cache
            for key in keys:
                cache_entry = self._memory_cache.get(key)
                if cache_entry:
                    result[key] = cache_entry.get('value')
        
        return result
    
    async def set_many(
        self,
        mapping: dict[str, Any],
        ttl: Optional[int] = None
    ) -> bool:
        """
        Set multiple values in cache.
        
        Args:
            mapping: Dictionary of key-value pairs
            ttl: Time to live in seconds
            
        Returns:
            True if successful
        """
        if self._use_redis and self._redis_client:
            try:
                pipe = self._redis_client.pipeline()
                for key, value in mapping.items():
                    serialized = pickle.dumps(value)
                    if ttl:
                        pipe.setex(key, ttl, serialized)
                    else:
                        pipe.set(key, serialized)
                await pipe.execute()
                return True
            except Exception as e:
                print(f"Redis set_many error: {e}")
                return False
        else:
            # In-memory cache
            for key, value in mapping.items():
                self._memory_cache[key] = {
                    'value': value,
                    'ttl': ttl
                }
            return True


# Global cache manager instance
cache_manager = CacheManager()


def cached(
    prefix: str,
    ttl: int = 300,
    key_builder: Optional[Callable] = None
):
    """
    Decorator for caching function results.
    
    Args:
        prefix: Cache key prefix
        ttl: Time to live in seconds (default 5 minutes)
        key_builder: Optional custom key builder function
        
    Example:
        @cached(prefix="user", ttl=600)
        async def get_user(user_id: str):
            return await db.get_user(user_id)
    """
    def decorator(func: Callable):
        @wraps(func)
        async def wrapper(*args, **kwargs):
            # Build cache key
            if key_builder:
                cache_key = key_builder(*args, **kwargs)
            else:
                cache_key = cache_manager._generate_key(prefix, *args, **kwargs)
            
            # Try to get from cache
            cached_value = await cache_manager.get(cache_key)
            if cached_value is not None:
                return cached_value
            
            # Execute function
            result = await func(*args, **kwargs)
            
            # Cache result
            if result is not None:
                await cache_manager.set(cache_key, result, ttl)
            
            return result
        
        return wrapper
    return decorator


class CacheInvalidator:
    """Utility class for cache invalidation strategies."""
    
    @staticmethod
    async def invalidate_user_cache(user_id: str):
        """Invalidate all cache entries for a user."""
        await cache_manager.delete_pattern(f"user:{user_id}:*")
        await cache_manager.delete(f"user:{user_id}")
    
    @staticmethod
    async def invalidate_pet_cache(pet_id: str):
        """Invalidate all cache entries for a pet."""
        await cache_manager.delete_pattern(f"pet:{pet_id}:*")
        await cache_manager.delete(f"pet:{pet_id}")
    
    @staticmethod
    async def invalidate_medication_cache(medication_id: str, pet_id: str):
        """Invalidate medication and related pet cache."""
        await cache_manager.delete(f"medication:{medication_id}")
        await cache_manager.delete_pattern(f"pet:{pet_id}:medications:*")
    
    @staticmethod
    async def invalidate_appointment_cache(appointment_id: str, pet_id: str, user_id: str):
        """Invalidate appointment and related caches."""
        await cache_manager.delete(f"appointment:{appointment_id}")
        await cache_manager.delete_pattern(f"pet:{pet_id}:appointments:*")
        await cache_manager.delete_pattern(f"user:{user_id}:appointments:*")
    
    @staticmethod
    async def invalidate_health_record_cache(health_record_id: str, pet_id: str):
        """Invalidate health record and related pet cache."""
        await cache_manager.delete(f"health_record:{health_record_id}")
        await cache_manager.delete_pattern(f"pet:{pet_id}:health_records:*")


# Cache TTL constants (in seconds)
class CacheTTL:
    """Standard TTL values for different data types."""
    
    USER_PROFILE = 600  # 10 minutes
    PET_PROFILE = 600  # 10 minutes
    MEDICATION = 300  # 5 minutes
    HEALTH_RECORD = 300  # 5 minutes
    APPOINTMENT = 300  # 5 minutes
    AI_ASSESSMENT = 1800  # 30 minutes
    STATIC_DATA = 3600  # 1 hour
    VET_CLINIC = 3600  # 1 hour
    STATISTICS = 180  # 3 minutes
