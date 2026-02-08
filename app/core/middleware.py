"""
Custom middleware for authentication, rate limiting, and security.
"""

import time
from typing import Dict, Optional
from datetime import datetime
from fastapi import Request, Response, HTTPException, status
from fastapi.responses import JSONResponse, RedirectResponse
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded
from slowapi.middleware import SlowAPIMiddleware
import logging

from app.core.security import verify_token
from app.core.config import settings


# Configure rate limiter
limiter = Limiter(key_func=get_remote_address)

# In-memory store for failed login attempts (in production, use Redis)
failed_login_attempts: Dict[str, Dict[str, int]] = {}

# In-memory store for active sessions (in production, use Redis)
active_sessions: Dict[str, Dict[str, float]] = {}

# Rate limiting configuration
LOGIN_RATE_LIMIT = "5/minute"  # 5 attempts per minute per IP
GENERAL_RATE_LIMIT = "100/minute"  # 100 requests per minute per IP
LOCKOUT_DURATION = 300  # 5 minutes lockout after too many failed attempts
MAX_FAILED_ATTEMPTS = 5

logger = logging.getLogger(__name__)


def get_client_ip(request: Request) -> str:
    """Get client IP address from request."""
    # Check for forwarded headers first (for reverse proxy setups)
    forwarded_for = request.headers.get("X-Forwarded-For")
    if forwarded_for:
        return forwarded_for.split(",")[0].strip()
    
    real_ip = request.headers.get("X-Real-IP")
    if real_ip:
        return real_ip
    
    # Fallback to direct connection IP
    return request.client.host if request.client else "unknown"


def is_ip_locked_out(ip_address: str) -> bool:
    """Check if IP address is currently locked out."""
    if ip_address not in failed_login_attempts:
        return False
    
    attempt_data = failed_login_attempts[ip_address]
    failed_count = attempt_data.get("count", 0)
    last_attempt = attempt_data.get("last_attempt", 0)
    
    # Check if lockout period has expired
    if time.time() - last_attempt > LOCKOUT_DURATION:
        # Reset failed attempts after lockout period
        failed_login_attempts[ip_address] = {"count": 0, "last_attempt": 0}
        return False
    
    return failed_count >= MAX_FAILED_ATTEMPTS


def record_failed_login(ip_address: str):
    """Record a failed login attempt for an IP address."""
    current_time = time.time()
    
    if ip_address not in failed_login_attempts:
        failed_login_attempts[ip_address] = {"count": 0, "last_attempt": 0}
    
    # Reset count if last attempt was more than lockout duration ago
    if current_time - failed_login_attempts[ip_address]["last_attempt"] > LOCKOUT_DURATION:
        failed_login_attempts[ip_address]["count"] = 0
    
    failed_login_attempts[ip_address]["count"] += 1
    failed_login_attempts[ip_address]["last_attempt"] = current_time
    
    logger.warning(f"Failed login attempt from IP {ip_address}. Count: {failed_login_attempts[ip_address]['count']}")


def reset_failed_login(ip_address: str):
    """Reset failed login attempts for an IP address after successful login."""
    if ip_address in failed_login_attempts:
        failed_login_attempts[ip_address] = {"count": 0, "last_attempt": 0}


def create_session(user_id: str, token: str):
    """Create a new session for a user."""
    current_time = time.time()
    active_sessions[token] = {
        "user_id": user_id,
        "created_at": current_time,
        "last_activity": current_time
    }
    logger.info(f"Session created for user {user_id}")


def update_session_activity(token: str):
    """Update last activity time for a session."""
    if token in active_sessions:
        active_sessions[token]["last_activity"] = time.time()


def is_session_valid(token: str) -> bool:
    """Check if session is valid based on timeout settings."""
    if token not in active_sessions:
        return False
    
    session = active_sessions[token]
    current_time = time.time()
    
    # Check absolute session timeout
    session_age = current_time - session["created_at"]
    if session_age > (settings.SESSION_TIMEOUT_MINUTES * 60):
        logger.info(f"Session expired (absolute timeout) for user {session['user_id']}")
        invalidate_session(token)
        return False
    
    # Check idle timeout
    idle_time = current_time - session["last_activity"]
    if idle_time > (settings.SESSION_IDLE_TIMEOUT_MINUTES * 60):
        logger.info(f"Session expired (idle timeout) for user {session['user_id']}")
        invalidate_session(token)
        return False
    
    return True


def invalidate_session(token: str):
    """Invalidate a session."""
    if token in active_sessions:
        user_id = active_sessions[token]["user_id"]
        del active_sessions[token]
        logger.info(f"Session invalidated for user {user_id}")


def cleanup_expired_sessions():
    """Clean up expired sessions (should be called periodically)."""
    current_time = time.time()
    expired_tokens = []
    
    for token, session in active_sessions.items():
        session_age = current_time - session["created_at"]
        idle_time = current_time - session["last_activity"]
        
        if (session_age > (settings.SESSION_TIMEOUT_MINUTES * 60) or 
            idle_time > (settings.SESSION_IDLE_TIMEOUT_MINUTES * 60)):
            expired_tokens.append(token)
    
    for token in expired_tokens:
        invalidate_session(token)
    
    if expired_tokens:
        logger.info(f"Cleaned up {len(expired_tokens)} expired sessions")


