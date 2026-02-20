# Usage Tracker Service

## Overview

The Usage Tracker service monitors and tracks JoJo Voice Assistant's usage statistics, including ElevenLabs API character usage, cache performance, error rates, and response times. This service is essential for staying within the ElevenLabs free tier limit (10,000 characters/month) and monitoring system health.

**Feature:** jojo-voice-assistant-enhanced  
**Requirement:** 15.6

## Features

### 1. Character Usage Tracking
- Tracks total characters sent to ElevenLabs API
- Monitors usage against 10,000 character/month free tier limit
- Calculates usage percentage
- Provides quota warnings at 80% and 100%

### 2. Cache Performance Monitoring
- Tracks cache hits and misses
- Calculates cache hit rate percentage
- Helps measure cache effectiveness
- Identifies opportunities for optimization

### 3. Error Rate Monitoring
- Tracks all errors (API failures, network issues, etc.)
- Calculates error rate percentage
- Helps identify system health issues
- Enables proactive problem resolution

### 4. Response Time Tracking
- Tracks response times for all TTS operations
- Calculates rolling average (last 100 requests)
- Helps monitor performance degradation
- Ensures sub-2-second response time requirement

### 5. Historical Data
- Stores up to 12 months of historical data
- Enables trend analysis
- Supports capacity planning
- Automatic monthly archival

## Usage

### Basic Usage

```typescript
import { usageTracker } from '@/services/voice/usageTracker';

// Track character usage
usageTracker.trackCharacterUsage(150);

// Track API call
usageTracker.trackAPICall();

// Track cache hit
usageTracker.trackCacheHit();

// Track cache miss
usageTracker.trackCacheMiss();

// Track response time
usageTracker.trackResponseTime(1250); // milliseconds

// Track error
usageTracker.trackError();

// Get current statistics
const stats = usageTracker.getUsageStats();
console.log('Characters used:', stats.charactersUsed);
console.log('Cache hit rate:', usageTracker.getCacheHitRate());
```

### Admin Dashboard

The Usage Dashboard component provides a visual interface for viewing statistics:

```typescript
import { UsageDashboard } from '@/components/voice/UsageDashboard';

function AdminPage() {
  return <UsageDashboard />;
}
```

Access the admin dashboard at: `/voice-usage-admin`

## Data Model

### UsageTracking Interface

```typescript
interface UsageTracking {
  month: string;              // YYYY-MM format
  charactersUsed: number;     // Total characters sent to API
  apiCallCount: number;       // Number of API calls made
  cacheHits: number;          // Number of cache hits
  cacheMisses: number;        // Number of cache misses
  averageResponseTime: number; // Average response time in ms
  errorCount: number;         // Number of errors
  lastUpdated: Date;          // Last update timestamp
}
```

## Storage

### localStorage Keys

- `jojo_usage_tracking` - Current month's statistics
- `jojo_usage_tracking_history` - Historical data (last 12 months)

### Data Persistence

- Statistics are automatically saved to localStorage after each update
- Data persists across browser sessions
- Automatic monthly rollover and archival
- Historical data limited to 12 months

## Integration

### Automatic Tracking

The UsageTracker is automatically integrated with:

1. **ElevenLabsClient** - Tracks character usage, API calls, and response times
2. **ResponseCacheManager** - Tracks cache hits and misses
3. **ErrorRecoveryManager** - Tracks errors

No manual tracking is required for these services.

### Manual Tracking

For custom tracking scenarios:

```typescript
// Track custom operation
const startTime = performance.now();
try {
  await customOperation();
  const responseTime = performance.now() - startTime;
  usageTracker.trackResponseTime(responseTime);
} catch (error) {
  usageTracker.trackError();
}
```

## Metrics

### Key Performance Indicators

1. **Character Usage Percentage**
   - Formula: `(charactersUsed / 10000) * 100`
   - Target: < 80% (stay within quota)
   - Warning: ≥ 80%
   - Critical: ≥ 100%

2. **Cache Hit Rate**
   - Formula: `(cacheHits / (cacheHits + cacheMisses)) * 100`
   - Target: ≥ 70% (excellent)
   - Good: ≥ 50%
   - Needs Improvement: < 50%

3. **Error Rate**
   - Formula: `(errorCount / (apiCallCount + cacheHits)) * 100`
   - Target: < 1%
   - Warning: ≥ 5%
   - Critical: ≥ 10%

