# Error Handling and Resilience System

## Overview

The PawPal application implements comprehensive error handling with circuit breaker patterns, graceful degradation, and error monitoring to ensure system reliability and resilience when external services fail.

## Components

### 1. Circuit Breaker Pattern (`app/core/circuit_breaker.py`)

Circuit breakers protect the application from cascading failures by monitoring external service calls and automatically opening when failure thresholds are reached.

**Features:**
- Automatic failure detection and circuit opening
- Half-open state for testing service recovery
- Configurable failure thresholds and timeout periods
- Statistics tracking for monitoring
- Decorator support for easy integration

**States:**
- **CLOSED**: Normal operation, all requests pass through
- **OPEN**: Circuit is open, requests fail fast without calling the service
- **HALF_OPEN**: Testing if service has recovered with limited requests

**Configuration:**
```python
@with_circuit_breaker(
    name="service_name",
    failure_threshold=5,      # Open after 5 consecutive failures
    timeout_seconds=60,       # Wait 60s before testing recovery
    half_open_max_calls=3,    # Allow 3 test calls in half-open state
    success_threshold=2       # Close after 2 successful calls
)
async def call_external_service():
    # Service call logic
    pass
```

**Integrated Services:**
- AI Service (OpenAI/Gemini)
- Google Maps API
- Twilio SMS
- SendGrid Email

### 2. Error Monitoring (`app/core/error_monitoring.py`)

Comprehensive error tracking and monitoring system that logs all errors with context, categorization, and severity levels.

**Features:**
- Error event tracking with full context
- Error statistics and analytics
- Categorization by error type and severity
- Recent error history
- Traceback capture for debugging

**Error Categories:**
- `API_ERROR`: API-related errors
- `DATABASE_ERROR`: Database operation errors
- `AUTHENTICATION_ERROR`: Authentication/authorization errors
- `VALIDATION_ERROR`: Input validation errors
- `EXTERNAL_SERVICE_ERROR`: External service failures
- `INTERNAL_ERROR`: Internal application errors
- `CONFIGURATION_ERROR`: Configuration issues

**Error Severity Levels:**
- `LOW`: Minor issues, informational
- `MEDIUM`: Moderate issues requiring attention
- `HIGH`: Serious issues affecting functionality
- `CRITICAL`: Critical failures requiring immediate action

**Usage:**
```python
from app.core.error_monitoring import log_error, ErrorCategory, ErrorSeverity

try:
    # Operation that might fail
    result = await external_service_call()
except Exception as e:
    await log_error(
        error=e,
        category=ErrorCategory.EXTERNAL_SERVICE_ERROR,
        severity=ErrorSeverity.HIGH,
        context={"service": "maps", "operation": "find_vets"},
        user_id=user_id,
        request_id=request_id
    )
```

### 3. Graceful Degradation (`app/core/graceful_degradation.py`)

Manages service degradation states and provides fallback mechanisms when services are unavailable.

**Service Modes:**
- `FULL`: All features available
- `DEGRADED`: Limited features available
- `MINIMAL`: Only critical features available
- `UNAVAILABLE`: Service unavailable

**Features:**
- Service status tracking
- Feature availability checking
- System health monitoring
- Fallback result tracking

**Usage:**
```python
from app.core.graceful_degradation import (
    set_service_degraded,
    set_service_unavailable,
    is_service_available,
    with_fallback
)

# Mark service as degraded
await set_service_degraded(
    "google_maps",
    unavailable_features=["real_time_search"],
    message="Using cached data"
)

# Use fallback pattern
result = await with_fallback(
    primary_func=call_primary_service,
    fallback_func=use_cached_data,
    fallback_reason="Primary service unavailable"
)
```

## Monitoring API Endpoints

### Health Check
```
GET /api/v1/monitoring/health
```
Basic health check endpoint.

### Detailed Health Check
```
GET /api/v1/monitoring/health/detailed
```
Comprehensive health status for all services.

### Circuit Breaker Status
```
GET /api/v1/monitoring/circuit-breakers
```
Get status of all circuit breakers (requires authentication).

### Reset Circuit Breaker
```
POST /api/v1/monitoring/circuit-breakers/{breaker_name}/reset
```
Manually reset a specific circuit breaker (requires authentication).

### Error Statistics
```
GET /api/v1/monitoring/errors/statistics
```
Get error statistics and analytics (requires authentication).

### Recent Errors
```
GET /api/v1/monitoring/errors/recent?limit=10
```
Get recent error events (requires authentication).

### System Health
```
GET /api/v1/monitoring/system/health
```
Get overall system health status.

## Fallback Strategies

### AI Service
- **Primary**: GPT-4 Turbo or Gemini Pro
- **Fallback**: GPT-3.5 Turbo or Gemini Flash
- **Degradation**: Service marked as degraded when using fallback model

### Google Maps
- **Primary**: Real-time Google Maps API search
- **Fallback**: Cached emergency vet locations
- **Degradation**: Returns cached data with degraded service status

### SMS Service (Twilio)
- **Primary**: Twilio SMS delivery
- **Fallback**: Push notifications and email alerts
- **Degradation**: Service marked as unavailable, alternative notification methods used

### Email Service (SendGrid)
- **Primary**: SendGrid email delivery
- **Fallback**: Queue for retry with exponential backoff
- **Degradation**: Emails queued for later delivery

## Best Practices

1. **Always use circuit breakers for external service calls**
   - Prevents cascading failures
   - Provides automatic recovery
   - Improves system resilience

2. **Log errors with appropriate context**
   - Include user_id and request_id for tracing
   - Use correct error category and severity
   - Provide meaningful context information

3. **Implement fallback mechanisms**
   - Always have a fallback strategy
   - Use cached data when appropriate
   - Degrade gracefully rather than failing completely

4. **Monitor circuit breaker states**
   - Check circuit breaker status regularly
   - Set up alerts for open circuits
   - Review error statistics to identify patterns

5. **Test error scenarios**
   - Test circuit breaker behavior
   - Verify fallback mechanisms work
   - Ensure graceful degradation functions correctly

## Testing

Run error handling tests:
```bash
pytest tests/test_circuit_breaker.py -v
pytest tests/test_error_monitoring.py -v
pytest tests/test_graceful_degradation.py -v
```

## Configuration

Circuit breaker and error handling settings can be configured in `app/core/config.py`:

```python
# Circuit Breaker Settings
CIRCUIT_BREAKER_FAILURE_THRESHOLD = 5
CIRCUIT_BREAKER_TIMEOUT_SECONDS = 60
CIRCUIT_BREAKER_HALF_OPEN_MAX_CALLS = 3
CIRCUIT_BREAKER_SUCCESS_THRESHOLD = 2

# Error Monitoring Settings
ERROR_MONITOR_MAX_RECENT_ERRORS = 100
ERROR_LOG_LEVEL = "INFO"
```

## Troubleshooting

### Circuit Breaker Stuck Open
If a circuit breaker remains open:
1. Check the service health
2. Review error logs for root cause
3. Manually reset via API: `POST /api/v1/monitoring/circuit-breakers/{name}/reset`

### High Error Rates
If error rates are high:
1. Check error statistics: `GET /api/v1/monitoring/errors/statistics`
2. Review recent errors: `GET /api/v1/monitoring/errors/recent`
3. Identify patterns in error categories and types
4. Address root causes in external services or configuration

### Service Degradation
If services are degraded:
1. Check system health: `GET /api/v1/monitoring/system/health`
2. Review service statuses
3. Verify external service availability
4. Check API keys and configuration
