"""
Graceful degradation utilities for handling service unavailability.

This module provides fallback mechanisms and degraded service modes
when external dependencies are unavailable.
"""

import logging
from typing import Optional, Dict, Any, List, Callable, TypeVar, Generic
from datetime import datetime, timezone
from enum import Enum
import asyncio

logger = logging.getLogger(__name__)

T = TypeVar('T')


class ServiceMode(Enum):
    """Service operation modes."""
    FULL = "full"  # All features available
    DEGRADED = "degraded"  # Limited features available
    MINIMAL = "minimal"  # Only critical features available
    UNAVAILABLE = "unavailable"  # Service unavailable


class ServiceStatus:
    """Represents the status of a service."""
    
    def __init__(
        self,
        service_name: str,
        mode: ServiceMode = ServiceMode.FULL,
        available_features: Optional[List[str]] = None,
        unavailable_features: Optional[List[str]] = None,
        message: Optional[str] = None
    ):
        """
        Initialize service status.
        
        Args:
            service_name: Name of the service
            mode: Current operation mode
            available_features: List of available features
            unavailable_features: List of unavailable features
            message: Status message
        """
        self.service_name = service_name
        self.mode = mode
        self.available_features = available_features or []
        self.unavailable_features = unavailable_features or []
        self.message = message
        self.last_updated = datetime.now(timezone.utc)
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary."""
        return {
            "service_name": self.service_name,
            "mode": self.mode.value,
            "available_features": self.available_features,
            "unavailable_features": self.unavailable_features,
            "message": self.message,
            "last_updated": self.last_updated.isoformat()
        }


class FallbackResult(Generic[T]):
    """Result from a fallback operation."""
    
    def __init__(
        self,
        value: T,
        is_fallback: bool,
        fallback_reason: Optional[str] = None,
        original_error: Optional[Exception] = None
    ):
        """
        Initialize fallback result.
        
        Args:
            value: The result value
            is_fallback: Whether this is a fallback result
            fallback_reason: Reason for using fallback
            original_error: Original error that triggered fallback
        """
        self.value = value
        self.is_fallback = is_fallback
        self.fallback_reason = fallback_reason
        self.original_error = original_error
        self.timestamp = datetime.now(timezone.utc)
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary."""
        return {
            "value": self.value,
            "is_fallback": self.is_fallback,
            "fallback_reason": self.fallback_reason,
            "original_error": str(self.original_error) if self.original_error else None,
            "timestamp": self.timestamp.isoformat()
        }


async def with_fallback(
    primary_func: Callable,
    fallback_func: Callable,
    fallback_reason: str,
    *args,
    **kwargs
) -> FallbackResult:
    """
    Execute primary function with fallback on failure.
    
    Args:
        primary_func: Primary async function to execute
        fallback_func: Fallback async function to execute on failure
        fallback_reason: Reason for fallback
        *args: Arguments for functions
        **kwargs: Keyword arguments for functions
        
    Returns:
        FallbackResult with value and metadata
    """
    try:
        result = await primary_func(*args, **kwargs)
        return FallbackResult(
            value=result,
            is_fallback=False
        )
    except Exception as e:
        logger.warning(
            f"Primary function failed: {e}. Using fallback: {fallback_reason}"
        )
        try:
            fallback_result = await fallback_func(*args, **kwargs)
            return FallbackResult(
                value=fallback_result,
                is_fallback=True,
                fallback_reason=fallback_reason,
                original_error=e
            )
        except Exception as fallback_error:
            logger.error(
                f"Fallback function also failed: {fallback_error}. "
                f"Original error: {e}"
            )
            raise fallback_error


