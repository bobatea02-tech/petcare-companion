/**
 * Usage Dashboard Component for JoJo Voice Assistant
 * Feature: jojo-voice-assistant-enhanced
 * Requirement: 15.6
 * 
 * Admin dashboard view for displaying usage statistics
 */

import React, { useEffect, useState } from 'react';
import { Card } from '@/components/ui/Card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/Button';
import { usageTracker } from '@/services/voice/usageTracker';
import { UsageTracking } from '@/services/voice/types';
import { 
  Activity, 
  TrendingUp, 
  Database, 
  AlertCircle,
  BarChart3,
  Clock,
  Zap
} from 'lucide-react';

export const UsageDashboard: React.FC = () => {
  const [stats, setStats] = useState<UsageTracking | null>(null);
  const [historicalStats, setHistoricalStats] = useState<UsageTracking[]>([]);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    loadStats();
  }, [refreshKey]);

  const loadStats = () => {
    const currentStats = usageTracker.getUsageStats();
    const history = usageTracker.getAllUsageStats();
    setStats(currentStats);
    setHistoricalStats(history);
  };

  const handleRefresh = () => {
    setRefreshKey(prev => prev + 1);
  };

  if (!stats) {
    return (
      <div className="flex items-center justify-center p-8">
        <p className="text-muted-foreground">Loading usage statistics...</p>
      </div>
    );
  }

  const characterUsagePercentage = usageTracker.getCharacterUsagePercentage();
  const cacheHitRate = usageTracker.getCacheHitRate();
  const errorRate = usageTracker.getErrorRate();
  const totalCacheRequests = stats.cacheHits + stats.cacheMisses;

  // Determine quota status
  const getQuotaStatus = () => {
    if (characterUsagePercentage >= 100) return { color: 'destructive', label: 'Exhausted' };
    if (characterUsagePercentage >= 80) return { color: 'warning', label: 'High' };
    if (characterUsagePercentage >= 50) return { color: 'default', label: 'Moderate' };
    return { color: 'success', label: 'Good' };
  };

  const quotaStatus = getQuotaStatus();

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">JoJo Usage Dashboard</h2>
          <p className="text-muted-foreground">
            Monitoring period: {stats.month}
          </p>
        </div>
        <Button onClick={handleRefresh} variant="outline" size="sm">
          <Activity className="w-4 h-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Character Usage Card */}
      <Card className="p-6">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-primary" />
              <h3 className="text-lg font-semibold">ElevenLabs Character Usage</h3>
            </div>
            <Badge variant={quotaStatus.color as any}>
              {quotaStatus.label}
            </Badge>
          </div>
          
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Characters Used</span>
              <span className="font-medium">
                {stats.charactersUsed.toLocaleString()} / 10,000
              </span>
            </div>
            <Progress value={characterUsagePercentage} className="h-2" />
            <p className="text-xs text-muted-foreground">
              {characterUsagePercentage.toFixed(1)}% of monthly quota used
            </p>
          </div>

          {characterUsagePercentage >= 80 && (
            <div className="flex items-start gap-2 p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
              <AlertCircle className="w-4 h-4 text-yellow-600 dark:text-yellow-400 mt-0.5" />
              <div className="text-sm">
                <p className="font-medium text-yellow-900 dark:text-yellow-100">
                  Quota Warning
                </p>
                <p className="text-yellow-700 dark:text-yellow-300">
                  You're approaching your monthly character limit. Consider using cached responses.
                </p>
              </div>
            </div>
          )}
        </div>
      </Card>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* API Calls */}
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 dark:bg-blue-900/20 rounded-lg">
              <Zap className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">API Calls</p>
              <p className="text-2xl font-bold">{stats.apiCallCount}</p>
            </div>
          </div>
        </Card>

        {/* Cache Hit Rate */}
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-100 dark:bg-green-900/20 rounded-lg">
              <Database className="w-5 h-5 text-green-600 dark:text-green-400" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Cache Hit Rate</p>
              <p className="text-2xl font-bold">{cacheHitRate.toFixed(1)}%</p>
            </div>
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            {stats.cacheHits} hits / {totalCacheRequests} requests
          </p>
        </Card>

        {/* Average Response Time */}
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-100 dark:bg-purple-900/20 rounded-lg">
              <Clock className="w-5 h-5 text-purple-600 dark:text-purple-400" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Avg Response</p>
              <p className="text-2xl font-bold">
                {stats.averageResponseTime.toFixed(0)}ms
              </p>
            </div>
          </div>
        </Card>

        {/* Error Rate */}
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-red-100 dark:bg-red-900/20 rounded-lg">
              <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Error Rate</p>
              <p className="text-2xl font-bold">{errorRate.toFixed(1)}%</p>
            </div>
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            {stats.errorCount} errors
          </p>
        </Card>
      </div>

      {/* Cache Performance Details */}
      <Card className="p-6">
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-primary" />
            <h3 className="text-lg font-semibold">Cache Performance</h3>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">Cache Hits</p>
              <p className="text-xl font-bold text-green-600 dark:text-green-400">
                {stats.cacheHits}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Cache Misses</p>
              <p className="text-xl font-bold text-orange-600 dark:text-orange-400">
                {stats.cacheMisses}
              </p>
            </div>
          </div>

          <div className="pt-4 border-t">
            <p className="text-sm text-muted-foreground mb-2">Cache Efficiency</p>
            <Progress value={cacheHitRate} className="h-2" />
            <p className="text-xs text-muted-foreground mt-1">
              {cacheHitRate >= 70 ? 'Excellent' : cacheHitRate >= 50 ? 'Good' : 'Needs Improvement'}
            </p>
          </div>
        </div>
      </Card>

      {/* Historical Data */}
      {historicalStats.length > 0 && (
        <Card className="p-6">
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Historical Usage</h3>
            
            <div className="space-y-2">
              {historicalStats.slice(-6).reverse().map((monthStats) => (
                <div 
                  key={monthStats.month}
                  className="flex items-center justify-between p-3 bg-muted/50 rounded-lg"
                >
                  <div>
                    <p className="font-medium">{monthStats.month}</p>
                    <p className="text-sm text-muted-foreground">
                      {monthStats.apiCallCount} API calls
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-medium">
                      {monthStats.charactersUsed.toLocaleString()} chars
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {((monthStats.charactersUsed / 10000) * 100).toFixed(1)}% quota
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </Card>
      )}

      {/* Last Updated */}
      <div className="text-center text-sm text-muted-foreground">
        Last updated: {stats.lastUpdated.toLocaleString()}
      </div>
    </div>
  );
};
