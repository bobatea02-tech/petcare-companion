"""
Tests for graceful degradation functionality.
"""

import pytest
from app.core.graceful_degradation import (
    DegradationManager,
    ServiceMode,
    ServiceStatus,
    with_fallback,
    set_service_degraded,
    set_service_unavailable,
    set_service_available,
    is_service_available,
    is_feature_available
)


@pytest.mark.asyncio
async def test_degradation_manager_set_status():
    """Test setting service status."""
    manager = DegradationManager()
    
    await manager.set_service_status(
        service_name="test_service",
        mode=ServiceMode.DEGRADED,
        unavailable_features=["feature1", "feature2"],
        message="Service degraded"
    )
    
    status = manager.get_service_status("test_service")
    assert status is not None
    assert status.mode == ServiceMode.DEGRADED
    assert "feature1" in status.unavailable_features
    assert status.message == "Service degraded"


@pytest.mark.asyncio
async def test_degradation_manager_is_service_available():
    """Test checking if service is available."""
    manager = DegradationManager()
    
    # Service not set should be available
    assert manager.is_service_available("unknown_service")
    
    # Set service as degraded (still available)
    await manager.set_service_status(
        "test_service",
        ServiceMode.DEGRADED,
        message="Degraded"
    )
    assert manager.is_service_available("test_service")
    
    # Set service as unavailable
    await manager.set_service_status(
        "test_service",
        ServiceMode.UNAVAILABLE,
        message="Unavailable"
    )
    assert not manager.is_service_available("test_service")


@pytest.mark.asyncio
async def test_degradation_manager_is_feature_available():
    """Test checking if specific feature is available."""
    manager = DegradationManager()
    
    # Feature not set should be available
    assert manager.is_feature_available("test_service", "feature1")
    
    # Set service with unavailable features
    await manager.set_service_status(
        "test_service",
        ServiceMode.DEGRADED,
        unavailable_features=["feature1", "feature2"]
    )
    
    assert not manager.is_feature_available("test_service", "feature1")
    assert not manager.is_feature_available("test_service", "feature2")
    assert manager.is_feature_available("test_service", "feature3")


@pytest.mark.asyncio
async def test_degradation_manager_system_health():
    """Test getting overall system health."""
    manager = DegradationManager()
    
    # No services set
    health = manager.get_system_health()
    assert health["overall_status"] == "healthy"
    assert health["services_count"] == 0
    
    # Add degraded service
    await manager.set_service_status(
        "service1",
        ServiceMode.DEGRADED,
        message="Degraded"
    )
    
    health = manager.get_system_health()
    assert health["overall_status"] == "partial"
    assert "service1" in health["degraded_services"]
    
    # Add unavailable service
    await manager.set_service_status(
        "service2",
        ServiceMode.UNAVAILABLE,
        message="Unavailable"
    )
    
    health = manager.get_system_health()
    assert health["overall_status"] == "degraded"
    assert "service2" in health["unavailable_services"]


@pytest.mark.asyncio
async def test_with_fallback_success():
    """Test fallback when primary succeeds."""
    async def primary():
        return "primary_result"
    
    async def fallback():
        return "fallback_result"
    
    result = await with_fallback(primary, fallback, "test fallback")
    
    assert result.value == "primary_result"
    assert not result.is_fallback
    assert result.fallback_reason is None


@pytest.mark.asyncio
async def test_with_fallback_failure():
    """Test fallback when primary fails."""
    async def primary():
        raise Exception("Primary failed")
    
    async def fallback():
        return "fallback_result"
    
    result = await with_fallback(primary, fallback, "test fallback")
    
    assert result.value == "fallback_result"
    assert result.is_fallback
    assert result.fallback_reason == "test fallback"
    assert result.original_error is not None


@pytest.mark.asyncio
async def test_convenience_functions():
    """Test convenience functions for setting service status."""
    # Set degraded
    await set_service_degraded(
        "test_service",
        unavailable_features=["feature1"],
        message="Degraded"
    )
    assert is_service_available("test_service")
    assert not is_feature_available("test_service", "feature1")
    
    # Set unavailable
    await set_service_unavailable("test_service", "Unavailable")
    assert not is_service_available("test_service")
    
    # Set available
    await set_service_available("test_service", "Restored")
    assert is_service_available("test_service")
