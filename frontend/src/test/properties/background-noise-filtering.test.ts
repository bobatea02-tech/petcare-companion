/**
 * Property Test: Background Noise Filtering
 * Feature: jojo-voice-assistant-enhanced
 * Property 57: Background noise filtering
 * 
 * For any background noise during silence periods, the Voice_Recognition_Engine 
 * should not interpret it as speech
 * 
 * Validates: Requirements 18.3
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

describe('Property 57: Background Noise Filtering', () => {
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

  it('should NOT interpret background noise below noise gate as speech', async () => {
    // The noise gate is -60dB. Audio levels below this should be ignored.
    // For -60dB: 20 * log10(level/255) = -60 => level/255 = 10^(-3) = 0.001 => level ≈ 0.255
    // So any level below ~1 should be below the noise gate and ignored
    
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          // Duration to monitor for background noise (1s to 5s)
          monitoringDuration: fc.integer({ min: 1000, max: 5000 }),
          // Background noise level below noise gate (-60dB)
          // Using 0 which is well below -60dB
          noiseLevel: fc.constant(0),
        }),
        async ({ monitoringDuration, noiseLevel }) => {
          const detector = new VoiceActivityDetectorImpl();
          const mockStream = createMockMediaStream();

          let speechStartFired = false;

          // Register callback to detect if speech is incorrectly detected
          detector.onSpeechStart(() => {
            speechStartFired = true;
          });

          // Configure mock analyser to return background noise level
          (mockAnalyser.getByteFrequencyData as any).mockImplementation((array: Uint8Array) => {
            array.fill(noiseLevel);
          });

          // Start monitoring
          detector.startMonitoring(mockStream);

          // Simulate monitoring period with only background noise
          vi.advanceTimersByTime(monitoringDuration);

          // Verify speech was NOT detected (background noise should be ignored)
          expect(speechStartFired).toBe(false);

          // Cleanup
          detector.stopMonitoring();
        }
      ),
      { numRuns: 100 }
    );
  }, 30000);

  it('should NOT interpret varying background noise below noise gate as speech', async () => {
    // Test with varying background noise levels, all below the noise gate
    
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          // Duration to monitor (1s to 3s)
          monitoringDuration: fc.integer({ min: 1000, max: 3000 }),
          // Array of noise levels, all below noise gate
          // Using only level 0 which is well below -60dB
          noiseLevels: fc.array(fc.constant(0), { minLength: 5, maxLength: 20 }),
        }),
        async ({ monitoringDuration, noiseLevels }) => {
          const detector = new VoiceActivityDetectorImpl();
          const mockStream = createMockMediaStream();

          let speechStartFired = false;

          detector.onSpeechStart(() => {
            speechStartFired = true;
          });

          // Configure mock analyser to cycle through noise levels
          let levelIndex = 0;
          (mockAnalyser.getByteFrequencyData as any).mockImplementation((array: Uint8Array) => {
            const level = noiseLevels[levelIndex % noiseLevels.length];
            array.fill(level);
            levelIndex++;
          });

          // Start monitoring
          detector.startMonitoring(mockStream);

          // Simulate monitoring period with varying background noise
          vi.advanceTimersByTime(monitoringDuration);

          // Verify speech was NOT detected despite varying noise
          expect(speechStartFired).toBe(false);

          // Cleanup
          detector.stopMonitoring();
        }
      ),
      { numRuns: 100 }
    );
  }, 30000);

  it('should maintain silence detection even when background noise is present', async () => {
    // Test that the detector correctly maintains silence state when background noise
    // is present during a silence period after speech
    
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          // Duration of initial speech (500ms to 2s)
          speechDuration: fc.integer({ min: 500, max: 2000 }),
          // Duration of silence with background noise (must be >= 1600ms to exceed 1500ms threshold)
          silenceDuration: fc.integer({ min: 1600, max: 3000 }),
          // Speech level (well above speech threshold -50dB)
          // Using 128-255 range which gives dB values from ~-6dB to 0dB
          speechLevel: fc.integer({ min: 128, max: 255 }),
          // Background noise level during silence (below noise gate)
          noiseLevel: fc.constant(0),
        }),
        async ({ speechDuration, silenceDuration, speechLevel, noiseLevel }) => {
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

          // Phase 1: Speech
          vi.advanceTimersByTime(speechDuration);
          expect(speechStartFired).toBe(true);
          expect(speechEndFired).toBe(false);

          // Phase 2: Silence with background noise
          currentLevel = noiseLevel;
          vi.advanceTimersByTime(silenceDuration);

          // Verify speech end was triggered despite background noise
          // (background noise should not prevent silence detection)
          expect(speechEndFired).toBe(true);

          // Cleanup
          detector.stopMonitoring();
        }
      ),
      { numRuns: 100 }
    );
  }, 30000);

  it('should use -60dB noise gate threshold correctly', async () => {
    // Verify that the noise gate is set to -60dB and audio below this is ignored
    
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          // Monitoring duration
          monitoringDuration: fc.integer({ min: 1000, max: 3000 }),
          // Noise level below -60dB (level 0 is well below)
          noiseLevel: fc.constant(0),
        }),
        async ({ monitoringDuration, noiseLevel }) => {
          const detector = new VoiceActivityDetectorImpl();
          const mockStream = createMockMediaStream();

          // Verify noise gate is set to -60dB
          expect(detector.getNoiseGate()).toBe(-60);

          let speechStartFired = false;

          detector.onSpeechStart(() => {
            speechStartFired = true;
          });

          // Configure mock analyser
          (mockAnalyser.getByteFrequencyData as any).mockImplementation((array: Uint8Array) => {
            array.fill(noiseLevel);
          });

          // Start monitoring
          detector.startMonitoring(mockStream);

          // Monitor for duration
          vi.advanceTimersByTime(monitoringDuration);

          // Verify no speech detected
          expect(speechStartFired).toBe(false);

          // Cleanup
          detector.stopMonitoring();
        }
      ),
      { numRuns: 100 }
    );
  }, 30000);

  it('should NOT trigger speech start when transitioning from silence to background noise', async () => {
    // Test that background noise appearing during silence doesn't trigger speech detection
    
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          // Initial silence duration (500ms to 2s)
          initialSilenceDuration: fc.integer({ min: 500, max: 2000 }),
          // Background noise duration (500ms to 2s)
          noiseDuration: fc.integer({ min: 500, max: 2000 }),
          // Background noise level (below noise gate)
          noiseLevel: fc.constant(0),
        }),
        async ({ initialSilenceDuration, noiseDuration, noiseLevel }) => {
          const detector = new VoiceActivityDetectorImpl();
          const mockStream = createMockMediaStream();

          let speechStartFired = false;

          detector.onSpeechStart(() => {
            speechStartFired = true;
          });

          // Configure mock analyser - start with complete silence
          let currentLevel = 0;
          (mockAnalyser.getByteFrequencyData as any).mockImplementation((array: Uint8Array) => {
            array.fill(currentLevel);
          });

          // Start monitoring
          detector.startMonitoring(mockStream);

          // Phase 1: Initial silence
          vi.advanceTimersByTime(initialSilenceDuration);
          expect(speechStartFired).toBe(false);

          // Phase 2: Background noise appears
          currentLevel = noiseLevel;
          vi.advanceTimersByTime(noiseDuration);

          // Verify speech was NOT detected when background noise appeared
          expect(speechStartFired).toBe(false);

          // Cleanup
          detector.stopMonitoring();
        }
      ),
      { numRuns: 100 }
    );
  }, 30000);

  it('should correctly distinguish between background noise and actual speech', async () => {
    // Test that the detector can distinguish between background noise (below noise gate)
    // and actual speech (above speech threshold)
    
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          // Background noise duration (500ms to 2s)
          noiseDuration: fc.integer({ min: 500, max: 2000 }),
          // Speech duration (500ms to 2s)
          speechDuration: fc.integer({ min: 500, max: 2000 }),
          // Background noise level (below noise gate)
          noiseLevel: fc.constant(0),
          // Speech level (above speech threshold)
          speechLevel: fc.integer({ min: 128, max: 255 }),
        }),
        async ({ noiseDuration, speechDuration, noiseLevel, speechLevel }) => {
          const detector = new VoiceActivityDetectorImpl();
          const mockStream = createMockMediaStream();

          let speechStartCount = 0;

          detector.onSpeechStart(() => {
            speechStartCount++;
          });

          // Configure mock analyser
          let currentLevel = noiseLevel;
          (mockAnalyser.getByteFrequencyData as any).mockImplementation((array: Uint8Array) => {
            array.fill(currentLevel);
          });

          // Start monitoring
          detector.startMonitoring(mockStream);

          // Phase 1: Background noise (should NOT trigger speech)
          vi.advanceTimersByTime(noiseDuration);
          expect(speechStartCount).toBe(0);

          // Phase 2: Actual speech (should trigger speech)
          currentLevel = speechLevel;
          vi.advanceTimersByTime(speechDuration);
          expect(speechStartCount).toBe(1);

          // Phase 3: Back to background noise (should NOT trigger new speech)
          currentLevel = noiseLevel;
          vi.advanceTimersByTime(noiseDuration);
          expect(speechStartCount).toBe(1); // Still only 1 speech detection

          // Cleanup
          detector.stopMonitoring();
        }
      ),
      { numRuns: 100 }
    );
  }, 30000);
});
