/**
 * Property Test: Silence Detection Timing
 * Feature: jojo-voice-assistant-enhanced
 * Property 7: Silence detection timing
 * 
 * For any speech input, when the user stops speaking for 1.5 seconds, 
 * the Voice_Recognition_Engine should finalize the transcription
 * 
 * Validates: Requirements 2.4, 18.1
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import * as fc from 'fast-check';
import { VoiceActivityDetectorImpl } from '@/services/voice/voiceActivityDetector';

// Mock Web Audio API
interface MockAudioContext {
  createAnalyser: () => MockAnalyserNode;
  createMediaStreamSource: (stream: MediaStream) => MockMediaStreamAudioSourceNode;
  close: () => Promise<void>;
  state: string;
}

interface MockAnalyserNode {
  fftSize: number;
  smoothingTimeConstant: number;
  frequencyBinCount: number;
  getByteFrequencyData: (array: Uint8Array) => void;
  connect: (destination: any) => void;
  disconnect: () => void;
}

interface MockMediaStreamAudioSourceNode {
  connect: (destination: any) => void;
  disconnect: () => void;
}

// Helper to create mock audio context
function createMockAudioContext(): MockAudioContext {
  const mockAnalyser: MockAnalyserNode = {
    fftSize: 2048,
    smoothingTimeConstant: 0.8,
    frequencyBinCount: 1024,
    getByteFrequencyData: vi.fn(),
    connect: vi.fn(),
    disconnect: vi.fn(),
  };

  const mockMediaStreamSource: MockMediaStreamAudioSourceNode = {
    connect: vi.fn(),
    disconnect: vi.fn(),
  };

  return {
    createAnalyser: () => mockAnalyser,
    createMediaStreamSource: () => mockMediaStreamSource,
    close: vi.fn().mockResolvedValue(undefined),
    state: 'running',
  };
}

// Helper to create mock MediaStream
function createMockMediaStream(): MediaStream {
  return {
    id: 'mock-stream-id',
    active: true,
    getTracks: () => [],
    getAudioTracks: () => [],
    getVideoTracks: () => [],
    getTrackById: () => null,
    addTrack: vi.fn(),
    removeTrack: vi.fn(),
    clone: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
    onaddtrack: null,
    onremovetrack: null,
  } as any;
}

describe('Property 7: Silence Detection Timing', () => {
  let originalAudioContext: any;
  let originalWebkitAudioContext: any;
  let mockAudioContext: MockAudioContext;
  let mockAnalyser: MockAnalyserNode;

  beforeEach(() => {
    // Save originals
    originalAudioContext = (global as any).AudioContext;
    originalWebkitAudioContext = (global as any).webkitAudioContext;

    // Create mock audio context
    mockAudioContext = createMockAudioContext();
    mockAnalyser = mockAudioContext.createAnalyser();

    // Mock AudioContext constructor
    const MockAudioContextConstructor = vi.fn(() => mockAudioContext);
    (global as any).AudioContext = MockAudioContextConstructor;
    (global as any).webkitAudioContext = MockAudioContextConstructor;

    // Mock setInterval and clearInterval
    vi.useFakeTimers();
  });

  afterEach(() => {
    // Restore originals
    (global as any).AudioContext = originalAudioContext;
    (global as any).webkitAudioContext = originalWebkitAudioContext;

    // Restore timers
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it('should finalize transcription when silence exceeds 1.5 seconds', async () => {
    // Calculate audio levels that correspond to dB thresholds
    // -50dB speech threshold: 20 * log10(level/255) = -50 => level/255 = 10^(-50/20) = 0.00316 => level ≈ 0.8
    // -60dB noise gate: 20 * log10(level/255) = -60 => level/255 = 10^(-60/20) = 0.001 => level ≈ 0.255
    // So we need level > 80 for speech (well above -50dB) and level < 1 for silence (below -60dB)
    // Using 128 (50% of 255) gives about -6dB which is clearly speech
    
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          // Duration of speech before silence (100ms to 5000ms)
          speechDuration: fc.integer({ min: 100, max: 5000 }),
          // Silence duration that should trigger finalization (1500ms to 3000ms)
          silenceDuration: fc.integer({ min: 1500, max: 3000 }),
          // Audio level during speech (well above speech threshold)
          // Using 128-255 range which gives dB values from ~-6dB to 0dB
          speechLevel: fc.integer({ min: 128, max: 255 }),
          // Audio level during silence (below noise gate)
          // Using 0 which gives very low dB (below -60dB)
          silenceLevel: fc.constant(0),
        }),
        async ({ speechDuration, silenceDuration, speechLevel, silenceLevel }) => {
          const detector = new VoiceActivityDetectorImpl();
          const mockStream = createMockMediaStream();

          let speechStartFired = false;
          let speechEndFired = false;

          // Register callbacks
          detector.onSpeechStart(() => {
            speechStartFired = true;
          });

          detector.onSpeechEnd(() => {
            speechEndFired = true;
          });

          // Configure mock analyser to return speech levels
          let currentLevel = speechLevel;
          (mockAnalyser.getByteFrequencyData as any).mockImplementation((array: Uint8Array) => {
            array.fill(currentLevel);
          });

          // Start monitoring
          detector.startMonitoring(mockStream);

          // Simulate speech phase
          vi.advanceTimersByTime(speechDuration);

          // Verify speech was detected
          expect(speechStartFired).toBe(true);
          expect(speechEndFired).toBe(false);

          // Switch to silence
          currentLevel = silenceLevel;

          // Advance time by silence duration
          vi.advanceTimersByTime(silenceDuration);

          // Verify speech end was triggered after 1.5 seconds of silence
          expect(speechEndFired).toBe(true);

          // Cleanup
          detector.stopMonitoring();
        }
      ),
      { numRuns: 100 }
    );
  }, 30000);

  it('should NOT finalize transcription when silence is less than 1.5 seconds', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          // Duration of speech before silence
          speechDuration: fc.integer({ min: 100, max: 2000 }),
          // Silence duration less than threshold (100ms to 1400ms)
          silenceDuration: fc.integer({ min: 100, max: 1400 }),
          // Audio level during speech (well above speech threshold)
          speechLevel: fc.integer({ min: 128, max: 255 }),
          // Audio level during silence (below noise gate)
          silenceLevel: fc.constant(0),
        }),
        async ({ speechDuration, silenceDuration, speechLevel, silenceLevel }) => {
          const detector = new VoiceActivityDetectorImpl();
          const mockStream = createMockMediaStream();

          let speechStartFired = false;
          let speechEndFired = false;

          detector.onSpeechStart(() => {
            speechStartFired = true;
          });

          detector.onSpeechEnd(() => {
            speechEndFired = true;
          });

          // Configure mock analyser
          let currentLevel = speechLevel;
          (mockAnalyser.getByteFrequencyData as any).mockImplementation((array: Uint8Array) => {
            array.fill(currentLevel);
          });

          // Start monitoring
          detector.startMonitoring(mockStream);

          // Simulate speech phase
          vi.advanceTimersByTime(speechDuration);
          expect(speechStartFired).toBe(true);

          // Switch to silence (but less than 1.5 seconds)
          currentLevel = silenceLevel;
          vi.advanceTimersByTime(silenceDuration);

          // Verify speech end was NOT triggered
          expect(speechEndFired).toBe(false);

          // Cleanup
          detector.stopMonitoring();
        }
      ),
      { numRuns: 100 }
    );
  }, 30000);

  it('should reset silence timer when speech resumes before 1.5 seconds', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          // Initial speech duration
          initialSpeechDuration: fc.integer({ min: 100, max: 2000 }),
          // First silence duration (less than 1.5s)
          firstSilenceDuration: fc.integer({ min: 200, max: 1400 }),
          // Second speech duration (resume speaking)
          secondSpeechDuration: fc.integer({ min: 100, max: 2000 }),
          // Second silence duration (should trigger finalization)
          secondSilenceDuration: fc.integer({ min: 1500, max: 3000 }),
          speechLevel: fc.integer({ min: 128, max: 255 }),
          silenceLevel: fc.constant(0),
        }),
        async ({
          initialSpeechDuration,
          firstSilenceDuration,
          secondSpeechDuration,
          secondSilenceDuration,
          speechLevel,
          silenceLevel,
        }) => {
          const detector = new VoiceActivityDetectorImpl();
          const mockStream = createMockMediaStream();

          let speechEndCount = 0;

          detector.onSpeechEnd(() => {
            speechEndCount++;
          });

          // Configure mock analyser
          let currentLevel = speechLevel;
          (mockAnalyser.getByteFrequencyData as any).mockImplementation((array: Uint8Array) => {
            array.fill(currentLevel);
          });

          // Start monitoring
          detector.startMonitoring(mockStream);

          // Phase 1: Initial speech
          vi.advanceTimersByTime(initialSpeechDuration);

          // Phase 2: First silence (less than 1.5s)
          currentLevel = silenceLevel;
          vi.advanceTimersByTime(firstSilenceDuration);

          // Verify speech end NOT triggered yet
          expect(speechEndCount).toBe(0);

          // Phase 3: Resume speech (resets silence timer)
          currentLevel = speechLevel;
          vi.advanceTimersByTime(secondSpeechDuration);

          // Still no speech end
          expect(speechEndCount).toBe(0);

          // Phase 4: Second silence (exceeds 1.5s)
          currentLevel = silenceLevel;
          vi.advanceTimersByTime(secondSilenceDuration);

          // Now speech end should be triggered
          expect(speechEndCount).toBe(1);

          // Cleanup
          detector.stopMonitoring();
        }
      ),
      { numRuns: 100 }
    );
  }, 30000);

  it('should use exactly 1500ms as the silence threshold', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          speechDuration: fc.integer({ min: 500, max: 2000 }),
          speechLevel: fc.integer({ min: 128, max: 255 }),
          silenceLevel: fc.constant(0),
        }),
        async ({ speechDuration, speechLevel, silenceLevel }) => {
          const detector = new VoiceActivityDetectorImpl();
          const mockStream = createMockMediaStream();

          let speechEndFired = false;

          detector.onSpeechEnd(() => {
            speechEndFired = true;
          });

          // Configure mock analyser
          let currentLevel = speechLevel;
          (mockAnalyser.getByteFrequencyData as any).mockImplementation((array: Uint8Array) => {
            array.fill(currentLevel);
          });

          // Start monitoring
          detector.startMonitoring(mockStream);

          // Simulate speech
          vi.advanceTimersByTime(speechDuration);

          // Switch to silence
          currentLevel = silenceLevel;

          // Advance to just before threshold (1400ms)
          vi.advanceTimersByTime(1400);
          expect(speechEndFired).toBe(false);

          // Advance past threshold (to 1600ms total)
          vi.advanceTimersByTime(200);
          expect(speechEndFired).toBe(true);

          // Verify the configured threshold is 1500ms
          expect(detector.getSilenceThreshold()).toBe(1500);

          // Cleanup
          detector.stopMonitoring();
        }
      ),
      { numRuns: 100 }
    );
  }, 30000);

  it('should handle multiple speech-silence cycles correctly', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.array(
          fc.record({
            speechDuration: fc.integer({ min: 200, max: 2000 }),
            silenceDuration: fc.integer({ min: 1500, max: 3000 }),
            speechLevel: fc.integer({ min: 128, max: 255 }),
            silenceLevel: fc.constant(0),
          }),
          { minLength: 2, maxLength: 5 }
        ),
        async (cycles) => {
          const detector = new VoiceActivityDetectorImpl();
          const mockStream = createMockMediaStream();

          let speechStartCount = 0;
          let speechEndCount = 0;

          detector.onSpeechStart(() => {
            speechStartCount++;
          });

          detector.onSpeechEnd(() => {
            speechEndCount++;
          });

          // Configure mock analyser
          let currentLevel = 0;
          (mockAnalyser.getByteFrequencyData as any).mockImplementation((array: Uint8Array) => {
            array.fill(currentLevel);
          });

          // Start monitoring
          detector.startMonitoring(mockStream);

          // Simulate multiple speech-silence cycles
          for (const cycle of cycles) {
            // Speech phase
            currentLevel = cycle.speechLevel;
            vi.advanceTimersByTime(cycle.speechDuration);

            // Silence phase
            currentLevel = cycle.silenceLevel;
            vi.advanceTimersByTime(cycle.silenceDuration);
          }

          // Verify each cycle triggered speech start and end
          expect(speechStartCount).toBe(cycles.length);
          expect(speechEndCount).toBe(cycles.length);

          // Cleanup
          detector.stopMonitoring();
        }
      ),
      { numRuns: 50 }
    );
  }, 60000);

  it('should sample audio at 100ms intervals for silence detection', async () => {
    const detector = new VoiceActivityDetectorImpl();
    const mockStream = createMockMediaStream();

    let sampleCount = 0;
    (mockAnalyser.getByteFrequencyData as any).mockImplementation((array: Uint8Array) => {
      sampleCount++;
      array.fill(5); // Silence level
    });

    // Start monitoring
    detector.startMonitoring(mockStream);

    // Advance time by 1 second
    vi.advanceTimersByTime(1000);

    // Should have sampled approximately 10 times (every 100ms)
    // Allow some tolerance
    expect(sampleCount).toBeGreaterThanOrEqual(9);
    expect(sampleCount).toBeLessThanOrEqual(11);

    // Cleanup
    detector.stopMonitoring();
  });

  it('should distinguish between noise gate and speech threshold', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          speechDuration: fc.integer({ min: 500, max: 2000 }),
          // Audio level between noise gate (-60dB) and speech threshold (-50dB)
          // These levels should be treated as silence
          // For -60dB: level ≈ 0.255, for -50dB: level ≈ 0.8
          // So use levels between 1 and 50 (which map to roughly -60dB to -30dB)
          ambientNoiseLevel: fc.integer({ min: 1, max: 50 }),
          speechLevel: fc.integer({ min: 128, max: 255 }),
          silenceLevel: fc.constant(0),
        }),
        async ({ speechDuration, ambientNoiseLevel, speechLevel, silenceLevel }) => {
          const detector = new VoiceActivityDetectorImpl();
          const mockStream = createMockMediaStream();

          let speechStartFired = false;
          let speechEndFired = false;

          detector.onSpeechStart(() => {
            speechStartFired = true;
          });

          detector.onSpeechEnd(() => {
            speechEndFired = true;
          });

          // Configure mock analyser
          let currentLevel = speechLevel;
          (mockAnalyser.getByteFrequencyData as any).mockImplementation((array: Uint8Array) => {
            array.fill(currentLevel);
          });

          // Start monitoring
          detector.startMonitoring(mockStream);

          // Simulate speech
          vi.advanceTimersByTime(speechDuration);
          expect(speechStartFired).toBe(true);

          // Switch to ambient noise (between noise gate and speech threshold)
          // This should be treated as silence
          currentLevel = ambientNoiseLevel;
          vi.advanceTimersByTime(1600);

          // Speech end should be triggered (ambient noise treated as silence)
          expect(speechEndFired).toBe(true);

          // Cleanup
          detector.stopMonitoring();
        }
      ),
      { numRuns: 100 }
    );
  }, 30000);
});
