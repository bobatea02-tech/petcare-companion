"""
Tests for circuit breaker functionality.
"""

import pytest
import asyncio
from app.core.circuit_breaker import (
    CircuitBreaker,
    CircuitState,
    CircuitBreakerError,
    with_circuit_breaker
)


@pytest.mark.asyncio
async def test_circuit_breaker_closed_state():
    """Test circuit breaker in closed state allows calls."""
    breaker = CircuitBreaker(name="test", failure_threshold=3)
    
    async def successful_func():
        return "success"
    
    result = await breaker.call(successful_func)
    assert result == "success"
    assert breaker.state == CircuitState.CLOSED
    assert breaker.failure_count == 0


@pytest.mark.asyncio
async def test_circuit_breaker_opens_after_failures():
    """Test circuit breaker opens after reaching failure threshold."""
    breaker = CircuitBreaker(name="test", failure_threshold=3, timeout_seconds=1)
    
    async def failing_func():
        raise Exception("Test failure")
    
    # Trigger failures
    for i in range(3):
        with pytest.raises(Exception):
            await breaker.call(failing_func)
    
    # Circuit should now be open
    assert breaker.state == CircuitState.OPEN
    assert breaker.failure_count == 3
    
    # Next call should fail fast with CircuitBreakerError
    with pytest.raises(CircuitBreakerError):
        await breaker.call(failing_func)


@pytest.mark.asyncio
async def test_circuit_breaker_half_open_recovery():
    """Test circuit breaker transitions to half-open and recovers."""
    breaker = CircuitBreaker(
        name="test",
        failure_threshold=2,
        timeout_seconds=1,
        success_threshold=2
    )
    
    async def failing_func():
        raise Exception("Test failure")
    
    async def successful_func():
        return "success"
    
    # Open the circuit
    for i in range(2):
        with pytest.raises(Exception):
            await breaker.call(failing_func)
    
    assert breaker.state == CircuitState.OPEN
    
    # Wait for timeout
    await asyncio.sleep(1.1)
    
    # Next call should enter half-open state
    result = await breaker.call(successful_func)
    assert result == "success"
    assert breaker.state == CircuitState.HALF_OPEN
    
    # Another success should close the circuit
    result = await breaker.call(successful_func)
    assert result == "success"
    assert breaker.state == CircuitState.CLOSED


@pytest.mark.asyncio
async def test_circuit_breaker_decorator():
    """Test circuit breaker decorator."""
    call_count = 0
    
    @with_circuit_breaker("test_decorator", failure_threshold=2, timeout_seconds=1)
    async def test_func(should_fail: bool = False):
        nonlocal call_count
        call_count += 1
        if should_fail:
            raise Exception("Test failure")
        return "success"
    
    # Successful calls
    result = await test_func(should_fail=False)
    assert result == "success"
    assert call_count == 1
    
    # Trigger failures to open circuit
    for i in range(2):
        with pytest.raises(Exception):
            await test_func(should_fail=True)
    
    # Circuit should be open, call should fail fast
    with pytest.raises(CircuitBreakerError):
        await test_func(should_fail=False)
    
    # Call count should not increase (circuit is open)
    assert call_count == 3  # 1 success + 2 failures


@pytest.mark.asyncio
async def test_circuit_breaker_statistics():
    """Test circuit breaker statistics tracking."""
    breaker = CircuitBreaker(name="test", failure_threshold=5)
    
    async def successful_func():
        return "success"
    
    async def failing_func():
        raise Exception("Test failure")
    
    # Execute some calls
    await breaker.call(successful_func)
    await breaker.call(successful_func)
    
    try:
        await breaker.call(failing_func)
    except Exception:
        pass
    
    # Check statistics
    state = breaker.get_state()
    assert state["total_calls"] == 3
    assert state["total_successes"] == 2
    assert state["total_failures"] == 1
    assert state["failure_rate"] == pytest.approx(1/3)


@pytest.mark.asyncio
async def test_circuit_breaker_manual_reset():
    """Test manual circuit breaker reset."""
    breaker = CircuitBreaker(name="test", failure_threshold=2)
    
    async def failing_func():
        raise Exception("Test failure")
    
    # Open the circuit
    for i in range(2):
        with pytest.raises(Exception):
            await breaker.call(failing_func)
    
    assert breaker.state == CircuitState.OPEN
    
    # Manually reset
    await breaker.reset()
    
    assert breaker.state == CircuitState.CLOSED
    assert breaker.failure_count == 0
