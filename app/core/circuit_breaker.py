"""
Circuit Breaker pattern implementation for external API calls.

This module provides circuit breaker functionality to prevent cascading failures
when external services are unavailable or experiencing issues.
"""

import asyncio
import logging
from datetime import datetime, timedelta, timezone
from enum import Enum
from typing import Optional, Callable, Any, Dict
from functools import wraps
import time

logger = logging.getLogger(__name__)


class CircuitState(Enum):
    """Circuit breaker states."""
    CLOSED = "closed"  # Normal operation
    OPEN = "open"  # Circuit is open, requests fail fast
    HALF_OPEN = "half_open"  # Testing if service has recovered


class CircuitBreakerError(Exception):
    """Exception raised when circuit breaker is open."""
    pass


class CircuitBreaker:
    """
    Circuit breaker implementation for protecting external service calls.
    
    The circuit breaker monitors failures and automatically opens when
    failure threshold is reached, preventing further calls to the failing service.
    After a timeout period, it enters half-open state to test if service recovered.
    """
    
    def __init__(
        self,
        name: str,
        failure_threshold: int = 5,
        timeout_seconds: int = 60,
        half_open_max_calls: int = 3,
        success_threshold: int = 2
    ):
        """
        Initialize circuit breaker.
        
        Args:
            name: Name of the circuit breaker (for logging)
            failure_threshold: Number of consecutive failures before opening
            timeout_seconds: Seconds to wait before entering half-open state
            half_open_max_calls: Max calls allowed in half-open state
            success_threshold: Successes needed in half-open to close circuit
        """
        self.name = name
        self.failure_threshold = failure_threshold
        self.timeout_seconds = timeout_seconds
        self.half_open_max_calls = half_open_max_calls
        self.success_threshold = success_threshold
        
        self.state = CircuitState.CLOSED
        self.failure_count = 0
        self.success_count = 0
        self.last_failure_time: Optional[datetime] = None
        self.half_open_calls = 0
        
        # Statistics
        self.total_calls = 0
        self.total_failures = 0
        self.total_successes = 0
        self.last_state_change: Optional[datetime] = None
        
        self._lock = asyncio.Lock()
    
    async def call(self, func: Callable, *args, **kwargs) -> Any:
        """
        Execute function with circuit breaker protection.
        
        Args:
            func: Async function to execute
            *args: Positional arguments for function
            **kwargs: Keyword arguments for function
            
        Returns:
            Result from function execution
            
        Raises:
            CircuitBreakerError: If circuit is open
            Exception: Original exception from function if circuit allows call
        """
        async with self._lock:
            self.total_calls += 1
            
            # Check if circuit should transition from open to half-open
            if self.state == CircuitState.OPEN:
                if self._should_attempt_reset():
                    logger.info(f"Circuit breaker '{self.name}' entering HALF_OPEN state")
                    self.state = CircuitState.HALF_OPEN
                    self.half_open_calls = 0
                    self.success_count = 0
                    self.last_state_change = datetime.now(timezone.utc)
                else:
                    raise CircuitBreakerError(
                        f"Circuit breaker '{self.name}' is OPEN. "
                        f"Service unavailable until {self._get_reset_time()}"
                    )
            
            # Check if half-open state has exceeded max calls
            if self.state == CircuitState.HALF_OPEN:
                if self.half_open_calls >= self.half_open_max_calls:
                    logger.warning(
                        f"Circuit breaker '{self.name}' exceeded half-open max calls, "
                        f"reopening circuit"
                    )
                    self._open_circuit()
                    raise CircuitBreakerError(
                        f"Circuit breaker '{self.name}' is OPEN after half-open test failed"
                    )
                self.half_open_calls += 1
        
        # Execute the function
        try:
            result = await func(*args, **kwargs)
            await self._on_success()
            return result
        except Exception as e:
            await self._on_failure(e)
            raise
    
    async def _on_success(self):
        """Handle successful function execution."""
        async with self._lock:
            self.total_successes += 1
            self.failure_count = 0
            
            if self.state == CircuitState.HALF_OPEN:
                self.success_count += 1
                logger.info(
                    f"Circuit breaker '{self.name}' success in HALF_OPEN state "
                    f"({self.success_count}/{self.success_threshold})"
                )
                
                if self.success_count >= self.success_threshold:
                    logger.info(f"Circuit breaker '{self.name}' closing after successful recovery")
                    self.state = CircuitState.CLOSED
                    self.half_open_calls = 0
                    self.success_count = 0
                    self.last_state_change = datetime.now(timezone.utc)
    
    async def _on_failure(self, exception: Exception):
        """Handle failed function execution."""
        async with self._lock:
            self.total_failures += 1
            self.failure_count += 1
            self.last_failure_time = datetime.now(timezone.utc)
            
            logger.warning(
                f"Circuit breaker '{self.name}' recorded failure "
                f"({self.failure_count}/{self.failure_threshold}): {exception}"
            )
            
            if self.state == CircuitState.HALF_OPEN:
                logger.warning(
                    f"Circuit breaker '{self.name}' failed in HALF_OPEN state, reopening"
                )
                self._open_circuit()
            elif self.failure_count >= self.failure_threshold:
                logger.error(
                    f"Circuit breaker '{self.name}' threshold reached, opening circuit"
                )
                self._open_circuit()
    
    def _open_circuit(self):
        """Open the circuit breaker."""
        self.state = CircuitState.OPEN
        self.last_state_change = datetime.now(timezone.utc)
        self.half_open_calls = 0
        self.success_count = 0
    
    def _should_attempt_reset(self) -> bool:
        """Check if enough time has passed to attempt reset."""
        if not self.last_failure_time:
            return True
        
        elapsed = (datetime.now(timezone.utc) - self.last_failure_time).total_seconds()
        return elapsed >= self.timeout_seconds
    
    def _get_reset_time(self) -> str:
        """Get the time when circuit will attempt reset."""
        if not self.last_failure_time:
            return "unknown"
        
        reset_time = self.last_failure_time + timedelta(seconds=self.timeout_seconds)
        return reset_time.strftime("%Y-%m-%d %H:%M:%S UTC")
    
    def get_state(self) -> Dict[str, Any]:
        """
        Get current circuit breaker state and statistics.
        
        Returns:
            Dictionary with state information
        """
        return {
            "name": self.name,
            "state": self.state.value,
            "failure_count": self.failure_count,
            "success_count": self.success_count,
            "total_calls": self.total_calls,
            "total_failures": self.total_failures,
            "total_successes": self.total_successes,
            "failure_rate": (
                self.total_failures / self.total_calls if self.total_calls > 0 else 0
            ),
            "last_failure_time": (
                self.last_failure_time.isoformat() if self.last_failure_time else None
            ),
            "last_state_change": (
                self.last_state_change.isoformat() if self.last_state_change else None
            ),
            "reset_time": self._get_reset_time() if self.state == CircuitState.OPEN else None
        }
    
    async def reset(self):
        """Manually reset the circuit breaker to closed state."""
        async with self._lock:
            logger.info(f"Circuit breaker '{self.name}' manually reset to CLOSED state")
            self.state = CircuitState.CLOSED
            self.failure_count = 0
            self.success_count = 0
            self.half_open_calls = 0
            self.last_state_change = datetime.now(timezone.utc)


