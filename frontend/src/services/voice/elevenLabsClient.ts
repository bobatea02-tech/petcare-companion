/**
 * ElevenLabs API Client with Quota Tracking
 * Feature: jojo-voice-assistant-enhanced
 * Requirements: 3.1, 3.6
 */

import { TTSEngine, TTSOptions, UsageStats } from './types';
import { usageTracker } from './usageTracker';

const ELEVENLABS_API_KEY = import.meta.env.VITE_ELEVENLABS_API_KEY || '';
const ELEVENLABS_API_URL = 'https://api.elevenlabs.io/v1';
const MONTHLY_CHARACTER_LIMIT = 10000; // Free tier limit

// Voice IDs for Rachel and Bella
const VOICE_IDS = {
  rachel: '21m00Tcm4TlvDq8ikWAM',
  bella: 'EXAVITQu4vr4xnSDxMaL'
};

export class ElevenLabsClient implements TTSEngine {
  private apiKey: string;
  private usageStats: UsageStats;
  private cache: Map<string, AudioBuffer>;

  constructor(apiKey?: string) {
    this.apiKey = apiKey || ELEVENLABS_API_KEY;
    this.cache = new Map();
    
    // Initialize usage stats from localStorage
    this.usageStats = this.loadUsageStats();
  }

  /**
   * Generate speech from text
   * Requirement 3.1: Use ElevenLabs API to generate natural speech
   */
  async synthesize(text: string, options?: TTSOptions): Promise<AudioBuffer> {
    const startTime = performance.now();
    const opts = this.getDefaultOptions(options);

    // Check cache first if enabled
    if (opts.useCache && this.isCached(text)) {
      const cached = this.cache.get(text);
      if (cached) {
        // Track cache hit
        usageTracker.trackCacheHit();
        const responseTime = performance.now() - startTime;
        usageTracker.trackResponseTime(responseTime);
        return cached;
      }
    }

    // Track cache miss
    if (opts.useCache) {
      usageTracker.trackCacheMiss();
    }

    // Check quota before making API call
    if (!this.canMakeAPICall(text.length)) {
      usageTracker.trackError();
      throw new Error('Monthly character quota exceeded');
    }

    try {
      const voiceId = VOICE_IDS[opts.voice as keyof typeof VOICE_IDS] || VOICE_IDS.rachel;
      
      const response = await fetch(
        `${ELEVENLABS_API_URL}/text-to-speech/${voiceId}`,
        {
          method: 'POST',
          headers: {
            'Accept': 'audio/mpeg',
            'Content-Type': 'application/json',
            'xi-api-key': this.apiKey
          },
          body: JSON.stringify({
            text,
            model_id: 'eleven_monolingual_v1',
            voice_settings: {
              stability: opts.stability,
              similarity_boost: opts.similarityBoost
            }
          })
        }
      );

      if (!response.ok) {
        usageTracker.trackError();
        throw new Error(`ElevenLabs API error: ${response.status} ${response.statusText}`);
      }

      const arrayBuffer = await response.arrayBuffer();
      const audioContext = new AudioContext();
      const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);

      // Update usage stats
      this.updateUsageStats(text.length);
      
      // Track API call and character usage
      usageTracker.trackAPICall();
      usageTracker.trackCharacterUsage(text.length);
      
      // Track response time
      const responseTime = performance.now() - startTime;
      usageTracker.trackResponseTime(responseTime);

      // Cache the result if enabled
      if (opts.useCache) {
        this.cache.set(text, audioBuffer);
      }

      return audioBuffer;
    } catch (error) {
      usageTracker.trackError();
      console.error('ElevenLabs synthesis error:', error);
      throw error;
    }
  }

  /**
   * Stream speech for immediate playback
   * Requirement 3.3: Stream audio within 2 seconds
   */
  async synthesizeStream(text: string, options?: TTSOptions): Promise<ReadableStream> {
    const startTime = performance.now();
    const opts = this.getDefaultOptions(options);

    // Check quota before making API call
    if (!this.canMakeAPICall(text.length)) {
      usageTracker.trackError();
      throw new Error('Monthly character quota exceeded');
    }

    try {
      const voiceId = VOICE_IDS[opts.voice as keyof typeof VOICE_IDS] || VOICE_IDS.rachel;
      
      const response = await fetch(
        `${ELEVENLABS_API_URL}/text-to-speech/${voiceId}/stream`,
        {
          method: 'POST',
          headers: {
            'Accept': 'audio/mpeg',
            'Content-Type': 'application/json',
            'xi-api-key': this.apiKey
          },
          body: JSON.stringify({
            text,
            model_id: 'eleven_monolingual_v1',
            voice_settings: {
              stability: opts.stability,
              similarity_boost: opts.similarityBoost
            }
          })
        }
      );

      if (!response.ok) {
        usageTracker.trackError();
        throw new Error(`ElevenLabs API error: ${response.status} ${response.statusText}`);
      }

      // Update usage stats
      this.updateUsageStats(text.length);
      
      // Track API call and character usage
      usageTracker.trackAPICall();
      usageTracker.trackCharacterUsage(text.length);
      
      // Track response time
      const responseTime = performance.now() - startTime;
      usageTracker.trackResponseTime(responseTime);

      return response.body!;
    } catch (error) {
      usageTracker.trackError();
      console.error('ElevenLabs stream error:', error);
      throw error;
    }
  }

  /**
   * Get current month's character usage
   * Requirement 3.6: Track character usage below 10,000 chars/month
   */
  async getUsageStats(): Promise<UsageStats> {
    return { ...this.usageStats };
  }

  /**
   * Check if text is cached
   */
  isCached(text: string): boolean {
    return this.cache.has(text);
  }

  /**
   * Preload common responses
   * Requirement 15.1: Cache frequently used responses
   */
  async preloadResponses(responses: string[]): Promise<void> {
    const promises = responses.map(text => 
      this.synthesize(text, { useCache: true } as TTSOptions)
    );
    
    await Promise.allSettled(promises);
  }

  /**
   * Get default TTS options
   */
  private getDefaultOptions(options?: TTSOptions): Required<TTSOptions> {
    return {
      voice: options?.voice || 'rachel',
      stability: options?.stability ?? 0.75,
      similarityBoost: options?.similarityBoost ?? 0.75,
      useCache: options?.useCache ?? true
    };
  }

  /**
   * Check if we can make an API call without exceeding quota
   */
  private canMakeAPICall(characterCount: number): boolean {
    const currentMonth = this.getCurrentMonth();
    
    // Reset stats if new month
    if (this.usageStats.resetDate.getTime() < new Date(currentMonth).getTime()) {
      this.resetUsageStats();
    }

    return (this.usageStats.charactersUsed + characterCount) <= MONTHLY_CHARACTER_LIMIT;
  }

  /**
   * Update usage statistics
   */
  private updateUsageStats(characterCount: number): void {
    this.usageStats.charactersUsed += characterCount;
    this.usageStats.percentageUsed = 
      (this.usageStats.charactersUsed / this.usageStats.charactersLimit) * 100;
    
    this.saveUsageStats();
  }

  /**
   * Load usage stats from localStorage
   */
  private loadUsageStats(): UsageStats {
    try {
      const stored = localStorage.getItem('jojo_tts_usage');
      if (stored) {
        const parsed = JSON.parse(stored);
        return {
          ...parsed,
          resetDate: new Date(parsed.resetDate)
        };
      }
    } catch (error) {
      console.error('Error loading usage stats:', error);
    }

    // Return default stats
    return this.createDefaultStats();
  }

  /**
   * Save usage stats to localStorage
   */
  private saveUsageStats(): void {
    try {
      localStorage.setItem('jojo_tts_usage', JSON.stringify(this.usageStats));
    } catch (error) {
      console.error('Error saving usage stats:', error);
    }
  }

  /**
   * Reset usage stats for new month
   */
  private resetUsageStats(): void {
    this.usageStats = this.createDefaultStats();
    this.saveUsageStats();
  }

  /**
   * Create default usage stats
   */
  private createDefaultStats(): UsageStats {
    const now = new Date();
    const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);
    
    return {
      charactersUsed: 0,
      charactersLimit: MONTHLY_CHARACTER_LIMIT,
      percentageUsed: 0,
      resetDate: nextMonth
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
export const elevenLabsClient = new ElevenLabsClient();