class DegradationManager:
    """Manages service degradation states and fallback strategies."""
    
    def __init__(self):
        """Initialize degradation manager."""
        self.service_statuses: Dict[str, ServiceStatus] = {}
        self._lock = asyncio.Lock()
    
    async def set_service_status(
        self,
        service_name: str,
        mode: ServiceMode,
        available_features: Optional[List[str]] = None,
        unavailable_features: Optional[List[str]] = None,
        message: Optional[str] = None
    ):
        """
        Set the status of a service.
        
        Args:
            service_name: Name of the service
            mode: Current operation mode
            available_features: List of available features
            unavailable_features: List of unavailable features
            message: Status message
        """
        async with self._lock:
            status = ServiceStatus(
                service_name=service_name,
                mode=mode,
                available_features=available_features,
                unavailable_features=unavailable_features,
                message=message
            )
            self.service_statuses[service_name] = status
            
            logger.info(
                f"Service '{service_name}' status updated to {mode.value}: {message}"
            )
    
    def get_service_status(self, service_name: str) -> Optional[ServiceStatus]:
        """Get status of a service."""
        return self.service_statuses.get(service_name)
    
    def get_all_statuses(self) -> Dict[str, ServiceStatus]:
        """Get all service statuses."""
        return self.service_statuses.copy()
    
    def is_service_available(self, service_name: str) -> bool:
        """Check if a service is available (not unavailable mode)."""
        status = self.get_service_status(service_name)
        if not status:
            return True  # Assume available if no status set
        return status.mode != ServiceMode.UNAVAILABLE
    
    def is_feature_available(self, service_name: str, feature: str) -> bool:
        """Check if a specific feature is available."""
        status = self.get_service_status(service_name)
        if not status:
            return True  # Assume available if no status set
        
        if status.mode == ServiceMode.UNAVAILABLE:
            return False
        
        if status.available_features:
            return feature in status.available_features
        
        if status.unavailable_features:
            return feature not in status.unavailable_features
        
        return True
    
    def get_system_health(self) -> Dict[str, Any]:
        """
        Get overall system health based on service statuses.
        
        Returns:
            Dictionary with system health information
        """
        if not self.service_statuses:
            return {
                "overall_status": "healthy",
                "services_count": 0,
                "degraded_services": [],
                "unavailable_services": []
            }
        
        degraded = []
        unavailable = []
        
        for service_name, status in self.service_statuses.items():
            if status.mode == ServiceMode.UNAVAILABLE:
                unavailable.append(service_name)
            elif status.mode in [ServiceMode.DEGRADED, ServiceMode.MINIMAL]:
                degraded.append(service_name)
        
        # Determine overall status
        if unavailable:
            overall_status = "degraded"
        elif degraded:
            overall_status = "partial"
        else:
            overall_status = "healthy"
        
        return {
            "overall_status": overall_status,
            "services_count": len(self.service_statuses),
            "degraded_services": degraded,
            "unavailable_services": unavailable,
            "service_details": {
                name: status.to_dict()
                for name, status in self.service_statuses.items()
            }
        }


# Global degradation manager instance
degradation_manager = DegradationManager()


# Convenience functions
async def set_service_degraded(
    service_name: str,
    unavailable_features: List[str],
    message: str
):
    """Mark a service as degraded."""
    await degradation_manager.set_service_status(
        service_name=service_name,
        mode=ServiceMode.DEGRADED,
        unavailable_features=unavailable_features,
        message=message
    )


async def set_service_unavailable(service_name: str, message: str):
    """Mark a service as unavailable."""
    await degradation_manager.set_service_status(
        service_name=service_name,
        mode=ServiceMode.UNAVAILABLE,
        message=message
    )


async def set_service_available(service_name: str, message: str = "Service restored"):
    """Mark a service as fully available."""
    await degradation_manager.set_service_status(
        service_name=service_name,
        mode=ServiceMode.FULL,
        message=message
    )


def is_service_available(service_name: str) -> bool:
    """Check if a service is available."""
    return degradation_manager.is_service_available(service_name)


def is_feature_available(service_name: str, feature: str) -> bool:
    """Check if a specific feature is available."""
    return degradation_manager.is_feature_available(service_name, feature)


def get_system_health() -> Dict[str, Any]:
    """Get overall system health."""
    return degradation_manager.get_system_health()
