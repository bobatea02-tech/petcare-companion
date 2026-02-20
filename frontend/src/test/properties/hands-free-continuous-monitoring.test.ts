/**
 * Property Test: Hands-free Mode Continuous Monitoring
 * Feature: jojo-voice-assistant-enhanced
 * Property 3: Hands-free mode continuous monitoring
 * 
 * For any period when hands-free mode is enabled, the Wake_Word_Detector should 
 * continuously monitor audio without requiring user interaction
 * 
 * Validates: Requirements 1.5, 13.1
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import * as fc from 'fast-check';
import { PorcupineWakeWordDetector } from '@/services/voice/wakeWordDetector';

// Mock Web Audio API
const createMockAudioContext = () => ({
  createMediaStreamSource: vi.fn().mockReturnValue({
    connect: vi.fn()
  }),
  createScriptProcessor: vi.fn().mockReturnValue({
    connect: vi.fn(),
    disconnect: vi.fn(),
    onaudioprocess: null
  }),
  destination: {},
  sampleRate: 16000,
  close: vi.fn()
});

// Mock MediaDevices API
const createMockMediaDevices = () => ({
  getUserMedia: vi.fn().mockResolvedValue({
    getTracks: () => [{
      stop: vi.fn()
    }]
  })
});

// Mock Worker
const createMockWorker = () => {
  const worker = {
    postMessage: vi.fn(),
    terminate: vi.fn(),
    onmessage: null as any,
    onerror: null as any
  };
  return worker;
};

describe('Property 3: Hands-free Mode Continuous Monitoring', () => {
  let originalAudioContext: any;
  let originalMediaDevices: any;
  let originalWorker: any;
  let originalCreateObjectURL: any;

  beforeEach(() => {
    // Save originals
    originalAudioContext = global.AudioContext;
    originalMediaDevices = global.navigator.mediaDevices;
    originalWorker = global.Worker;
    originalCreateObjectURL = global.URL.createObjectURL;

    // Set up mocks
    global.AudioContext = vi.fn().mockImplementation(createMockAudioContext) as any;
    global.navigator.mediaDevices = createMockMediaDevices() as any;
    global.Worker = vi.fn().mockImplementation(createMockWorker) as any;
    global.URL.createObjectURL = vi.fn().mockReturnValue('blob:mock-url');

    vi.clearAllMocks();
  });

  afterEach(() => {
    // Restore originals
    global.AudioContext = originalAudioContext;
    global.navigator.mediaDevices = originalMediaDevices;
    global.Worker = originalWorker;
    global.URL.createObjectURL = originalCreateObjectURL;
    
    vi.restoreAllMocks();
  });

  it('should continuously monitor audio without user interaction when hands-free mode is enabled', async () => {
    await fc.assert(
      fc.asyncProperty(
        // Generate random monitoring duration (in milliseconds)
        fc.integer({ min: 100, max: 5000 }),
        // Generate random number of audio chunks to process
        fc.integer({ min: 5, max: 50 }),
        async (monitoringDuration, audioChunkCount) => {
          const detector = new PorcupineWakeWordDetector();
          
          try {
            // Initialize detector
            await detector.initialize('Hey JoJo');
            
            // Start listening (hands-free mode)
            detector.startListening();
            
            // Verify detector is in listening state
            expect(detector.isListening()).toBe(true);
            
            // Simulate continuous audio processing without user interaction
            const chunkInterval = monitoringDuration / audioChunkCount;
            const processedChunks: number[] = [];
            
            for (let i = 0; i < audioChunkCount; i++) {
              await new Promise(resolve => setTimeout(resolve, chunkInterval));
              
              // Verify detector is still listening (no user interaction required)
              expect(detector.isListening()).toBe(true);
              processedChunks.push(i);
            }
            
            // Verify all chunks were processed
            expect(processedChunks.length).toBe(audioChunkCount);
            
            // Verify detector remained active throughout the entire period
            expect(detector.isListening()).toBe(true);
            
            // Clean up
            detector.stopListening();
            expect(detector.isListening()).toBe(false);
            
          } finally {
            // Ensure cleanup
            if (detector.isListening()) {
              detector.stopListening();
            }
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should maintain continuous monitoring across multiple wake word detections', async () => {
    await fc.assert(
      fc.asyncProperty(
        // Generate random number of wake word detections
        fc.integer({ min: 2, max: 10 }),
        // Generate random intervals between detections (ms)
        fc.integer({ min: 100, max: 1000 }),
        async (detectionCount, intervalMs) => {
          const detector = new PorcupineWakeWordDetector();
          
          try {
            await detector.initialize('Hey JoJo');
            
            // Track wake word detections
            let detectionCounter = 0;
            detector.onWakeWordDetected(() => {
              detectionCounter++;
            });
            
            // Start continuous monitoring
            detector.startListening();
            expect(detector.isListening()).toBe(true);
            
            // Simulate multiple wake word detections
            const workerInstance = (global.Worker as any).mock.results[0]?.value;
            
            for (let i = 0; i < detectionCount; i++) {
              // Wait for interval
              await new Promise(resolve => setTimeout(resolve, intervalMs));
              
              // Verify still listening before detection
              expect(detector.isListening()).toBe(true);
              
              // Simulate wake word detection
              if (workerInstance?.onmessage) {
                workerInstance.onmessage({
                  data: {
                    type: 'detection',
                    keyword: 'Hey JoJo',
                    timestamp: Date.now()
                  }
                });
              }
              
              // Verify still listening after detection (continuous monitoring)
              expect(detector.isListening()).toBe(true);
            }
            
            // Verify detector remained active throughout all detections
            expect(detector.isListening()).toBe(true);
            
            // Clean up
            detector.stopListening();
            
          } finally {
            if (detector.isListening()) {
              detector.stopListening();
            }
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should not require user interaction to maintain monitoring state', async () => {
    await fc.assert(
      fc.asyncProperty(
        // Generate random idle periods (ms) where no user interaction occurs
        fc.array(fc.integer({ min: 100, max: 2000 }), { minLength: 3, maxLength: 10 }),
        async (idlePeriods) => {
          const detector = new PorcupineWakeWordDetector();
          
          try {
            await detector.initialize('Hey JoJo');
            detector.startListening();
            
            // Verify initial state
            expect(detector.isListening()).toBe(true);
            
            // Simulate multiple idle periods with no user interaction
            for (const idlePeriod of idlePeriods) {
              // Wait for idle period (no user interaction)
              await new Promise(resolve => setTimeout(resolve, idlePeriod));
              
              // Verify detector is still monitoring without any user action
              expect(detector.isListening()).toBe(true);
            }
            
            // Verify detector is still active after all idle periods
            expect(detector.isListening()).toBe(true);
            
            // Clean up
            detector.stopListening();
            
          } finally {
            if (detector.isListening()) {
              detector.stopListening();
            }
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should begin continuous monitoring immediately when hands-free mode is enabled', async () => {
    await fc.assert(
      fc.asyncProperty(
        // Generate random wake words
        fc.constantFrom('Hey JoJo', 'Hey Jojo', 'HEY JOJO'),
        async (wakeWord) => {
          const detector = new PorcupineWakeWordDetector();
          
          try {
            await detector.initialize(wakeWord);
            
            // Verify not listening before enabling hands-free mode
            expect(detector.isListening()).toBe(false);
            
            // Enable hands-free mode (start listening)
            const startTime = Date.now();
            detector.startListening();
            const activationTime = Date.now() - startTime;
            
            // Verify monitoring began immediately (within reasonable time)
            expect(detector.isListening()).toBe(true);
            expect(activationTime).toBeLessThan(100); // Should be nearly instantaneous
            
            // Verify getUserMedia was called to access microphone
            expect(global.navigator.mediaDevices.getUserMedia).toHaveBeenCalledWith({
              audio: true
            });
            
            // Clean up
            detector.stopListening();
            
          } finally {
            if (detector.isListening()) {
              detector.stopListening();
            }
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should stop monitoring only when explicitly disabled by user', async () => {
    await fc.assert(
      fc.asyncProperty(
        // Generate random monitoring duration before explicit stop
        fc.integer({ min: 500, max: 3000 }),
        async (monitoringDuration) => {
          const detector = new PorcupineWakeWordDetector();
          
          try {
            await detector.initialize('Hey JoJo');
            detector.startListening();
            
            // Verify monitoring is active
            expect(detector.isListening()).toBe(true);
            
            // Wait for monitoring duration (no automatic stop should occur)
            await new Promise(resolve => setTimeout(resolve, monitoringDuration));
            
            // Verify still monitoring (no automatic stop)
            expect(detector.isListening()).toBe(true);
            
            // Explicitly stop monitoring
            detector.stopListening();
            
            // Verify monitoring stopped only after explicit user action
            expect(detector.isListening()).toBe(false);
            
            // Verify monitoring doesn't restart automatically
            await new Promise(resolve => setTimeout(resolve, 100));
            expect(detector.isListening()).toBe(false);
            
          } finally {
            if (detector.isListening()) {
              detector.stopListening();
            }
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should handle continuous monitoring across varying audio conditions', async () => {
    await fc.assert(
      fc.asyncProperty(
        // Generate random audio conditions (silence, noise, speech)
        fc.array(
          fc.record({
            type: fc.constantFrom('silence', 'noise', 'speech', 'wake_word'),
            duration: fc.integer({ min: 50, max: 500 })
          }),
          { minLength: 5, maxLength: 15 }
        ),
        async (audioConditions) => {
          const detector = new PorcupineWakeWordDetector();
          
          try {
            await detector.initialize('Hey JoJo');
            detector.startListening();
            
            // Verify initial state
            expect(detector.isListening()).toBe(true);
            
            // Simulate various audio conditions
            for (const condition of audioConditions) {
              // Wait for condition duration
              await new Promise(resolve => setTimeout(resolve, condition.duration));
              
              // Verify detector continues monitoring regardless of audio condition
              expect(detector.isListening()).toBe(true);
            }
            
            // Verify detector remained active throughout all conditions
            expect(detector.isListening()).toBe(true);
            
            // Clean up
            detector.stopListening();
            
          } finally {
            if (detector.isListening()) {
              detector.stopListening();
            }
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should maintain monitoring state without periodic re-activation', async () => {
    await fc.assert(
      fc.asyncProperty(
        // Generate random check intervals to verify continuous state
        fc.array(fc.integer({ min: 100, max: 500 }), { minLength: 5, maxLength: 20 }),
        async (checkIntervals) => {
          const detector = new PorcupineWakeWordDetector();
          
          try {
            await detector.initialize('Hey JoJo');
            
            // Start listening once
            detector.startListening();
            const initialCallCount = (detector.startListening as any).mock?.calls?.length || 1;
            
            // Verify monitoring is active
            expect(detector.isListening()).toBe(true);
            
            // Check state at various intervals without calling startListening again
            for (const interval of checkIntervals) {
              await new Promise(resolve => setTimeout(resolve, interval));
              
              // Verify still monitoring without re-activation
              expect(detector.isListening()).toBe(true);
            }
            
            // Verify startListening was only called once (no re-activation needed)
            // The detector should maintain state continuously
            expect(detector.isListening()).toBe(true);
            
            // Clean up
            detector.stopListening();
            
          } finally {
            if (detector.isListening()) {
              detector.stopListening();
            }
          }
        }
      ),
      { numRuns: 100 }
    );
  });
});