4. **Average Response Time**
   - Target: < 2000ms (2 seconds)
   - Warning: ≥ 2000ms
   - Critical: ≥ 3000ms

## Admin Dashboard Features

### Real-time Statistics
- Current month's character usage with progress bar
- API call count
- Cache hit rate with efficiency rating
- Average response time
- Error count and rate

### Visual Indicators
- Color-coded quota status (Good, Moderate, High, Exhausted)
- Progress bars for usage and cache efficiency
- Warning alerts for high usage
- Historical trend charts

### Historical View
- Last 6 months of usage data
- Month-by-month comparison
- Character usage trends
- API call patterns

## Quota Management

### Warning Thresholds

1. **80% Usage** (8,000 characters)
   - Display warning in dashboard
   - Recommend using cached responses
   - Consider shortening responses

2. **100% Usage** (10,000 characters)
   - Display critical alert
   - Block new API calls
   - Fall back to text-only mode

### Quota Conservation Strategies

When approaching quota limits:

1. Prioritize cached responses
2. Shorten new responses
3. Use text-only fallback
4. Queue non-urgent requests

## API Reference

### UsageTracker Methods

#### trackCharacterUsage(characterCount: number)
Tracks characters sent to ElevenLabs API.

#### trackAPICall()
Increments API call counter.

#### trackCacheHit()
Increments cache hit counter.

#### trackCacheMiss()
Increments cache miss counter.

#### trackResponseTime(milliseconds: number)
Records response time and updates rolling average.

#### trackError()
Increments error counter.

#### getUsageStats(): UsageTracking
Returns current month's statistics.

#### getUsageStatsForMonth(month: string): UsageTracking | null
Returns statistics for specific month (YYYY-MM format).

#### getAllUsageStats(): UsageTracking[]
Returns all historical statistics (last 12 months).

#### getCacheHitRate(): number
Returns cache hit rate percentage (0-100).

#### getCharacterUsagePercentage(): number
Returns character usage percentage (0-100).

#### getErrorRate(): number
Returns error rate percentage (0-100).

#### resetCurrentMonth(): void
Resets current month's statistics (use with caution).

#### clearAllData(): void
Clears all historical data (use with caution).

## Testing

### Unit Tests

```typescript
import { UsageTrackerService } from './usageTracker';

describe('UsageTracker', () => {
  let tracker: UsageTrackerService;

  beforeEach(() => {
    tracker = new UsageTrackerService();
    tracker.clearAllData();
  });

  test('tracks character usage', () => {
    tracker.trackCharacterUsage(100);
    const stats = tracker.getUsageStats();
    expect(stats.charactersUsed).toBe(100);
  });

  test('calculates cache hit rate', () => {
    tracker.trackCacheHit();
    tracker.trackCacheHit();
    tracker.trackCacheMiss();
    expect(tracker.getCacheHitRate()).toBeCloseTo(66.67, 1);
  });
});
```

## Troubleshooting

### Issue: Statistics not persisting
**Solution:** Check localStorage availability and quota. Clear old data if needed.

### Issue: Incorrect cache hit rate
**Solution:** Ensure both cache hits and misses are being tracked properly.

### Issue: Response time spikes
**Solution:** Check network conditions and ElevenLabs API status.

### Issue: High error rate
**Solution:** Review error logs, check API key validity, and network connectivity.

## Best Practices

1. **Monitor Regularly**
   - Check dashboard weekly
   - Review trends monthly
   - Set up alerts for critical thresholds

2. **Optimize Cache Usage**
   - Preload common responses
   - Monitor cache hit rate
   - Adjust cache size as needed

3. **Manage Quota Proactively**
   - Track usage daily
   - Implement conservation strategies at 80%
   - Plan for quota resets

4. **Error Handling**
   - Log all errors
   - Investigate patterns
   - Implement fallbacks

## Related Documentation

- [ElevenLabs Client](./elevenLabsClient.ts)
- [Response Cache Manager](./responseCacheManager.ts)
- [Error Recovery Manager](./errorRecoveryManager.ts)
- [Usage Dashboard Component](../../components/voice/UsageDashboard.tsx)

## Support

For issues or questions:
1. Check this documentation
2. Review error logs
3. Check ElevenLabs API status
4. Contact system administrator
