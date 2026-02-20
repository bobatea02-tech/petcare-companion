/**
 * Property-Based Tests for ElevenLabs TTS Client
 * Feature: jojo-voice-assistant-enhanced
 * Property 10: TTS quota management
 * Validates: Requirements 3.6
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import * as fc from 'fast-check';
import { ElevenLabsClient } from './elevenLabsClient';

describe('ElevenLabsClient - Property Tests', () => {
  let client: ElevenLabsClient;

  beforeEach(() => {
    // Clear localStorage before each test
    localStorage.clear();
    
    // Mock fetch for API calls
    global.fetch = vi.fn();
    
    // Mock AudioContext
    global.AudioContext = vi.fn().mockImplementation(() => ({
      decodeAudioData: vi.fn().mockResolvedValue({
        duration: 1.0,
        length: 44100,
        numberOfChannels: 1,
        sampleRate: 44100
      })
    })) as any;

    client = new ElevenLabsClient('test-api-key');
  });

  /**
   * Property 10: TTS quota management
   * For any month of operation, the total character count sent to ElevenLabs API 
   * should not exceed 10,000 characters
   * Validates: Requirements 3.6
   */
  it('should never exceed monthly character quota of 10,000 characters', async () => {
    await fc.assert(
      fc.asyncProperty(
        // Generate an array of text strings that together exceed the quota
        fc.array(
          fc.string({ minLength: 50, maxLength: 200 }),
          { minLength: 60, maxLength: 100 }
        ),
        async (textArray) => {
          // Reset client for each test iteration
          localStorage.clear();
          client = new ElevenLabsClient('test-api-key');

          // Mock successful API responses
          (global.fetch as any).mockImplementation(() =>
            Promise.resolve({
              ok: true,
              arrayBuffer: () => Promise.resolve(new ArrayBuffer(1024))
            })
          );

          let totalCharactersSent = 0;
          let apiCallsMade = 0;
          let quotaExceededErrorThrown = false;

          // Try to synthesize all texts
          for (const text of textArray) {
            try {
              await client.synthesize(text, { useCache: false });
              totalCharactersSent += text.length;
              apiCallsMade++;
            } catch (error: any) {
              // Should throw error when quota exceeded
              if (error.message.includes('quota exceeded')) {
                quotaExceededErrorThrown = true;
                break;
              }
            }
          }

          // Get final usage stats
          const stats = await client.getUsageStats();

          // Property: Total characters used should never exceed 10,000
          expect(stats.charactersUsed).toBeLessThanOrEqual(10000);
          
          // Property: If we tried to send more than 10,000 chars, error should be thrown
          const totalAttempted = textArray.reduce((sum, text) => sum + text.length, 0);
          if (totalAttempted > 10000) {
            expect(quotaExceededErrorThrown).toBe(true);
          }

          // Property: Characters used should match what was actually sent
          expect(stats.charactersUsed).toBe(totalCharactersSent);
          
          // Property: Percentage should be calculated correctly
          const expectedPercentage = (stats.charactersUsed / 10000) * 100;
          expect(stats.percentageUsed).toBeCloseTo(expectedPercentage, 2);
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Additional property: Quota tracking should be accurate across multiple calls
   */
  it('should accurately track character usage across multiple API calls', async () => {
    await fc.assert(
      fc.asyncProperty(
        // Generate array of texts that fit within quota
        fc.array(
          fc.string({ minLength: 10, maxLength: 50 }),
          { minLength: 5, maxLength: 20 }
        ).filter(arr => {
          const total = arr.reduce((sum, text) => sum + text.length, 0);
          return total <= 10000;
        }),
        async (textArray) => {
          // Reset client
          localStorage.clear();
          client = new ElevenLabsClient('test-api-key');

          // Mock successful API responses
          (global.fetch as any).mockImplementation(() =>
            Promise.resolve({
              ok: true,
              arrayBuffer: () => Promise.resolve(new ArrayBuffer(1024))
            })
          );

          let expectedTotal = 0;

          // Synthesize all texts
          for (const text of textArray) {
            await client.synthesize(text, { useCache: false });
            expectedTotal += text.length;

            // Check stats after each call
            const stats = await client.getUsageStats();
            expect(stats.charactersUsed).toBe(expectedTotal);
          }

          // Final verification
          const finalStats = await client.getUsageStats();
          expect(finalStats.charactersUsed).toBe(expectedTotal);
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Additional property: Quota should reset at the beginning of each month
   */
  it('should reset quota at the beginning of a new month', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.string({ minLength: 100, maxLength: 500 }),
        async (text) => {
          // Reset client
          localStorage.clear();
          client = new ElevenLabsClient('test-api-key');

          // Mock successful API response
          (global.fetch as any).mockImplementation(() =>
            Promise.resolve({
              ok: true,
              arrayBuffer: () => Promise.resolve(new ArrayBuffer(1024))
            })
          );

          // Make initial call
          await client.synthesize(text, { useCache: false });
          const statsBeforeReset = await client.getUsageStats();
          expect(statsBeforeReset.charactersUsed).toBe(text.length);

          // Simulate month change by manipulating the reset date in localStorage
          const currentStats = JSON.parse(localStorage.getItem('jojo_tts_usage') || '{}');
          const pastDate = new Date();
          pastDate.setMonth(pastDate.getMonth() - 1);
          currentStats.resetDate = pastDate.toISOString();
          localStorage.setItem('jojo_tts_usage', JSON.stringify(currentStats));

          // Create new client instance (simulates app restart in new month)
          const newClient = new ElevenLabsClient('test-api-key');
          
          // Make another call - should work with reset quota
          await newClient.synthesize(text, { useCache: false });
          const statsAfterReset = await newClient.getUsageStats();

          // Property: After month reset, usage should only reflect new calls
          expect(statsAfterReset.charactersUsed).toBe(text.length);
          expect(statsAfterReset.charactersUsed).not.toBe(statsBeforeReset.charactersUsed + text.length);
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Additional property: Cached responses should not count toward quota
   */
  it('should not count cached responses toward character quota', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.string({ minLength: 50, maxLength: 200 }),
        fc.integer({ min: 2, max: 10 }),
        async (text, repeatCount) => {
          // Reset client
          localStorage.clear();
          client = new ElevenLabsClient('test-api-key');

          // Mock successful API response
          (global.fetch as any).mockImplementation(() =>
            Promise.resolve({
              ok: true,
              arrayBuffer: () => Promise.resolve(new ArrayBuffer(1024))
            })
          );

          // First call - should hit API and count toward quota
          await client.synthesize(text, { useCache: true });
          const statsAfterFirst = await client.getUsageStats();
          expect(statsAfterFirst.charactersUsed).toBe(text.length);

          // Subsequent calls - should use cache and NOT count toward quota
          for (let i = 0; i < repeatCount; i++) {
            await client.synthesize(text, { useCache: true });
          }

          const statsAfterRepeats = await client.getUsageStats();
          
          // Property: Character usage should remain the same after cached calls
          expect(statsAfterRepeats.charactersUsed).toBe(text.length);
          expect(statsAfterRepeats.charactersUsed).toBe(statsAfterFirst.charactersUsed);
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Additional property: Usage stats should persist across client instances
   */
  it('should persist usage stats across client instances', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.array(
          fc.string({ minLength: 20, maxLength: 100 }),
          { minLength: 3, maxLength: 10 }
        ).filter(arr => {
          const total = arr.reduce((sum, text) => sum + text.length, 0);
          return total <= 10000;
        }),
        async (textArray) => {
          // Reset
          localStorage.clear();

          // Mock successful API response
          (global.fetch as any).mockImplementation(() =>
            Promise.resolve({
              ok: true,
              arrayBuffer: () => Promise.resolve(new ArrayBuffer(1024))
            })
          );

          let expectedTotal = 0;

          // Use different client instances for each call
          for (const text of textArray) {
            const tempClient = new ElevenLabsClient('test-api-key');
            await tempClient.synthesize(text, { useCache: false });
            expectedTotal += text.length;
          }

          // Create final client and check stats
          const finalClient = new ElevenLabsClient('test-api-key');
          const finalStats = await finalClient.getUsageStats();

          // Property: Stats should persist across instances
          expect(finalStats.charactersUsed).toBe(expectedTotal);
        }
      ),
      { numRuns: 100 }
    );
  });
});
