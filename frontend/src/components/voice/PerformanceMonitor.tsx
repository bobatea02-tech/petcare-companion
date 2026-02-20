/**
 * Performance Monitor Component
 * 
 * Displays real-time performance metrics for the voice assistant.
 * Helps identify bottlenecks and optimization opportunities.
 * 
 * Task: 41.3 - Optimize performance
 * Feature: jojo-voice-assistant-enhanced
 */

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Activity, Zap, Database, TrendingUp, AlertCircle } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { getPerformanceOptimizer, PerformanceMetrics } from '@/services/voice/performanceOptimizer';

interface PerformanceMonitorProps {
  /** Whether to show detailed metrics */
  showDetails?: boolean;
  /** Update interval in milliseconds */
  updateInterval?: number;
  /** Custom class name */
  className?: string;
}

/**
 * Performance Monitor Component
 * 
 * Displays:
 * - Average latency
 * - Current FPS
 * - Memory usage
 * - Cache hit rate
 * - Performance recommendations
 */
export const PerformanceMonitor: React.FC<PerformanceMonitorProps> = ({
  showDetails = false,
  updateInterval = 1000,
  className = ''
}) => {
  const [metrics, setMetrics] = useState<PerformanceMetrics | null>(null);
  const [recommendations, setRecommendations] = useState<string[]>([]);

  useEffect(() => {
    const optimizer = getPerformanceOptimizer();

    // Update metrics periodically
    const interval = setInterval(() => {
      const currentMetrics = optimizer.getMetrics();
      setMetrics(currentMetrics);
      setRecommendations(optimizer.getRecommendations());
    }, updateInterval);

    // Initial update
    setMetrics(optimizer.getMetrics());
    setRecommendations(optimizer.getRecommendations());

    return () => clearInterval(interval);
  }, [updateInterval]);

  if (!metrics) {
    return null;
  }

  const isOptimal = metrics.averageLatency < 2000 && 
                    metrics.currentFPS >= 55 && 
                    metrics.memoryUsage < 200;

  return (
    <Card className={`${className}`}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Activity className="w-5 h-5 text-primary" />
            <CardTitle>Performance Monitor</CardTitle>
          </div>
          <Badge variant={isOptimal ? 'default' : 'destructive'}>
            {isOptimal ? 'Optimal' : 'Needs Attention'}
          </Badge>
        </div>
        <CardDescription>
          Real-time voice assistant performance metrics
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Latency */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Zap className="w-4 h-4 text-blue-500" />
              <span className="text-sm font-medium">Average Latency</span>
            </div>
            <span className={`text-sm font-bold ${
              metrics.averageLatency < 2000 ? 'text-green-600' : 'text-red-600'
            }`}>
              {metrics.averageLatency}ms
            </span>
          </div>
          <Progress 
            value={(metrics.averageLatency / 2000) * 100} 
            className="h-2"
          />
          {showDetails && (
            <div className="text-xs text-muted-foreground space-y-1 ml-6">
              <div>Recognition: {metrics.recognitionLatency}ms</div>
              <div>Parsing: {metrics.parsingLatency}ms</div>
              <div>Execution: {metrics.executionLatency}ms</div>
              <div>TTS: {metrics.ttsLatency}ms</div>
            </div>
          )}
        </div>

        {/* FPS */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-green-500" />
              <span className="text-sm font-medium">Current FPS</span>
            </div>
            <span className={`text-sm font-bold ${
              metrics.currentFPS >= 55 ? 'text-green-600' : 'text-red-600'
            }`}>
              {metrics.currentFPS} fps
            </span>
          </div>
          <Progress 
            value={(metrics.currentFPS / 60) * 100} 
            className="h-2"
          />
        </div>

        {/* Memory Usage */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Database className="w-4 h-4 text-purple-500" />
              <span className="text-sm font-medium">Memory Usage</span>
            </div>
            <span className={`text-sm font-bold ${
              metrics.memoryUsage < 200 ? 'text-green-600' : 'text-red-600'
            }`}>
              {metrics.memoryUsage} MB
            </span>
          </div>
          <Progress 
            value={(metrics.memoryUsage / 200) * 100} 
            className="h-2"
          />
        </div>

        {/* Cache Hit Rate */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Database className="w-4 h-4 text-orange-500" />
              <span className="text-sm font-medium">Cache Hit Rate</span>
            </div>
            <span className={`text-sm font-bold ${
              metrics.cacheHitRate >= 0.5 ? 'text-green-600' : 'text-yellow-600'
            }`}>
              {Math.round(metrics.cacheHitRate * 100)}%
            </span>
          </div>
          <Progress 
            value={metrics.cacheHitRate * 100} 
            className="h-2"
          />
        </div>

        {/* Recommendations */}
        {recommendations.length > 0 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            className="mt-4 p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border border-yellow-200 dark:border-yellow-800"
          >
            <div className="flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-yellow-600 mt-0.5 flex-shrink-0" />
              <div className="space-y-1">
                <p className="text-sm font-medium text-yellow-900 dark:text-yellow-100">
                  Recommendations
                </p>
                <ul className="text-xs text-yellow-800 dark:text-yellow-200 space-y-1">
                  {recommendations.map((rec, i) => (
                    <li key={i}>• {rec}</li>
                  ))}
                </ul>
              </div>
            </div>
          </motion.div>
        )}
      </CardContent>
    </Card>
  );
};

export default PerformanceMonitor;
