"""
Monitoring and health check API endpoints.

This module provides endpoints for monitoring system health, circuit breaker status,
error statistics, and service degradation information.
"""

from fastapi import APIRouter, Depends, HTTPException, status
from typing import Dict, Any, List
import logging

from app.core.circuit_breaker import circuit_breaker_registry
from app.core.error_monitoring import get_error_statistics, get_recent_errors
from app.core.graceful_degradation import get_system_health
from app.core.dependencies import get_current_user
from app.services.ai_service import ai_service
from app.services.maps_service import maps_service
from app.services.sms_service import sms_service
from app.services.email_service import email_service

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/monitoring", tags=["monitoring"])


@router.get("/health")
async def health_check() -> Dict[str, Any]:
    """
    Basic health check endpoint.
    
    Returns:
        Health status information
    """
    return {
        "status": "healthy",
        "service": "pawpal-api",
        "message": "Service is running"
    }


@router.get("/health/detailed")
async def detailed_health_check() -> Dict[str, Any]:
    """
    Detailed health check including all external services.
    
    Returns:
        Detailed health status for all services
    """
    # Check AI service
    ai_health = await ai_service.health_check()
    
    # Check SMS service
    sms_health = await sms_service.health_check()
    
    # Check Email service
    email_health = await email_service.health_check()
    
    # Check Maps service
    maps_available = maps_service.is_available()
    maps_health = {
        "service": "maps",
        "status": "healthy" if maps_available else "unavailable",
        "google_maps_configured": maps_available
    }
    
    # Get system health from degradation manager
    system_health = get_system_health()
    
    return {
        "overall_status": system_health["overall_status"],
        "services": {
            "ai": ai_health,
            "sms": sms_health,
            "email": email_health,
            "maps": maps_health
        },
        "system_health": system_health
    }


@router.get("/circuit-breakers")
async def get_circuit_breaker_status(
    current_user: Dict[str, Any] = Depends(get_current_user)
) -> Dict[str, Any]:
    """
    Get status of all circuit breakers.
    
    Requires authentication.
    
    Returns:
        Circuit breaker status information
    """
    return {
        "circuit_breakers": circuit_breaker_registry.get_all_states()
    }


@router.post("/circuit-breakers/{breaker_name}/reset")
async def reset_circuit_breaker(
    breaker_name: str,
    current_user: Dict[str, Any] = Depends(get_current_user)
) -> Dict[str, Any]:
    """
    Manually reset a circuit breaker.
    
    Requires authentication.
    
    Args:
        breaker_name: Name of the circuit breaker to reset
        
    Returns:
        Reset confirmation
    """
    breaker = circuit_breaker_registry.get(breaker_name)
    
    if not breaker:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Circuit breaker '{breaker_name}' not found"
        )
    
    await breaker.reset()
    
    logger.info(f"Circuit breaker '{breaker_name}' reset by user {current_user.get('id')}")
    
    return {
        "message": f"Circuit breaker '{breaker_name}' has been reset",
        "state": breaker.get_state()
    }


@router.post("/circuit-breakers/reset-all")
async def reset_all_circuit_breakers(
    current_user: Dict[str, Any] = Depends(get_current_user)
) -> Dict[str, Any]:
    """
    Reset all circuit breakers.
    
    Requires authentication.
    
    Returns:
        Reset confirmation
    """
    await circuit_breaker_registry.reset_all()
    
    logger.info(f"All circuit breakers reset by user {current_user.get('id')}")
    
    return {
        "message": "All circuit breakers have been reset",
        "circuit_breakers": circuit_breaker_registry.get_all_states()
    }


@router.get("/errors/statistics")
async def get_error_stats(
    current_user: Dict[str, Any] = Depends(get_current_user)
) -> Dict[str, Any]:
    """
    Get error statistics.
    
    Requires authentication.
    
    Returns:
        Error statistics
    """
    return get_error_statistics()


@router.get("/errors/recent")
async def get_recent_error_events(
    limit: int = 10,
    current_user: Dict[str, Any] = Depends(get_current_user)
) -> Dict[str, Any]:
    """
    Get recent error events.
    
    Requires authentication.
    
    Args:
        limit: Maximum number of errors to return
        
    Returns:
        List of recent error events
    """
    recent_errors = get_recent_errors(limit)
    
    return {
        "count": len(recent_errors),
        "errors": [error.to_dict() for error in recent_errors]
    }


@router.get("/system/health")
async def get_system_health_status() -> Dict[str, Any]:
    """
    Get overall system health status.
    
    Returns:
        System health information
    """
    return get_system_health()
