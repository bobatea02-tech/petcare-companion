"""
Tests for caching functionality.
"""

import pytest
from app.core.cache import CacheManager, CacheTTL


def test_cache_ttl_constants():
    """Test that cache TTL constants are defined."""
    assert CacheTTL.USER_PROFILE > 0
    assert CacheTTL.PET_PROFILE > 0
    assert CacheTTL.MEDICATION > 0
    assert CacheTTL.HEALTH_RECORD > 0
    assert CacheTTL.APPOINTMENT > 0
    assert CacheTTL.AI_ASSESSMENT > 0
    assert CacheTTL.STATIC_DATA > 0
    assert CacheTTL.VET_CLINIC > 0
    assert CacheTTL.STATISTICS > 0


def test_cache_manager_initialization():
    """Test cache manager can be initialized."""
    manager = CacheManager()
    assert manager is not None
    assert manager._memory_cache == {}
    assert manager._use_redis is False


def test_cache_key_generation():
    """Test cache key generation with different argument types."""
    manager = CacheManager()
    
    # Test with simple types
    key1 = manager._generate_key("prefix", "arg1", 42, True)
    assert "prefix" in key1
    assert "arg1" in key1
    assert "42" in key1
    
    # Test with keyword arguments
    key2 = manager._generate_key("prefix", user_id="123", active=True)
    assert "prefix" in key2
    assert "user_id" in key2
    
    # Same arguments should generate same key
    key3 = manager._generate_key("prefix", "arg1", 42, True)
    assert key1 == key3


@pytest.mark.asyncio
async def test_cache_basic_operations():
    """Test basic cache operations with in-memory fallback."""
    manager = CacheManager()
    await manager.initialize()
    
    # Test set and get
    key = "test:key"
    value = {"data": "test_value"}
    
    await manager.set(key, value, ttl=60)
    cached_value = await manager.get(key)
    assert cached_value == value
    
    # Test delete
    await manager.delete(key)
    assert await manager.get(key) is None
    
    await manager.close()


@pytest.mark.asyncio
async def test_cache_exists():
    """Test cache key existence check."""
    manager = CacheManager()
    await manager.initialize()
    
    key = "test:exists"
    
    # Key should not exist initially
    assert await manager.exists(key) is False
    
    # Set value
    await manager.set(key, "value")
    
    # Key should exist now
    assert await manager.exists(key) is True
    
    await manager.close()

