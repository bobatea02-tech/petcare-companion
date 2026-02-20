/**
 * Optimized TTS Cache Service
 * 
 * Implements an intelligent caching strategy for TTS responses to minimize
 * API calls and reduce latency. Uses LRU eviction with frequency tracking.
 * 
 * Task: 41.3 - Optimize performance
 * Feature: jojo-voice-assistant-enhanced
 */

import { openDB, DBSchema, IDBPDatabase } from 'idb';
import { runWhenIdle } from './performanceOptimizer';

interface TTSCacheEntry {
  text: string;
  textHash: string;
  audioBlob: Blob;
  audioUrl: string;
  createdAt: number;
  lastAccessedAt: number;
  accessCount: number;
  characterCount: number;
}

interface TTSCacheDB extends DBSchema {
  'tts-cache': {
    key: string;
    value: TTSCacheEntry;
    indexes: {
      'by-access-count': number;
      'by-last-accessed': number;
    };
  };
  'cache-stats': {
    key: string;
    value: {
      totalHits: number;
      totalMisses: number;
      lastCleanup: number;
    };
  };
}

/**
 * Optimized TTS Cache Manager
 * 
 * Features:
 * - IndexedDB for persistent storage
 * - LRU eviction with frequency tracking
 * - Automatic cleanup during idle time
 * - Preloading of common responses
 * - Cache statistics tracking
 */
export class OptimizedTTSCache {
  private static instance: OptimizedTTSCache;
  private db: IDBPDatabase<TTSCacheDB> | null = null;
  private maxEntries: number = 100;
  private maxSizeMB: number = 50;
  private preloadedResponses: Set<string> = new Set();

  private constructor() {
    this.initialize();
  }

  /**
   * Get singleton instance
   */
  static getInstance(): OptimizedTTSCache {
    if (!OptimizedTTSCache.instance) {
      OptimizedTTSCache.instance = new OptimizedTTSCache();
    }
    return OptimizedTTSCache.instance;
  }

  /**
   * Initialize IndexedDB
   */
  private async initialize(): Promise<void> {
    try {
      this.db = await openDB<TTSCacheDB>('tts-cache-db', 1, {
        upgrade(db) {
          // Create cache store
          const cacheStore = db.createObjectStore('tts-cache', {
            keyPath: 'textHash'
          });
          cacheStore.createIndex('by-access-count', 'accessCount');
          cacheStore.createIndex('by-last-accessed', 'lastAccessedAt');

          // Create stats store
          db.createObjectStore('cache-stats', { keyPath: 'key' });
        }
      });

      // Schedule periodic cleanup
      this.scheduleCleanup();
    } catch (error) {
      console.error('Failed to initialize TTS cache:', error);
    }
  }

  /**
   * Generate hash for text
   */
  private async hashText(text: string): Promise<string> {
    const encoder = new TextEncoder();
    const data = encoder.encode(text.toLowerCase().trim());
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  }

  /**
   * Store audio in cache
   */
  async store(text: string, audioBlob: Blob): Promise<void> {
    if (!this.db) await this.initialize();
    if (!this.db) return;

    try {
      const textHash = await this.hashText(text);
      const audioUrl = URL.createObjectURL(audioBlob);

      const entry: TTSCacheEntry = {
        text,
        textHash,
        audioBlob,
        audioUrl,
        createdAt: Date.now(),
        lastAccessedAt: Date.now(),
        accessCount: 1,
        characterCount: text.length
      };

      await this.db.put('tts-cache', entry);

      // Check if we need to evict entries
      await this.evictIfNeeded();
    } catch (error) {
      console.error('Error storing in TTS cache:', error);
    }
  }

  /**
   * Retrieve audio from cache
   */
  async get(text: string): Promise<{ audioBlob: Blob; audioUrl: string } | null> {
    if (!this.db) await this.initialize();
    if (!this.db) return null;

    try {
      const textHash = await this.hashText(text);
      const entry = await this.db.get('tts-cache', textHash);

      if (!entry) {
        await this.recordMiss();
        return null;
      }

      // Update access statistics
      entry.lastAccessedAt = Date.now();
      entry.accessCount++;
      await this.db.put('tts-cache', entry);

      await this.recordHit();

      return {
        audioBlob: entry.audioBlob,
        audioUrl: entry.audioUrl
      };
    } catch (error) {
      console.error('Error retrieving from TTS cache:', error);
      return null;
    }
  }

  /**
   * Check if text is cached
   */
  async has(text: string): Promise<boolean> {
    if (!this.db) await this.initialize();
    if (!this.db) return false;

    try {
      const textHash = await this.hashText(text);
      const entry = await this.db.get('tts-cache', textHash);
      return !!entry;
    } catch (error) {
      return false;
    }
  }

  /**
   * Preload common responses
   */
  async preload(responses: string[]): Promise<void> {
    // Mark as preloaded to avoid duplicate preloading
    responses.forEach(text => this.preloadedResponses.add(text));

    // Preload during idle time to avoid blocking
    runWhenIdle(async () => {
      for (const text of responses) {
        const cached = await this.has(text);
        if (!cached) {
          // Generate placeholder entry (actual audio will be generated on first use)
          console.log(`Preload placeholder for: ${text}`);
        }
      }
    });
  }