class CircuitBreakerRegistry:
    """Registry for managing multiple circuit breakers."""
    
    def __init__(self):
        """Initialize circuit breaker registry."""
        self._breakers: Dict[str, CircuitBreaker] = {}
        self._lock = asyncio.Lock()
    
    async def get_or_create(
        self,
        name: str,
        failure_threshold: int = 5,
        timeout_seconds: int = 60,
        half_open_max_calls: int = 3,
        success_threshold: int = 2
    ) -> CircuitBreaker:
        """
        Get existing circuit breaker or create new one.
        
        Args:
            name: Name of the circuit breaker
            failure_threshold: Number of consecutive failures before opening
            timeout_seconds: Seconds to wait before entering half-open state
            half_open_max_calls: Max calls allowed in half-open state
            success_threshold: Successes needed in half-open to close circuit
            
        Returns:
            CircuitBreaker instance
        """
        async with self._lock:
            if name not in self._breakers:
                self._breakers[name] = CircuitBreaker(
                    name=name,
                    failure_threshold=failure_threshold,
                    timeout_seconds=timeout_seconds,
                    half_open_max_calls=half_open_max_calls,
                    success_threshold=success_threshold
                )
            return self._breakers[name]
    
    def get(self, name: str) -> Optional[CircuitBreaker]:
        """Get circuit breaker by name."""
        return self._breakers.get(name)
    
    def get_all_states(self) -> Dict[str, Dict[str, Any]]:
        """Get states of all circuit breakers."""
        return {name: breaker.get_state() for name, breaker in self._breakers.items()}
    
    async def reset_all(self):
        """Reset all circuit breakers to closed state."""
        async with self._lock:
            for breaker in self._breakers.values():
                await breaker.reset()


# Global circuit breaker registry
circuit_breaker_registry = CircuitBreakerRegistry()


def with_circuit_breaker(
    name: str,
    failure_threshold: int = 5,
    timeout_seconds: int = 60,
    half_open_max_calls: int = 3,
    success_threshold: int = 2
):
    """
    Decorator to wrap async functions with circuit breaker protection.
    
    Args:
        name: Name of the circuit breaker
        failure_threshold: Number of consecutive failures before opening
        timeout_seconds: Seconds to wait before entering half-open state
        half_open_max_calls: Max calls allowed in half-open state
        success_threshold: Successes needed in half-open to close circuit
    
    Example:
        @with_circuit_breaker("external_api", failure_threshold=3, timeout_seconds=30)
        async def call_external_api():
            # API call logic
            pass
    """
    def decorator(func: Callable):
        @wraps(func)
        async def wrapper(*args, **kwargs):
            breaker = await circuit_breaker_registry.get_or_create(
                name=name,
                failure_threshold=failure_threshold,
                timeout_seconds=timeout_seconds,
                half_open_max_calls=half_open_max_calls,
                success_threshold=success_threshold
            )
            return await breaker.call(func, *args, **kwargs)
        return wrapper
    return decorator
