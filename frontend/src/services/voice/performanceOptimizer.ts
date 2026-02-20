/**
 * Performance Optimizer Service
 * 
 * Optimizes voice pipeline performance to minimize latency and ensure smooth 60fps animations.
 * Implements caching strategies, memory management, and performance monitoring.
 * 
 * Task: 41.3 - Optimize performance
 * Feature: jojo-voice-assistant-enhanced
 */

/**
 * Performance Metrics
 */
export interface PerformanceMetrics {
  /** Average latency from wake word to response (ms) */
  averageLatency: number;
  /** Voice recognition latency (ms) */
  recognitionLatency: number;
  /** Intent parsing latency (ms) */
  parsingLatency: number;
  /** Command execution latency (ms) */
  executionLatency: number;
  /** TTS generation latency (ms) */
  ttsLatency: number;
  /** Current FPS */
  currentFPS: number;
  /** Memory usage (MB) */
  memoryUsage: number;
  /** Cache hit rate (0-1) */
  cacheHitRate: number;
}

/**
 * Performance Optimizer
 * 
 * Monitors and optimizes voice assistant performance
 */
export class PerformanceOptimizer {
  private static instance: PerformanceOptimizer;
  private metrics: PerformanceMetrics = {
    averageLatency: 0,
    recognitionLatency: 0,
    parsingLatency: 0,
    executionLatency: 0,
    ttsLatency: 0,
    currentFPS: 60,
    memoryUsage: 0,
    cacheHitRate: 0
  };
  
  private latencyHistory: number[] = [];
  private fpsHistory: number[] = [];
  private lastFrameTime: number = performance.now();
  private frameCount: number = 0;
  private fpsInterval: number | null = null;

  private constructor() {
    this.startFPSMonitoring();
    this.startMemoryMonitoring();
  }

  /**
   * Get singleton instance
   */
  static getInstance(): PerformanceOptimizer {
    if (!PerformanceOptimizer.instance) {
      PerformanceOptimizer.instance = new PerformanceOptimizer();
    }
    return PerformanceOptimizer.instance;
  }

  /**
   * Start FPS monitoring
   */
  private startFPSMonitoring(): void {
    const measureFPS = () => {
      const now = performance.now();
      const delta = now - this.lastFrameTime;
      this.lastFrameTime = now;
      
      const fps = 1000 / delta;
      this.fpsHistory.push(fps);
      
      // Keep only last 60 frames
      if (this.fpsHistory.length > 60) {
        this.fpsHistory.shift();
      }
      
      // Calculate average FPS
      this.metrics.currentFPS = Math.round(
        this.fpsHistory.reduce((a, b) => a + b, 0) / this.fpsHistory.length
      );
      
      requestAnimationFrame(measureFPS);
    };
    
    requestAnimationFrame(measureFPS);
  }

  /**
   * Start memory monitoring
   */
  private startMemoryMonitoring(): void {
    this.fpsInterval = window.setInterval(() => {
      if ((performance as any).memory) {
        const memory = (performance as any).memory;
        this.metrics.memoryUsage = Math.round(
          memory.usedJSHeapSize / 1024 / 1024
        );
      }
    }, 1000);
  }

  /**
   * Record latency for a specific stage
   * @param stage - Pipeline stage
   * @param latency - Latency in milliseconds
   */
  recordLatency(stage: keyof PerformanceMetrics, latency: number): void {
    if (stage in this.metrics) {
      (this.metrics as any)[stage] = latency;
    }
    
    // Update average latency
    this.latencyHistory.push(latency);
    if (this.latencyHistory.length > 100) {
      this.latencyHistory.shift();
    }
    
    this.metrics.averageLatency = Math.round(
      this.latencyHistory.reduce((a, b) => a + b, 0) / this.latencyHistory.length
    );
  }

  /**
   * Update cache hit rate
   * @param hitRate - Cache hit rate (0-1)
   */
  updateCacheHitRate(hitRate: number): void {
    this.metrics.cacheHitRate = hitRate;
  }

  /**
   * Get current performance metrics
   */
  getMetrics(): PerformanceMetrics {
    return { ...this.metrics };
  }

  /**
   * Check if performance is optimal
   */
  isPerformanceOptimal(): boolean {
    return (
      this.metrics.averageLatency < 2000 && // < 2s total latency
      this.metrics.currentFPS >= 55 && // >= 55 FPS (close to 60)
      this.metrics.memoryUsage < 200 // < 200MB memory
    );
  }