async def security_middleware(request: Request, call_next):
    """Security middleware for authentication and rate limiting."""
    
    client_ip = get_client_ip(request)
    
    # HTTPS enforcement (redirect HTTP to HTTPS in production)
    if settings.FORCE_HTTPS and not settings.DEBUG:
        if request.url.scheme == "http":
            https_url = request.url.replace(scheme="https")
            return RedirectResponse(url=str(https_url), status_code=301)
    
    # Check for IP lockout on login endpoints
    if request.url.path.endswith("/login") and request.method == "POST":
        if is_ip_locked_out(client_ip):
            logger.warning(f"Blocked login attempt from locked out IP: {client_ip}")
            return JSONResponse(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                content={
                    "detail": "Too many failed login attempts. Please try again later.",
                    "error_code": "IP_LOCKED_OUT",
                    "retry_after": LOCKOUT_DURATION
                }
            )
    
    # Add security headers
    response = await call_next(request)
    
    if settings.ENABLE_SECURITY_HEADERS:
        # Security headers
        response.headers["X-Content-Type-Options"] = "nosniff"
        response.headers["X-Frame-Options"] = "DENY"
        response.headers["X-XSS-Protection"] = "1; mode=block"
        response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
        response.headers["Content-Security-Policy"] = settings.CSP_POLICY
        response.headers["Permissions-Policy"] = "geolocation=(), microphone=(), camera=()"
        
        # HSTS header for HTTPS
        if request.url.scheme == "https" or settings.FORCE_HTTPS:
            hsts_value = f"max-age={settings.HSTS_MAX_AGE}"
            if settings.HSTS_INCLUDE_SUBDOMAINS:
                hsts_value += "; includeSubDomains"
            response.headers["Strict-Transport-Security"] = hsts_value
    
    return response


async def auth_middleware(request: Request, call_next):
    """Authentication middleware to validate JWT tokens and manage sessions."""
    
    # Skip authentication for public endpoints
    public_paths = [
        "/",
        "/health",
        "/docs",
        "/redoc",
        "/openapi.json",
        "/api/v1/auth/register",
        "/api/v1/auth/login",
        "/api/v1/auth/refresh"
    ]
    
    if request.url.path in public_paths or request.url.path.startswith("/static"):
        return await call_next(request)
    
    # Check for Authorization header
    auth_header = request.headers.get("Authorization")
    if auth_header and auth_header.startswith("Bearer "):
        token = auth_header.split(" ")[1]
        
        # Verify token
        token_payload = verify_token(token, token_type="access")
        if token_payload:
            # Check session validity
            if not is_session_valid(token):
                return JSONResponse(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    content={
                        "detail": "Session expired. Please login again.",
                        "error_code": "SESSION_EXPIRED"
                    }
                )
            
            # Update session activity
            update_session_activity(token)
            
            # Add user info to request state
            request.state.user_id = token_payload.get("sub")
            request.state.user_email = token_payload.get("email")
            request.state.token = token
        else:
            # Invalid token for protected endpoint
            if not request.url.path.startswith("/api/v1/auth"):
                return JSONResponse(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    content={
                        "detail": "Invalid or expired token",
                        "error_code": "INVALID_TOKEN"
                    }
                )
    
    return await call_next(request)


def rate_limit_exceeded_handler(request: Request, exc: RateLimitExceeded):
    """Custom handler for rate limit exceeded errors."""
    client_ip = get_client_ip(request)
    logger.warning(f"Rate limit exceeded for IP {client_ip} on path {request.url.path}")
    
    return JSONResponse(
        status_code=status.HTTP_429_TOO_MANY_REQUESTS,
        content={
            "detail": f"Rate limit exceeded: {exc.detail}",
            "error_code": "RATE_LIMIT_EXCEEDED",
            "retry_after": 60
        }
    )


# Session management utilities
class SessionManager:
    """Manages user sessions and token validation."""
    
    @staticmethod
    def is_token_expired(token_payload: dict) -> bool:
        """Check if token is expired."""
        exp = token_payload.get("exp")
        if exp is None:
            return True
        
        return time.time() > exp
    
    @staticmethod
    def get_token_remaining_time(token_payload: dict) -> int:
        """Get remaining time for token in seconds."""
        exp = token_payload.get("exp")
        if exp is None:
            return 0
        
        remaining = exp - time.time()
        return max(0, int(remaining))
    
    @staticmethod
    def should_refresh_token(token_payload: dict, threshold_minutes: int = 5) -> bool:
        """Check if token should be refreshed based on remaining time."""
        remaining_time = SessionManager.get_token_remaining_time(token_payload)
        return remaining_time < (threshold_minutes * 60)