  /**
   * Get cache statistics
   */
  async getStats(): Promise<{
    entryCount: number;
    totalSize: number;
    hitRate: number;
    mostUsed: Array<{ text: string; accessCount: number }>;
  }> {
    if (!this.db) await this.initialize();
    if (!this.db) {
      return {
        entryCount: 0,
        totalSize: 0,
        hitRate: 0,
        mostUsed: []
      };
    }

    try {
      const allEntries = await this.db.getAll('tts-cache');
      const stats = await this.db.get('cache-stats', 'global');

      const totalSize = allEntries.reduce(
        (sum, entry) => sum + entry.audioBlob.size,
        0
      );

      const hitRate = stats
        ? stats.totalHits / (stats.totalHits + stats.totalMisses)
        : 0;

      const mostUsed = allEntries
        .sort((a, b) => b.accessCount - a.accessCount)
        .slice(0, 10)
        .map(entry => ({
          text: entry.text,
          accessCount: entry.accessCount
        }));

      return {
        entryCount: allEntries.length,
        totalSize: Math.round(totalSize / 1024 / 1024), // MB
        hitRate,
        mostUsed
      };
    } catch (error) {
      console.error('Error getting cache stats:', error);
      return {
        entryCount: 0,
        totalSize: 0,
        hitRate: 0,
        mostUsed: []
      };
    }
  }

  /**
   * Evict entries if cache is full
   */
  private async evictIfNeeded(): Promise<void> {
    if (!this.db) return;

    try {
      const allEntries = await this.db.getAll('tts-cache');

      // Check entry count
      if (allEntries.length > this.maxEntries) {
        await this.evictLRU(allEntries.length - this.maxEntries);
      }

      // Check total size
      const totalSize = allEntries.reduce(
        (sum, entry) => sum + entry.audioBlob.size,
        0
      );
      const totalSizeMB = totalSize / 1024 / 1024;

      if (totalSizeMB > this.maxSizeMB) {
        // Evict 20% of entries
        const entriesToEvict = Math.ceil(allEntries.length * 0.2);
        await this.evictLRU(entriesToEvict);
      }
    } catch (error) {
      console.error('Error evicting cache entries:', error);
    }
  }

  /**
   * Evict least recently used entries
   */
  private async evictLRU(count: number): Promise<void> {
    if (!this.db) return;

    try {
      const allEntries = await this.db.getAll('tts-cache');

      // Sort by last accessed (ascending) and access count (ascending)
      const sorted = allEntries.sort((a, b) => {
        // Prioritize by last accessed
        const timeDiff = a.lastAccessedAt - b.lastAccessedAt;
        if (timeDiff !== 0) return timeDiff;
        
        // Then by access count
        return a.accessCount - b.accessCount;
      });

      // Evict the least used entries
      const toEvict = sorted.slice(0, count);
      
      for (const entry of toEvict) {
        // Revoke object URL to free memory
        URL.revokeObjectURL(entry.audioUrl);
        
        // Delete from database
        await this.db.delete('tts-cache', entry.textHash);
      }

      console.log(`Evicted ${toEvict.length} TTS cache entries`);
    } catch (error) {
      console.error('Error evicting LRU entries:', error);
    }
  }

  /**
   * Record cache hit
   */
  private async recordHit(): Promise<void> {
    if (!this.db) return;

    try {
      const stats = await this.db.get('cache-stats', 'global') || {
        key: 'global',
        totalHits: 0,
        totalMisses: 0,
        lastCleanup: Date.now()
      };

      stats.totalHits++;
      await this.db.put('cache-stats', stats);
    } catch (error) {
      console.error('Error recording cache hit:', error);
    }
  }

  /**
   * Record cache miss
   */
  private async recordMiss(): Promise<void> {
    if (!this.db) return;

    try {
      const stats = await this.db.get('cache-stats', 'global') || {
        key: 'global',
        totalHits: 0,
        totalMisses: 0,
        lastCleanup: Date.now()
      };

      stats.totalMisses++;
      await this.db.put('cache-stats', stats);
    } catch (error) {
      console.error('Error recording cache miss:', error);
    }
  }

  /**
   * Schedule periodic cleanup
   */
  private scheduleCleanup(): void {
    // Run cleanup every hour during idle time
    setInterval(() => {
      runWhenIdle(async () => {
        await this.cleanup();
      });
    }, 60 * 60 * 1000); // 1 hour
  }

  /**
   * Cleanup old entries
   */
  private async cleanup(): Promise<void> {
    if (!this.db) return;

    try {
      const allEntries = await this.db.getAll('tts-cache');
      const now = Date.now();
      const maxAge = 7 * 24 * 60 * 60 * 1000; // 7 days

      // Remove entries older than 7 days with low access count
      const toRemove = allEntries.filter(
        entry =>
          now - entry.createdAt > maxAge &&
          entry.accessCount < 3
      );

      for (const entry of toRemove) {
        URL.revokeObjectURL(entry.audioUrl);
        await this.db.delete('tts-cache', entry.textHash);
      }

      if (toRemove.length > 0) {
        console.log(`Cleaned up ${toRemove.length} old TTS cache entries`);
      }

      // Update last cleanup time
      const stats = await this.db.get('cache-stats', 'global');
      if (stats) {
        stats.lastCleanup = now;
        await this.db.put('cache-stats', stats);
      }
    } catch (error) {
      console.error('Error during cache cleanup:', error);
    }
  }

  /**
   * Clear all cache entries
   */
  async clear(): Promise<void> {
    if (!this.db) return;

    try {
      const allEntries = await this.db.getAll('tts-cache');
      
      // Revoke all object URLs
      for (const entry of allEntries) {
        URL.revokeObjectURL(entry.audioUrl);
      }

      // Clear the store
      await this.db.clear('tts-cache');
      
      console.log('TTS cache cleared');
    } catch (error) {
      console.error('Error clearing cache:', error);
    }
  }
}

/**
 * Get optimized TTS cache instance
 */
export const getOptimizedTTSCache = () => OptimizedTTSCache.getInstance();

export default OptimizedTTSCache;
