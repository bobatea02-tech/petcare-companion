"""
Error monitoring and logging system for PawPal application.

This module provides comprehensive error tracking, monitoring, and alerting
capabilities for production environments.
"""

import logging
import traceback
from datetime import datetime, timezone
from typing import Optional, Dict, Any, List
from enum import Enum
import json
from collections import defaultdict, deque
import asyncio

logger = logging.getLogger(__name__)


class ErrorSeverity(Enum):
    """Error severity levels."""
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    CRITICAL = "critical"


class ErrorCategory(Enum):
    """Error categories for classification."""
    API_ERROR = "api_error"
    DATABASE_ERROR = "database_error"
    AUTHENTICATION_ERROR = "authentication_error"
    VALIDATION_ERROR = "validation_error"
    EXTERNAL_SERVICE_ERROR = "external_service_error"
    INTERNAL_ERROR = "internal_error"
    CONFIGURATION_ERROR = "configuration_error"


class ErrorEvent:
    """Represents a single error event."""
    
    def __init__(
        self,
        error: Exception,
        category: ErrorCategory,
        severity: ErrorSeverity,
        context: Optional[Dict[str, Any]] = None,
        user_id: Optional[str] = None,
        request_id: Optional[str] = None
    ):
        """
        Initialize error event.
        
        Args:
            error: The exception that occurred
            category: Error category
            severity: Error severity level
            context: Additional context information
            user_id: User ID if applicable
            request_id: Request ID for tracing
        """
        self.error = error
        self.error_type = type(error).__name__
        self.error_message = str(error)
        self.category = category
        self.severity = severity
        self.context = context or {}
        self.user_id = user_id
        self.request_id = request_id
        self.timestamp = datetime.now(timezone.utc)
        self.traceback = traceback.format_exc()
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert error event to dictionary."""
        return {
            "error_type": self.error_type,
            "error_message": self.error_message,
            "category": self.category.value,
            "severity": self.severity.value,
            "context": self.context,
            "user_id": self.user_id,
            "request_id": self.request_id,
            "timestamp": self.timestamp.isoformat(),
            "traceback": self.traceback
        }
    
    def to_json(self) -> str:
        """Convert error event to JSON string."""
        return json.dumps(self.to_dict(), indent=2)


class ErrorMonitor:
    """
    Error monitoring system for tracking and analyzing errors.
    
    Provides error tracking, statistics, and alerting capabilities.
    """
    
    def __init__(self, max_recent_errors: int = 100):
        """
        Initialize error monitor.
        
        Args:
            max_recent_errors: Maximum number of recent errors to keep in memory
        """
        self.max_recent_errors = max_recent_errors
        self.recent_errors: deque = deque(maxlen=max_recent_errors)
        self.error_counts: Dict[str, int] = defaultdict(int)
        self.error_counts_by_category: Dict[ErrorCategory, int] = defaultdict(int)
        self.error_counts_by_severity: Dict[ErrorSeverity, int] = defaultdict(int)
        self.total_errors = 0
        self._lock = asyncio.Lock()
    
    async def log_error(
        self,
        error: Exception,
        category: ErrorCategory,
        severity: ErrorSeverity,
        context: Optional[Dict[str, Any]] = None,
        user_id: Optional[str] = None,
        request_id: Optional[str] = None
    ) -> ErrorEvent:
        """
        Log an error event.
        
        Args:
            error: The exception that occurred
            category: Error category
            severity: Error severity level
            context: Additional context information
            user_id: User ID if applicable
            request_id: Request ID for tracing
            
        Returns:
            ErrorEvent object
        """
        async with self._lock:
            # Create error event
            event = ErrorEvent(
                error=error,
                category=category,
                severity=severity,
                context=context,
                user_id=user_id,
                request_id=request_id
            )
            
            # Update statistics
            self.recent_errors.append(event)
            self.error_counts[event.error_type] += 1
            self.error_counts_by_category[category] += 1
            self.error_counts_by_severity[severity] += 1
            self.total_errors += 1
            
            # Log based on severity
            log_message = (
                f"[{category.value.upper()}] {event.error_type}: {event.error_message}"
            )
            
            if context:
                log_message += f" | Context: {json.dumps(context)}"
            
            if severity == ErrorSeverity.CRITICAL:
                logger.critical(log_message, exc_info=error)
            elif severity == ErrorSeverity.HIGH:
                logger.error(log_message, exc_info=error)
            elif severity == ErrorSeverity.MEDIUM:
                logger.warning(log_message)
            else:
                logger.info(log_message)
            
            return event
    
    def get_recent_errors(self, limit: Optional[int] = None) -> List[ErrorEvent]:
        """
        Get recent error events.
        
        Args:
            limit: Maximum number of errors to return
            
        Returns:
            List of recent ErrorEvent objects
        """
        if limit:
            return list(self.recent_errors)[-limit:]
        return list(self.recent_errors)
    
    def get_statistics(self) -> Dict[str, Any]:
        """
        Get error statistics.
        
        Returns:
            Dictionary with error statistics
        """
        return {
            "total_errors": self.total_errors,
            "recent_errors_count": len(self.recent_errors),
            "error_counts_by_type": dict(self.error_counts),
            "error_counts_by_category": {
                cat.value: count for cat, count in self.error_counts_by_category.items()
            },
            "error_counts_by_severity": {
                sev.value: count for sev, count in self.error_counts_by_severity.items()
            },
            "most_common_errors": self._get_most_common_errors(5)
        }
    
    def _get_most_common_errors(self, limit: int = 5) -> List[Dict[str, Any]]:
        """Get most common error types."""
        sorted_errors = sorted(
            self.error_counts.items(),
            key=lambda x: x[1],
            reverse=True
        )
        return [
            {"error_type": error_type, "count": count}
            for error_type, count in sorted_errors[:limit]
        ]
    
    async def clear_statistics(self):
        """Clear all error statistics and recent errors."""
        async with self._lock:
            self.recent_errors.clear()
            self.error_counts.clear()
            self.error_counts_by_category.clear()
            self.error_counts_by_severity.clear()
            self.total_errors = 0
            logger.info("Error statistics cleared")


# Global error monitor instance
error_monitor = ErrorMonitor()


async def log_error(
    error: Exception,
    category: ErrorCategory,
    severity: ErrorSeverity = ErrorSeverity.MEDIUM,
    context: Optional[Dict[str, Any]] = None,
    user_id: Optional[str] = None,
    request_id: Optional[str] = None
) -> ErrorEvent:
    """
    Convenience function to log errors to the global error monitor.
    
    Args:
        error: The exception that occurred
        category: Error category
        severity: Error severity level
        context: Additional context information
        user_id: User ID if applicable
        request_id: Request ID for tracing
        
    Returns:
        ErrorEvent object
    """
    return await error_monitor.log_error(
        error=error,
        category=category,
        severity=severity,
        context=context,
        user_id=user_id,
        request_id=request_id
    )


def get_error_statistics() -> Dict[str, Any]:
    """Get error statistics from global monitor."""
    return error_monitor.get_statistics()


def get_recent_errors(limit: Optional[int] = None) -> List[ErrorEvent]:
    """Get recent errors from global monitor."""
    return error_monitor.get_recent_errors(limit)
