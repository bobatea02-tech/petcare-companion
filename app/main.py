"""
Main FastAPI application entry point for PawPal Voice Pet Care Assistant.
"""

import os
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager

from app.core.config import settings
from app.core.logging import setup_logging
from app.core.cache import cache_manager
from app.core.sentry import init_sentry
from app.database.connection import engine
from app.database.models import Base
from app.api.auth import router as auth_router
from app.api.pets import router as pets_router
from app.api.ai import router as ai_router
from app.api.voice import router as voice_router
from app.api.medications import router as medications_router
from app.api.workflows import router as workflows_router
from app.api.files import router as files_router
from app.api.health_records import router as health_records_router
from app.api.appointments import router as appointments_router
from app.api.mumbai_appointments import router as mumbai_appointments_router
from app.api.compliance import router as compliance_router
from app.api.monitoring import router as monitoring_router
from app.api.health import router as health_router
from app.api.community import router as community_router
from app.api.jojo import router as jojo_router
from app.api.vet_search import router as vet_search_router
from app.api.history import router as history_router
from app.core.middleware import (
    limiter, 
    security_middleware, 
    auth_middleware, 
    rate_limit_exceeded_handler,
    LOGIN_RATE_LIMIT,
    GENERAL_RATE_LIMIT
)
from app.middleware.rate_limiter import rate_limit_middleware, rate_limiter
from slowapi import _rate_limit_exceeded_handler
from slowapi.middleware import SlowAPIMiddleware


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan manager."""
    # Startup
    setup_logging()
    
    # Initialize Sentry error tracking
    init_sentry()
    
    # Initialize cache manager
    await cache_manager.initialize()
    
    # Create database tables
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    
    # Start rate limiter cleanup task
    rate_limiter.start_cleanup_task()
    
    yield
    
    # Shutdown
    rate_limiter.stop_cleanup_task()
    await cache_manager.close()
    await engine.dispose()


# Create FastAPI application
app = FastAPI(
    title="PawPal Voice Pet Care Assistant",
    description="AI-native pet care management system with voice interface",
    version="0.1.0",
    lifespan=lifespan,
)

# Add rate limiting middleware
app.state.limiter = limiter
app.add_exception_handler(429, rate_limit_exceeded_handler)
app.add_middleware(SlowAPIMiddleware)

# Add custom middleware
app.middleware("http")(rate_limit_middleware)  # Voice API rate limiting
app.middleware("http")(security_middleware)
app.middleware("http")(auth_middleware)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:5173", "http://localhost:8000", "*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include API routers
app.include_router(health_router, prefix="/api/v1")
app.include_router(auth_router, prefix="/api/v1")
app.include_router(pets_router, prefix="/api/v1")
app.include_router(ai_router, prefix="/api/v1")
app.include_router(voice_router, prefix="/api/v1")
app.include_router(medications_router, prefix="/api/v1")
app.include_router(workflows_router, prefix="/api/v1")
app.include_router(files_router, prefix="/api/v1")
app.include_router(health_records_router, prefix="/api/v1")
app.include_router(appointments_router, prefix="/api/v1")
app.include_router(mumbai_appointments_router, prefix="/api/v1")
app.include_router(compliance_router, prefix="/api/v1")
app.include_router(monitoring_router, prefix="/api/v1")
app.include_router(community_router, prefix="/api/v1")
app.include_router(jojo_router, prefix="/api/v1")
app.include_router(vet_search_router, prefix="/api/v1")
app.include_router(history_router, prefix="/api/v1")


@app.get("/")
async def root():
    """Root endpoint for health check."""
    return {"message": "PawPal Voice Pet Care Assistant API", "version": "0.1.0"}


@app.get("/health")
async def health_check():
    """Health check endpoint."""
    return {"status": "healthy", "service": "pawpal-api"}