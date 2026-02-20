/**
 * Usage Tracker Service for JoJo Voice Assistant
 * Feature: jojo-voice-assistant-enhanced
 * Requirement: 15.6
 * 
 * Tracks ElevenLabs API usage, cache performance, and error rates
 * Provides admin dashboard view for usage statistics
 */

import { UsageTracking } from './types';

const STORAGE_KEY = 'jojo_usage_tracking';
const MONTHLY_CHARACTER_LIMIT = 10000; // ElevenLabs free tier

export interface UsageTracker {
  // Track character usage for ElevenLabs API
  trackCharacterUsage(characterCount: number): void;
  
  // Track API call
  trackAPICall(): void;
  
  // Track cache hit
  trackCacheHit(): void;
  
  // Track cache miss
  trackCacheMiss(): void;
  
  // Track response time
  trackResponseTime(milliseconds: number): void;
  
  // Track error
  trackError(): void;
  
  // Get current month's usage statistics
  getUsageStats(): UsageTracking;
  
  // Get usage stats for specific month
  getUsageStatsForMonth(month: string): UsageTracking | null;
  
  // Get all historical usage data
  getAllUsageStats(): UsageTracking[];
  
  // Reset current month's statistics
  resetCurrentMonth(): void;
  
  // Clear all historical data
  clearAllData(): void;
}

export class UsageTrackerService implements UsageTracker {
  private currentStats: UsageTracking;
  private responseTimes: number[] = [];

  constructor() {
    this.currentStats = this.loadCurrentMonthStats();
    this.checkAndResetIfNewMonth();
  }

  /**
   * Track character usage for ElevenLabs API
   */
  trackCharacterUsage(characterCount: number): void {
    this.currentStats.charactersUsed += characterCount;
    this.currentStats.lastUpdated = new Date();
    this.saveStats();
  }

  /**
   * Track API call
   */
  trackAPICall(): void {
    this.currentStats.apiCallCount++;
    this.currentStats.lastUpdated = new Date();
    this.saveStats();
  }

  /**
   * Track cache hit
   */
  trackCacheHit(): void {
    this.currentStats.cacheHits++;
    this.currentStats.lastUpdated = new Date();
    this.saveStats();
  }

  /**
   * Track cache miss
   */
  trackCacheMiss(): void {
    this.currentStats.cacheMisses++;
    this.currentStats.lastUpdated = new Date();
    this.saveStats();
  }

  /**
   * Track response time and update average
   */
  trackResponseTime(milliseconds: number): void {
    this.responseTimes.push(milliseconds);
    
    // Keep only last 100 response times for rolling average
    if (this.responseTimes.length > 100) {
      this.responseTimes.shift();
    }
    
    // Calculate average
    const sum = this.responseTimes.reduce((acc, time) => acc + time, 0);
    this.currentStats.averageResponseTime = sum / this.responseTimes.length;
    this.currentStats.lastUpdated = new Date();
    this.saveStats();
  }

  /**
   * Track error
   */
  trackError(): void {
    this.currentStats.errorCount++;
    this.currentStats.lastUpdated = new Date();
    this.saveStats();
  }

  /**
   * Get current month's usage statistics
   */
  getUsageStats(): UsageTracking {
    this.checkAndResetIfNewMonth();
    return { ...this.currentStats };
  }

  /**
   * Get usage stats for specific month (YYYY-MM format)
   */
  getUsageStatsForMonth(month: string): UsageTracking | null {
    try {
      const allStats = this.getAllUsageStats();
      return allStats.find(stats => stats.month === month) || null;
    } catch (error) {
      console.error('Error getting usage stats for month:', error);
      return null;
    }
  }

  /**
   * Get all historical usage data
   */
  getAllUsageStats(): UsageTracking[] {
    try {
      const stored = localStorage.getItem(`${STORAGE_KEY}_history`);
      if (stored) {
        const parsed = JSON.parse(stored);
        return parsed.map((stats: any) => ({
          ...stats,
          lastUpdated: new Date(stats.lastUpdated)
        }));
      }
    } catch (error) {
      console.error('Error loading historical usage stats:', error);
    }
    
    return [];
  }

  /**
   * Reset current month's statistics
   */
  resetCurrentMonth(): void {
    this.currentStats = this.createDefaultStats();
    this.responseTimes = [];
    this.saveStats();
  }

  /**
   * Clear all historical data
   */
  clearAllData(): void {
    try {
      localStorage.removeItem(STORAGE_KEY);
      localStorage.removeItem(`${STORAGE_KEY}_history`);
      this.currentStats = this.createDefaultStats();
      this.responseTimes = [];
    } catch (error) {
      console.error('Error clearing usage data:', error);
    }
  }

  /**
   * Get cache hit rate percentage
   */
  getCacheHitRate(): number {
    const totalCacheRequests = this.currentStats.cacheHits + this.currentStats.cacheMisses;
    if (totalCacheRequests === 0) return 0;
    return (this.currentStats.cacheHits / totalCacheRequests) * 100;
  }

  /**
   * Get character usage percentage
   */
  getCharacterUsagePercentage(): number {
    return (this.currentStats.charactersUsed / MONTHLY_CHARACTER_LIMIT) * 100;
  }

  /**
   * Get error rate percentage
   */
  getErrorRate(): number {
    const totalRequests = this.currentStats.apiCallCount + this.currentStats.cacheHits;
    if (totalRequests === 0) return 0;
    return (this.currentStats.errorCount / totalRequests) * 100;
  }

  /**
   * Check if we're in a new month and reset if needed
   */
  private checkAndResetIfNewMonth(): void {
    const currentMonth = this.getCurrentMonth();
    
    if (this.currentStats.month !== currentMonth) {
      // Archive current month's stats
      this.archiveCurrentStats();
      
      // Reset for new month
      this.currentStats = this.createDefaultStats();
      this.responseTimes = [];
      this.saveStats();
    }
  }

  /**
   * Archive current month's statistics to history
   */
  private archiveCurrentStats(): void {
    try {
      const history = this.getAllUsageStats();
      
      // Add current stats to history if it has data
      if (this.currentStats.apiCallCount > 0 || this.currentStats.charactersUsed > 0) {
        history.push({ ...this.currentStats });
      }
      
      // Keep only last 12 months
      const recentHistory = history.slice(-12);
      
      localStorage.setItem(`${STORAGE_KEY}_history`, JSON.stringify(recentHistory));
    } catch (error) {
      console.error('Error archiving usage stats:', error);
    }
  }

  /**
   * Load current month's statistics from localStorage
   */
  private loadCurrentMonthStats(): UsageTracking {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        return {
          ...parsed,
          lastUpdated: new Date(parsed.lastUpdated)
        };
      }
    } catch (error) {
      console.error('Error loading usage stats:', error);
    }
    
    return this.createDefaultStats();
  }

  /**
   * Save current statistics to localStorage
   */
  private saveStats(): void {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.currentStats));
    } catch (error) {
      console.error('Error saving usage stats:', error);
    }
  }

  /**
   * Create default statistics for current month
   */
  private createDefaultStats(): UsageTracking {
    return {
      month: this.getCurrentMonth(),
      charactersUsed: 0,
      apiCallCount: 0,
      cacheHits: 0,
      cacheMisses: 0,
      averageResponseTime: 0,
      errorCount: 0,
      lastUpdated: new Date()
    };
  }

  /**
   * Get current month string (YYYY-MM)
   */
  private getCurrentMonth(): string {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  }
}

// Export singleton instance
export const usageTracker = new UsageTrackerService();
