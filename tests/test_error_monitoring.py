"""
Tests for error monitoring functionality.
"""

import pytest
from app.core.error_monitoring import (
    ErrorMonitor,
    ErrorCategory,
    ErrorSeverity,
    ErrorEvent,
    log_error
)


@pytest.mark.asyncio
async def test_error_monitor_log_error():
    """Test logging errors to error monitor."""
    monitor = ErrorMonitor(max_recent_errors=10)
    
    error = ValueError("Test error")
    event = await monitor.log_error(
        error=error,
        category=ErrorCategory.VALIDATION_ERROR,
        severity=ErrorSeverity.MEDIUM,
        context={"field": "test_field"}
    )
    
    assert event.error_type == "ValueError"
    assert event.error_message == "Test error"
    assert event.category == ErrorCategory.VALIDATION_ERROR
    assert event.severity == ErrorSeverity.MEDIUM
    assert event.context["field"] == "test_field"
    assert monitor.total_errors == 1


@pytest.mark.asyncio
async def test_error_monitor_statistics():
    """Test error statistics tracking."""
    monitor = ErrorMonitor(max_recent_errors=10)
    
    # Log various errors
    await monitor.log_error(
        ValueError("Error 1"),
        ErrorCategory.VALIDATION_ERROR,
        ErrorSeverity.LOW
    )
    await monitor.log_error(
        ValueError("Error 2"),
        ErrorCategory.VALIDATION_ERROR,
        ErrorSeverity.MEDIUM
    )
    await monitor.log_error(
        RuntimeError("Error 3"),
        ErrorCategory.INTERNAL_ERROR,
        ErrorSeverity.HIGH
    )
    
    stats = monitor.get_statistics()
    
    assert stats["total_errors"] == 3
    assert stats["error_counts_by_type"]["ValueError"] == 2
    assert stats["error_counts_by_type"]["RuntimeError"] == 1
    assert stats["error_counts_by_category"]["validation_error"] == 2
    assert stats["error_counts_by_category"]["internal_error"] == 1
    assert stats["error_counts_by_severity"]["low"] == 1
    assert stats["error_counts_by_severity"]["medium"] == 1
    assert stats["error_counts_by_severity"]["high"] == 1


@pytest.mark.asyncio
async def test_error_monitor_recent_errors():
    """Test retrieving recent errors."""
    monitor = ErrorMonitor(max_recent_errors=5)
    
    # Log more errors than max
    for i in range(10):
        await monitor.log_error(
            ValueError(f"Error {i}"),
            ErrorCategory.VALIDATION_ERROR,
            ErrorSeverity.LOW
        )
    
    # Should only keep last 5
    recent = monitor.get_recent_errors()
    assert len(recent) == 5
    
    # Check they are the most recent ones
    assert recent[-1].error_message == "Error 9"
    assert recent[0].error_message == "Error 5"


@pytest.mark.asyncio
async def test_error_monitor_clear_statistics():
    """Test clearing error statistics."""
    monitor = ErrorMonitor(max_recent_errors=10)
    
    # Log some errors
    await monitor.log_error(
        ValueError("Error 1"),
        ErrorCategory.VALIDATION_ERROR,
        ErrorSeverity.LOW
    )
    await monitor.log_error(
        RuntimeError("Error 2"),
        ErrorCategory.INTERNAL_ERROR,
        ErrorSeverity.HIGH
    )
    
    assert monitor.total_errors == 2
    
    # Clear statistics
    await monitor.clear_statistics()
    
    assert monitor.total_errors == 0
    assert len(monitor.get_recent_errors()) == 0
    assert monitor.get_statistics()["total_errors"] == 0


@pytest.mark.asyncio
async def test_error_event_to_dict():
    """Test error event serialization."""
    error = ValueError("Test error")
    event = ErrorEvent(
        error=error,
        category=ErrorCategory.VALIDATION_ERROR,
        severity=ErrorSeverity.MEDIUM,
        context={"field": "test"},
        user_id="user123",
        request_id="req456"
    )
    
    event_dict = event.to_dict()
    
    assert event_dict["error_type"] == "ValueError"
    assert event_dict["error_message"] == "Test error"
    assert event_dict["category"] == "validation_error"
    assert event_dict["severity"] == "medium"
    assert event_dict["context"]["field"] == "test"
    assert event_dict["user_id"] == "user123"
    assert event_dict["request_id"] == "req456"
    assert "timestamp" in event_dict
    assert "traceback" in event_dict


@pytest.mark.asyncio
async def test_global_log_error_function():
    """Test global log_error convenience function."""
    error = ValueError("Test error")
    event = await log_error(
        error=error,
        category=ErrorCategory.API_ERROR,
        severity=ErrorSeverity.HIGH,
        context={"endpoint": "/test"}
    )
    
    assert event.error_type == "ValueError"
    assert event.category == ErrorCategory.API_ERROR
    assert event.severity == ErrorSeverity.HIGH
