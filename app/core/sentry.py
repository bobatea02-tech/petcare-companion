"""
Sentry error tracking integration for production monitoring.
"""

import sentry_sdk
from sentry_sdk.integrations.fastapi import FastApiIntegration
from sentry_sdk.integrations.sqlalchemy import SqlalchemyIntegration
from sentry_sdk.integrations.redis import RedisIntegration
from sentry_sdk.integrations.logging import LoggingIntegration
import logging

from app.core.config import settings


def init_sentry():
    """
    Initialize Sentry error tracking.
    Should be called during application startup.
    """
    if not settings.SENTRY_DSN:
        logging.info("Sentry DSN not configured, skipping error tracking initialization")
        return
    
    sentry_sdk.init(
        dsn=settings.SENTRY_DSN,
        environment=settings.SENTRY_ENVIRONMENT,
        traces_sample_rate=settings.SENTRY_TRACES_SAMPLE_RATE,
        
        # Integrations
        integrations=[
            FastApiIntegration(transaction_style="endpoint"),
            SqlalchemyIntegration(),
            RedisIntegration(),
            LoggingIntegration(
                level=logging.INFO,  # Capture info and above as breadcrumbs
                event_level=logging.ERROR  # Send errors as events
            ),
        ],
        
        # Performance monitoring
        enable_tracing=True,
        
        # Release tracking
        release=f"pawpal@0.1.0",
        
        # Additional options
        attach_stacktrace=True,
        send_default_pii=False,  # Don't send PII by default
        
        # Filter sensitive data
        before_send=filter_sensitive_data,
    )
    
    logging.info(f"Sentry initialized for environment: {settings.SENTRY_ENVIRONMENT}")


def filter_sensitive_data(event, hint):
    """
    Filter sensitive data from Sentry events before sending.
    Removes passwords, API keys, and other sensitive information.
    """
    # Remove sensitive headers
    if "request" in event and "headers" in event["request"]:
        sensitive_headers = ["authorization", "cookie", "x-api-key"]
        for header in sensitive_headers:
            if header in event["request"]["headers"]:
                event["request"]["headers"][header] = "[Filtered]"
    
    # Remove sensitive query parameters
    if "request" in event and "query_string" in event["request"]:
        sensitive_params = ["password", "token", "api_key", "secret"]
        query_string = event["request"]["query_string"]
        for param in sensitive_params:
            if param in query_string.lower():
                event["request"]["query_string"] = "[Filtered]"
    
    # Remove sensitive form data
    if "request" in event and "data" in event["request"]:
        if isinstance(event["request"]["data"], dict):
            sensitive_fields = ["password", "token", "api_key", "secret", "credit_card"]
            for field in sensitive_fields:
                if field in event["request"]["data"]:
                    event["request"]["data"][field] = "[Filtered]"
    
    return event


def capture_exception(exception: Exception, context: dict = None):
    """
    Manually capture an exception with optional context.
    
    Args:
        exception: The exception to capture
        context: Additional context to include with the error
    """
    if context:
        with sentry_sdk.push_scope() as scope:
            for key, value in context.items():
                scope.set_context(key, value)
            sentry_sdk.capture_exception(exception)
    else:
        sentry_sdk.capture_exception(exception)


def capture_message(message: str, level: str = "info", context: dict = None):
    """
    Manually capture a message with optional context.
    
    Args:
        message: The message to capture
        level: Severity level (debug, info, warning, error, fatal)
        context: Additional context to include with the message
    """
    if context:
        with sentry_sdk.push_scope() as scope:
            for key, value in context.items():
                scope.set_context(key, value)
            sentry_sdk.capture_message(message, level=level)
    else:
        sentry_sdk.capture_message(message, level=level)


def set_user_context(user_id: str, email: str = None, username: str = None):
    """
    Set user context for error tracking.
    
    Args:
        user_id: User ID
        email: User email (optional)
        username: Username (optional)
    """
    sentry_sdk.set_user({
        "id": user_id,
        "email": email,
        "username": username
    })


def clear_user_context():
    """Clear user context (e.g., on logout)."""
    sentry_sdk.set_user(None)