  /**
   * Get performance recommendations
   */
  getRecommendations(): string[] {
    const recommendations: string[] = [];

    if (this.metrics.averageLatency > 2000) {
      recommendations.push('High latency detected. Consider optimizing intent parsing or command execution.');
    }

    if (this.metrics.currentFPS < 55) {
      recommendations.push('Low FPS detected. Reduce animation complexity or optimize rendering.');
    }

    if (this.metrics.memoryUsage > 200) {
      recommendations.push('High memory usage. Clear old cache entries or reduce context window.');
    }

    if (this.metrics.cacheHitRate < 0.5) {
      recommendations.push('Low cache hit rate. Consider preloading common responses.');
    }

    return recommendations;
  }

  /**
   * Optimize TTS caching strategy
   * @param responses - Array of response texts
   * @param frequencies - Usage frequency for each response
   */
  optimizeTTSCache(responses: string[], frequencies: number[]): string[] {
    // Sort by frequency (descending)
    const sorted = responses
      .map((text, i) => ({ text, frequency: frequencies[i] }))
      .sort((a, b) => b.frequency - a.frequency);

    // Return top 20 most frequent responses for preloading
    return sorted.slice(0, 20).map(item => item.text);
  }

  /**
   * Reduce memory footprint by clearing old data
   */
  reduceMemoryFootprint(): void {
    // Clear old latency history
    if (this.latencyHistory.length > 50) {
      this.latencyHistory = this.latencyHistory.slice(-50);
    }

    // Clear old FPS history
    if (this.fpsHistory.length > 30) {
      this.fpsHistory = this.fpsHistory.slice(-30);
    }

    // Suggest garbage collection (if available)
    if ((window as any).gc) {
      (window as any).gc();
    }
  }

  /**
   * Cleanup resources
   */
  cleanup(): void {
    if (this.fpsInterval) {
      clearInterval(this.fpsInterval);
      this.fpsInterval = null;
    }
  }
}

/**
 * Performance measurement decorator
 * Wraps async functions to measure execution time
 */
export function measurePerformance(stage: keyof PerformanceMetrics) {
  return function (
    target: any,
    propertyKey: string,
    descriptor: PropertyDescriptor
  ) {
    const originalMethod = descriptor.value;

    descriptor.value = async function (...args: any[]) {
      const startTime = performance.now();
      
      try {
        const result = await originalMethod.apply(this, args);
        const endTime = performance.now();
        const latency = endTime - startTime;
        
        PerformanceOptimizer.getInstance().recordLatency(stage, latency);
        
        return result;
      } catch (error) {
        const endTime = performance.now();
        const latency = endTime - startTime;
        
        PerformanceOptimizer.getInstance().recordLatency(stage, latency);
        
        throw error;
      }
    };

    return descriptor;
  };
}

/**
 * Debounce function for performance optimization
 * @param func - Function to debounce
 * @param wait - Wait time in milliseconds
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null;

  return function executedFunction(...args: Parameters<T>) {
    const later = () => {
      timeout = null;
      func(...args);
    };

    if (timeout) {
      clearTimeout(timeout);
    }
    timeout = setTimeout(later, wait);
  };
}

/**
 * Throttle function for performance optimization
 * @param func - Function to throttle
 * @param limit - Time limit in milliseconds
 */
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle: boolean = false;

  return function executedFunction(...args: Parameters<T>) {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => {
        inThrottle = false;
      }, limit);
    }
  };
}

/**
 * Request idle callback wrapper for non-critical tasks
 * @param callback - Callback to execute during idle time
 */
export function runWhenIdle(callback: () => void): void {
  if ('requestIdleCallback' in window) {
    (window as any).requestIdleCallback(callback, { timeout: 2000 });
  } else {
    // Fallback for browsers without requestIdleCallback
    setTimeout(callback, 1);
  }
}

/**
 * Optimize animation frame rate
 * @param callback - Animation callback
 * @param targetFPS - Target FPS (default: 60)
 */
export function optimizedAnimationFrame(
  callback: () => void,
  targetFPS: number = 60
): number {
  const interval = 1000 / targetFPS;
  let lastTime = performance.now();

  const animate = () => {
    const now = performance.now();
    const delta = now - lastTime;

    if (delta >= interval) {
      lastTime = now - (delta % interval);
      callback();
    }

    return requestAnimationFrame(animate);
  };

  return animate();
}

/**
 * Get performance optimizer instance
 */
export const getPerformanceOptimizer = () => PerformanceOptimizer.getInstance();

export default PerformanceOptimizer;
