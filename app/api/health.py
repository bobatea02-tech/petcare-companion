"""
Health check and monitoring endpoints for production deployment.
"""

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import text
from datetime import datetime
import asyncio

from app.database.connection import get_db
from app.core.cache import cache_manager
from app.core.config import settings

router = APIRouter(prefix="/health", tags=["health"])


@router.get("/")
async def health_check():
    """
    Basic health check endpoint.
    Returns 200 if service is running.
    """
    return {
        "status": "healthy",
        "service": "pawpal-api",
        "version": "0.1.0",
        "timestamp": datetime.utcnow().isoformat()
    }


@router.get("/ready")
async def readiness_check(db: AsyncSession = Depends(get_db)):
    """
    Readiness check endpoint.
    Verifies that all critical dependencies are available.
    Returns 200 if ready to serve traffic, 503 otherwise.
    """
    checks = {
        "database": False,
        "cache": False,
        "timestamp": datetime.utcnow().isoformat()
    }
    
    # Check database connectivity
    try:
        result = await db.execute(text("SELECT 1"))
        checks["database"] = result.scalar() == 1
    except Exception as e:
        checks["database_error"] = str(e)
    
    # Check cache connectivity
    try:
        if settings.REDIS_ENABLED:
            await cache_manager.set("health_check", "ok", ttl=10)
            value = await cache_manager.get("health_check")
            checks["cache"] = value == "ok"
        else:
            checks["cache"] = True  # In-memory cache always available
    except Exception as e:
        checks["cache_error"] = str(e)
    
    # Determine overall status
    all_healthy = checks["database"] and checks["cache"]
    
    if all_healthy:
        return {
            "status": "ready",
            "checks": checks
        }
    else:
        raise HTTPException(
            status_code=503,
            detail={
                "status": "not_ready",
                "checks": checks
            }
        )


@router.get("/live")
async def liveness_check():
    """
    Liveness check endpoint.
    Returns 200 if the application process is alive.
    Used by orchestrators to determine if container should be restarted.
    """
    return {
        "status": "alive",
        "timestamp": datetime.utcnow().isoformat()
    }


@router.get("/startup")
async def startup_check(db: AsyncSession = Depends(get_db)):
    """
    Startup check endpoint.
    Verifies that the application has completed initialization.
    Returns 200 when startup is complete, 503 otherwise.
    """
    checks = {
        "database_migrations": False,
        "cache_initialized": False,
        "timestamp": datetime.utcnow().isoformat()
    }
    
    try:
        # Check if database tables exist
        result = await db.execute(text("SELECT COUNT(*) FROM users LIMIT 1"))
        checks["database_migrations"] = True
    except Exception as e:
        checks["database_error"] = str(e)
    
    try:
        # Check if cache is initialized
        checks["cache_initialized"] = cache_manager._initialized
    except Exception as e:
        checks["cache_error"] = str(e)
    
    all_ready = checks["database_migrations"] and checks["cache_initialized"]
    
    if all_ready:
        return {
            "status": "started",
            "checks": checks
        }
    else:
        raise HTTPException(
            status_code=503,
            detail={
                "status": "starting",
                "checks": checks
            }
        )
