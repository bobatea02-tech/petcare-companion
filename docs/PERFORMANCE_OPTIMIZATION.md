# Performance Optimization Guide

This document describes the performance optimizations implemented in PawPal Voice Pet Care Assistant.

## Overview

The application implements comprehensive performance optimizations including:
- Database query optimization with proper indexing
- Connection pooling for efficient database access
- Multi-layer caching with Redis support
- Optimized query patterns and eager loading
- Cache invalidation strategies

## Database Optimizations

### Connection Pooling

The application uses SQLAlchemy's connection pooling for efficient database access:

**For PostgreSQL/MySQL:**
- Pool size: 20 connections
- Max overflow: 10 additional connections
- Pool timeout: 30 seconds
- Connection recycling: 1 hour
- Pre-ping enabled for connection health checks

**For SQLite:**
- Uses NullPool (SQLite doesn't support connection pooling with async)
- Connection timeout: 30 seconds

### Database Indexes

The following indexes have been added for frequently queried fields:

**Users Table:**
- `phone_number` - For SMS notification lookups
- `is_active` - For active user queries

**Pets Table:**
- `name` - For pet name searches
- `species` - For species filtering
- `is_active` - For active pet queries

**Medications Table:**
- `medication_name` - For medication searches
- `start_date` - For date range queries
- `end_date` - For active medication queries
- `active` - For active medication filtering
- Composite index: `(pet_id, active)` - For active medications per pet

**Medication Logs Table:**
- `administered_at` - For time-based queries
- `completed` - For completion status queries

**Health Records Table:**
- `record_date` - For date-based queries
- `record_type` - For type filtering
- Composite index: `(pet_id, record_date)` - For pet health history

**Appointments Table:**
- `appointment_date` - For date queries
- `appointment_type` - For type filtering
- `status` - For status filtering
- `reminder_sent_24h` - For reminder queries
- `reminder_sent_2h` - For reminder queries
- Composite index: `(pet_id, status)` - For pet appointments by status

**AI Assessments Table:**
- `triage_level` - For triage level filtering

### Query Optimization Utilities

The `app/database/optimization.py` module provides optimized query patterns:

**QueryOptimizer Class:**
- `get_user_with_pets()` - Eager loads user with pets
- `get_pet_with_medical_data()` - Eager loads pet with medical data
- `get_active_medications_with_logs()` - Optimized medication queries
- `get_upcoming_appointments()` - Efficient appointment lookups
- `get_medications_needing_refill()` - Refill alert queries
- `get_health_records_by_date_range()` - Date-filtered health records
- `get_pet_statistics()` - Aggregated pet statistics
- `get_appointments_needing_reminders()` - Reminder scheduling queries

**BulkOperations Class:**
- `bulk_create_medication_logs()` - Efficient bulk log creation
- `bulk_create_feeding_logs()` - Efficient bulk feeding logs
- `bulk_update_reminder_status()` - Batch reminder updates

## Caching Layer

### Cache Manager

The application uses a flexible caching system that supports both Redis and in-memory fallback:

**Features:**
- Automatic fallback to in-memory cache if Redis is unavailable
- Pickle-based serialization for complex objects
- TTL (Time To Live) support
- Pattern-based cache invalidation
- Batch operations (get_many, set_many)
- Counter operations (increment)

**Configuration:**
```python
# In .env file
REDIS_URL=redis://localhost:6379/0
REDIS_ENABLED=true
CACHE_DEFAULT_TTL=300
```

### Cache TTL Values

Standard TTL values for different data types:

- User Profile: 10 minutes (600s)
- Pet Profile: 10 minutes (600s)
- Medication: 5 minutes (300s)
- Health Record: 5 minutes (300s)
- Appointment: 5 minutes (300s)
- AI Assessment: 30 minutes (1800s)
- Static Data: 1 hour (3600s)
- Vet Clinic: 1 hour (3600s)
- Statistics: 3 minutes (180s)

### Cached Query Service

The `app/services/cached_queries.py` module provides cached versions of common queries:

**Available Methods:**
- `get_user_profile()` - Cached user profile
- `get_pet_profile()` - Cached pet profile
- `get_active_medications()` - Cached active medications
- `get_upcoming_appointments()` - Cached upcoming appointments
- `get_medications_needing_refill()` - Cached refill alerts
- `get_pet_statistics()` - Cached pet statistics
- `get_health_records_by_date_range()` - Cached health records

### Cache Decorator

Use the `@cached` decorator for automatic caching:

```python
from app.core.cache import cached, CacheTTL

@cached(prefix="user:profile", ttl=CacheTTL.USER_PROFILE)
async def get_user_profile(session: AsyncSession, user_id: str):
    # Function implementation
    return user_data
```

### Cache Invalidation

The `CacheInvalidator` class provides methods for cache invalidation:

```python
from app.core.cache import CacheInvalidator

# Invalidate user cache
await CacheInvalidator.invalidate_user_cache(user_id)

# Invalidate pet cache
await CacheInvalidator.invalidate_pet_cache(pet_id)

# Invalidate medication cache
await CacheInvalidator.invalidate_medication_cache(medication_id, pet_id)

# Invalidate appointment cache
await CacheInvalidator.invalidate_appointment_cache(appointment_id, pet_id, user_id)

# Invalidate health record cache
await CacheInvalidator.invalidate_health_record_cache(health_record_id, pet_id)
```

### Cache Warming

Pre-load frequently accessed data into cache:

```python
from app.services.cached_queries import CacheWarmer

# Warm user cache
await CacheWarmer.warm_user_cache(session, user_id)

# Warm pet cache
await CacheWarmer.warm_pet_cache(session, pet_id)
```

### API Response Caching

Cache API responses for static content:

```python
from app.services.cached_queries import ResponseCache

# Cache response
await ResponseCache.cache_response(
    endpoint="/api/v1/vet-clinics",
    params={"location": "Seattle"},
    response=clinic_data,
    ttl=CacheTTL.VET_CLINIC
)

# Get cached response
cached_data = await ResponseCache.get_cached_response(
    endpoint="/api/v1/vet-clinics",
    params={"location": "Seattle"}
)

# Invalidate endpoint cache
await ResponseCache.invalidate_endpoint_cache("/api/v1/vet-clinics")
```

## Performance Best Practices

### Database Queries

1. **Use Eager Loading:** Load related data in a single query using `selectinload()` or `joinedload()`
2. **Avoid N+1 Queries:** Use `contains_eager()` when joining tables
3. **Use Indexes:** Ensure frequently queried fields have indexes
4. **Limit Result Sets:** Use pagination for large result sets
5. **Use Aggregations:** Perform calculations in the database when possible

### Caching

1. **Cache Frequently Accessed Data:** User profiles, pet profiles, active medications
2. **Use Appropriate TTLs:** Balance freshness with performance
3. **Invalidate on Updates:** Clear cache when data changes
4. **Warm Critical Caches:** Pre-load data for logged-in users
5. **Monitor Cache Hit Rates:** Track cache effectiveness

### API Design

1. **Use Response Caching:** Cache static or slowly changing data
2. **Implement Pagination:** Limit response sizes
3. **Use Compression:** Enable gzip compression for responses
4. **Batch Operations:** Combine multiple operations when possible
5. **Async Operations:** Use async/await for I/O operations

## Monitoring and Metrics

### Key Metrics to Monitor

1. **Database:**
   - Query execution time
   - Connection pool utilization
   - Slow query log
   - Index usage statistics

2. **Cache:**
   - Cache hit rate
   - Cache miss rate
   - Memory usage
   - Eviction rate

3. **API:**
   - Response time
   - Request rate
   - Error rate
   - Throughput

### Performance Testing

Run performance tests to validate optimizations:

```bash
# Run all tests
python -m pytest tests/test_cache.py -v

# Run specific test
python -m pytest tests/test_cache.py::test_cache_basic_operations -v
```

## Migration

To apply the performance indexes:

```bash
# Run database migration
alembic upgrade head
```

## Redis Setup

### Local Development

Install and run Redis locally:

```bash
# Windows (using Chocolatey)
choco install redis-64

# Start Redis
redis-server

# Or using Docker
docker run -d -p 6379:6379 redis:latest
```

### Production

For production, use a managed Redis service:
- AWS ElastiCache
- Azure Cache for Redis
- Google Cloud Memorystore
- Redis Cloud

## Troubleshooting

### Cache Not Working

1. Check Redis connection:
   ```bash
   redis-cli ping
   ```

2. Verify Redis URL in `.env`:
   ```
   REDIS_URL=redis://localhost:6379/0
   ```

3. Check application logs for cache initialization messages

### Slow Queries

1. Enable query logging in config:
   ```python
   DEBUG=True  # Enables SQLAlchemy echo
   ```

2. Check for missing indexes:
   ```sql
   EXPLAIN ANALYZE SELECT ...
   ```

3. Review query patterns in `app/database/optimization.py`

### High Memory Usage

1. Reduce cache TTL values
2. Implement cache size limits
3. Use Redis maxmemory policy
4. Monitor cache eviction rates

## Future Optimizations

Potential future improvements:

1. **Query Result Caching:** Cache complex query results
2. **Read Replicas:** Distribute read load across replicas
3. **CDN Integration:** Cache static assets on CDN
4. **Database Sharding:** Partition data across multiple databases
5. **Materialized Views:** Pre-compute complex aggregations
6. **GraphQL DataLoader:** Batch and cache GraphQL queries
7. **HTTP/2 Server Push:** Push resources proactively
8. **Service Worker Caching:** Client-side caching for PWA
