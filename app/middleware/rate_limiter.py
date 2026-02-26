"""
Rate Limiting Middleware for Voice API Endpoints

Implements token bucket algorithm for rate limiting to prevent abuse
and ensure fair usage of voice processing resources.
"""

import time
import logging
from typing import Dict, Optional
from collections import defaultdict
from fastapi import Request, HTTPException, status
from fastapi.responses import JSONResponse
import asyncio

logger = logging.getLogger(__name__)


class TokenBucket:
    """
    Token bucket implementation for rate limiting.
    
    Tokens are added at a constant rate. Each request consumes tokens.
    If no tokens available, request is rate limited.
    """
    
    def __init__(self, capacity: int, refill_rate: float):
        """
        Initialize token bucket.
        
        Args:
            capacity: Maximum number of tokens
            refill_rate: Tokens added per second
        """
        self.capacity = capacity
        self.refill_rate = refill_rate
        self.tokens = capacity
        self.last_refill = time.time()
        self.lock = asyncio.Lock()
    
    async def consume(self, tokens: int = 1) -> bool:
        """
        Try to consume tokens from bucket.
        
        Args:
            tokens: Number of tokens to consume
            
        Returns:
            True if tokens consumed, False if rate limited
        """
        async with self.lock:
            # Refill tokens based on time elapsed
            now = time.time()
            elapsed = now - self.last_refill
            self.tokens = min(
                self.capacity,
                self.tokens + (elapsed * self.refill_rate)
            )
            self.last_refill = now
            
            # Check if enough tokens available
            if self.tokens >= tokens:
                self.tokens -= tokens
                return True
            
            return False
    
    def get_wait_time(self, tokens: int = 1) -> float:
        """
        Calculate wait time until tokens available.
        
        Args:
            tokens: Number of tokens needed
            
        Returns:
            Wait time in seconds
        """
        if self.tokens >= tokens:
            return 0.0
        
        tokens_needed = tokens - self.tokens
        return tokens_needed / self.refill_rate


