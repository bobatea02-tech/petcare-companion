/**
 * IndexedDB Cache Manager for TTS Responses
 * Feature: jojo-voice-assistant-enhanced
 * Requirements: 3.4, 15.1, 15.2, 15.5
 */

import { ResponseCache, CacheStats, CacheEntry } from './types';

const DB_NAME = 'jojo_voice_cache';
const DB_VERSION = 1;
const STORE_NAME = 'tts_responses';
const MAX_CACHE_ENTRIES = 100;

export class ResponseCacheManager implements ResponseCache {
  private db: IDBDatabase | null = null;
  private cacheStats: CacheStats;
  private initPromise: Promise<void>;

  constructor() {
    this.cacheStats = {
      entryCount: 0,
      totalSize: 0,
      hitRate: 0,
      mostUsed: []
    };
    
    this.initPromise = this.initializeDB();
  }

  /**
   * Initialize IndexedDB
   */
  private async initializeDB(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onerror = () => {
        console.error('IndexedDB error:', request.error);
        reject(request.error);
      };

      request.onsuccess = () => {
        this.db = request.result;
        this.updateCacheStats();
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          const objectStore = db.createObjectStore(STORE_NAME, { keyPath: 'textHash' });
          objectStore.createIndex('lastAccessedAt', 'lastAccessedAt', { unique: false });
          objectStore.createIndex('accessCount', 'accessCount', { unique: false });
        }
      };
    });
  }

  /**
   * Store audio for text
   * Requirement 15.1: Cache frequently used responses
   */
  async store(text: string, audio: AudioBuffer): Promise<void> {
    await this.initPromise;
    
    if (!this.db) {
      throw new Error('Database not initialized');
    }

    // Check if we need to evict entries
    if (this.cacheStats.entryCount >= MAX_CACHE_ENTRIES) {
      await this.evictLRU(1);
    }

    const textHash = await this.hashText(text);
    const audioUrl = await this.audioBufferToBlob(audio);

    const entry: CacheEntry = {
      text,
      textHash,
      audioBuffer: audio,
      audioUrl,
      createdAt: new Date(),
      lastAccessedAt: new Date(),
      accessCount: 1,
      characterCount: text.length
    };

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([STORE_NAME], 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.put(entry);

      request.onsuccess = () => {
        this.updateCacheStats();
        resolve();
      };

      request.onerror = () => {
        console.error('Cache store error:', request.error);
        reject(request.error);
      };
    });
  }

  /**
   * Retrieve cached audio
   * Requirement 15.2: Retrieve from cache instead of API
   */
  async get(text: string): Promise<AudioBuffer | null> {
    await this.initPromise;
    
    if (!this.db) {
      return null;
    }

    const textHash = await this.hashText(text);

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([STORE_NAME], 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.get(textHash);

      request.onsuccess = () => {
        const entry = request.result as CacheEntry | undefined;
        
        if (entry) {
          // Update access stats
          entry.lastAccessedAt = new Date();
          entry.accessCount++;
          store.put(entry);
          
          this.updateCacheStats();
          resolve(entry.audioBuffer);
        } else {
          resolve(null);
        }
      };

      request.onerror = () => {
        console.error('Cache get error:', request.error);
        reject(request.error);
      };
    });
  }

  /**
   * Check if text is cached
   */
  has(text: string): boolean {
    // This is a synchronous check, so we'll use a simple in-memory check
    // For full accuracy, use get() which is async
    return false; // Simplified for now
  }

  /**
   * Get cache statistics
   */
  getStats(): CacheStats {
    return { ...this.cacheStats };
  }

  /**
   * Clear old/unused entries using LRU eviction
   * Requirement 15.5: Max 100 entries with LRU eviction
   */
  async evictLRU(count: number): Promise<void> {
    await this.initPromise;
    
    if (!this.db) {
      return;
    }

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([STORE_NAME], 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const index = store.index('lastAccessedAt');
      const request = index.openCursor();

      const toDelete: string[] = [];
      let deletedCount = 0;

      request.onsuccess = (event) => {
        const cursor = (event.target as IDBRequest).result;
        
        if (cursor && deletedCount < count) {
          toDelete.push(cursor.primaryKey as string);
          deletedCount++;
          cursor.continue();
        } else {
          // Delete collected entries
          toDelete.forEach(key => {
            store.delete(key);
          });
          
          this.updateCacheStats();
          resolve();
        }
      };

      request.onerror = () => {
        console.error('Cache eviction error:', request.error);
        reject(request.error);
      };
    });
  }

  /**
   * Preload common responses
   */
  async preload(responses: Array<{text: string, audio: AudioBuffer}>): Promise<void> {
    const promises = responses.map(({ text, audio }) => this.store(text, audio));
    await Promise.allSettled(promises);
  }

  /**
   * Update cache statistics
   */
  private async updateCacheStats(): Promise<void> {
    if (!this.db) {
      return;
    }

    return new Promise((resolve) => {
      const transaction = this.db!.transaction([STORE_NAME], 'readonly');
      const store = transaction.objectStore(STORE_NAME);
      const countRequest = store.count();

      countRequest.onsuccess = () => {
        this.cacheStats.entryCount = countRequest.result;
        
        // Get most used entries
        const index = store.index('accessCount');
        const cursorRequest = index.openCursor(null, 'prev');
        const mostUsed: Array<{text: string, hitCount: number}> = [];

        cursorRequest.onsuccess = (event) => {
          const cursor = (event.target as IDBRequest).result;
          
          if (cursor && mostUsed.length < 10) {
            const entry = cursor.value as CacheEntry;
            mostUsed.push({
              text: entry.text,
              hitCount: entry.accessCount
            });
            cursor.continue();
          } else {
            this.cacheStats.mostUsed = mostUsed;
            resolve();
          }
        };
      };
    });
  }

  /**
   * Hash text for cache key
   */
  private async hashText(text: string): Promise<string> {
    const encoder = new TextEncoder();
    const data = encoder.encode(text);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  }

  /**
   * Convert AudioBuffer to Blob URL
   */
  private async audioBufferToBlob(audioBuffer: AudioBuffer): Promise<string> {
    // Create offline context to render audio
    const offlineContext = new OfflineAudioContext(
      audioBuffer.numberOfChannels,
      audioBuffer.length,
      audioBuffer.sampleRate
    );

    const source = offlineContext.createBufferSource();
    source.buffer = audioBuffer;
    source.connect(offlineContext.destination);
    source.start();

    const renderedBuffer = await offlineContext.startRendering();
    
    // Convert to WAV blob
    const wav = this.audioBufferToWav(renderedBuffer);
    const blob = new Blob([wav], { type: 'audio/wav' });
    
    return URL.createObjectURL(blob);
  }

  /**
   * Convert AudioBuffer to WAV format
   */
  private audioBufferToWav(buffer: AudioBuffer): ArrayBuffer {
    const length = buffer.length * buffer.numberOfChannels * 2 + 44;
    const arrayBuffer = new ArrayBuffer(length);
    const view = new DataView(arrayBuffer);
    const channels: Float32Array[] = [];
    let offset = 0;
    let pos = 0;

    // Write WAV header
    const setUint16 = (data: number) => {
      view.setUint16(pos, data, true);
      pos += 2;
    };

    const setUint32 = (data: number) => {
      view.setUint32(pos, data, true);
      pos += 4;
    };

    // RIFF identifier
    setUint32(0x46464952);
    // File length
    setUint32(length - 8);
    // RIFF type
    setUint32(0x45564157);
    // Format chunk identifier
    setUint32(0x20746d66);
    // Format chunk length
    setUint32(16);
    // Sample format (raw)
    setUint16(1);
    // Channel count
    setUint16(buffer.numberOfChannels);
    // Sample rate
    setUint32(buffer.sampleRate);
    // Byte rate
    setUint32(buffer.sampleRate * 2 * buffer.numberOfChannels);
    // Block align
    setUint16(buffer.numberOfChannels * 2);
    // Bits per sample
    setUint16(16);
    // Data chunk identifier
    setUint32(0x61746164);
    // Data chunk length
    setUint32(length - pos - 4);

    // Write interleaved data
    for (let i = 0; i < buffer.numberOfChannels; i++) {
      channels.push(buffer.getChannelData(i));
    }

    while (pos < length) {
      for (let i = 0; i < buffer.numberOfChannels; i++) {
        let sample = Math.max(-1, Math.min(1, channels[i][offset]));
        sample = sample < 0 ? sample * 0x8000 : sample * 0x7FFF;
        view.setInt16(pos, sample, true);
        pos += 2;
      }
      offset++;
    }

    return arrayBuffer;
  }

  /**
   * Clear all cache entries
   */
  async clear(): Promise<void> {
    await this.initPromise;
    
    if (!this.db) {
      return;
    }

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([STORE_NAME], 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.clear();

      request.onsuccess = () => {
        this.updateCacheStats();
        resolve();
      };

      request.onerror = () => {
        console.error('Cache clear error:', request.error);
        reject(request.error);
      };
    });
  }
}

// Export singleton instance
export const responseCacheManager = new ResponseCacheManager();