class RateLimiter:
    """
    Rate limiter for API endpoints using token bucket algorithm.
    """
    
    def __init__(self):
        """Initialize rate limiter with default limits."""
        # User-based rate limits (per user ID)
        self.user_buckets: Dict[str, TokenBucket] = defaultdict(
            lambda: TokenBucket(capacity=60, refill_rate=1.0)  # 60 requests per minute
        )
        
        # IP-based rate limits (for unauthenticated requests)
        self.ip_buckets: Dict[str, TokenBucket] = defaultdict(
            lambda: TokenBucket(capacity=20, refill_rate=0.33)  # 20 requests per minute
        )
        
        # Endpoint-specific limits
        self.endpoint_limits = {
            "/voice/transcribe": TokenBucket(capacity=30, refill_rate=0.5),  # 30/min
            "/voice/synthesize": TokenBucket(capacity=30, refill_rate=0.5),  # 30/min
            "/voice/command": TokenBucket(capacity=20, refill_rate=0.33),    # 20/min
            "/voice/upload-audio": TokenBucket(capacity=10, refill_rate=0.17), # 10/min
        }
        
        # Cleanup task
        self.cleanup_task = None
    
    async def check_rate_limit(
        self,
        request: Request,
        user_id: Optional[str] = None,
        tokens: int = 1
    ) -> tuple[bool, Optional[float]]:
        """
        Check if request should be rate limited.
        
        Args:
            request: FastAPI request object
            user_id: User ID if authenticated
            tokens: Number of tokens to consume
            
        Returns:
            Tuple of (allowed, wait_time)
        """
        # Get identifier (user ID or IP)
        identifier = user_id if user_id else self._get_client_ip(request)
        
        # Select appropriate bucket
        if user_id:
            bucket = self.user_buckets[identifier]
        else:
            bucket = self.ip_buckets[identifier]
        
        # Check endpoint-specific limit
        endpoint = request.url.path
        if endpoint in self.endpoint_limits:
            endpoint_bucket = self.endpoint_limits[endpoint]
            if not await endpoint_bucket.consume(tokens):
                wait_time = endpoint_bucket.get_wait_time(tokens)
                return False, wait_time
        
        # Check user/IP limit
        if not await bucket.consume(tokens):
            wait_time = bucket.get_wait_time(tokens)
            return False, wait_time
        
        return True, None
    
    def _get_client_ip(self, request: Request) -> str:
        """
        Get client IP address from request.
        
        Args:
            request: FastAPI request object
            
        Returns:
            Client IP address
        """
        # Check for forwarded IP (behind proxy)
        forwarded = request.headers.get("X-Forwarded-For")
        if forwarded:
            return forwarded.split(",")[0].strip()
        
        # Check for real IP
        real_ip = request.headers.get("X-Real-IP")
        if real_ip:
            return real_ip
        
        # Fallback to direct client
        return request.client.host if request.client else "unknown"
    
    async def cleanup_old_buckets(self):
        """
        Periodically cleanup old token buckets to prevent memory leaks.
        """
        while True:
            await asyncio.sleep(3600)  # Run every hour
            
            # Cleanup user buckets (keep only active users)
            current_time = time.time()
            user_buckets_to_remove = []
            
            for user_id, bucket in self.user_buckets.items():
                # Remove if inactive for 1 hour
                if current_time - bucket.last_refill > 3600:
                    user_buckets_to_remove.append(user_id)
            
            for user_id in user_buckets_to_remove:
                del self.user_buckets[user_id]
            
            # Cleanup IP buckets
            ip_buckets_to_remove = []
            
            for ip, bucket in self.ip_buckets.items():
                # Remove if inactive for 1 hour
                if current_time - bucket.last_refill > 3600:
                    ip_buckets_to_remove.append(ip)
            
            for ip in ip_buckets_to_remove:
                del self.ip_buckets[ip]
            
            logger.info(
                f"Rate limiter cleanup: removed {len(user_buckets_to_remove)} "
                f"user buckets and {len(ip_buckets_to_remove)} IP buckets"
            )
    
    def start_cleanup_task(self):
        """Start background cleanup task."""
        if not self.cleanup_task:
            self.cleanup_task = asyncio.create_task(self.cleanup_old_buckets())
    
    def stop_cleanup_task(self):
        """Stop background cleanup task."""
        if self.cleanup_task:
            self.cleanup_task.cancel()
            self.cleanup_task = None


# Global rate limiter instance
rate_limiter = RateLimiter()


async def rate_limit_middleware(request: Request, call_next):
    """
    Middleware to apply rate limiting to requests.
    
    Args:
        request: FastAPI request
        call_next: Next middleware/handler
        
    Returns:
        Response or rate limit error
    """
    # Skip rate limiting for non-voice endpoints
    if not request.url.path.startswith("/api/v1/voice"):
        return await call_next(request)
    
    # Get user ID if authenticated
    user_id = None
    if hasattr(request.state, "user"):
        user_id = str(request.state.user.id)
    
    # Check rate limit
    allowed, wait_time = await rate_limiter.check_rate_limit(
        request,
        user_id=user_id,
        tokens=1
    )
    
    if not allowed:
        # Rate limited
        logger.warning(
            f"Rate limit exceeded for {user_id or rate_limiter._get_client_ip(request)} "
            f"on {request.url.path}"
        )
        
        return JSONResponse(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            content={
                "error": "Rate limit exceeded",
                "message": f"Too many requests. Please wait {int(wait_time)} seconds.",
                "retry_after": int(wait_time),
                "limit_type": "voice_api"
            },
            headers={
                "Retry-After": str(int(wait_time)),
                "X-RateLimit-Limit": "60",
                "X-RateLimit-Remaining": "0",
                "X-RateLimit-Reset": str(int(time.time() + wait_time))
            }
        )
    
    # Process request
    response = await call_next(request)
    
    # Add rate limit headers
    response.headers["X-RateLimit-Limit"] = "60"
    response.headers["X-RateLimit-Remaining"] = str(int(
        rate_limiter.user_buckets[user_id].tokens if user_id 
        else rate_limiter.ip_buckets[rate_limiter._get_client_ip(request)].tokens
    ))
    
    return response


def get_rate_limiter() -> RateLimiter:
    """
    Get global rate limiter instance.
    
    Returns:
        RateLimiter instance
    """
    return rate_limiter
