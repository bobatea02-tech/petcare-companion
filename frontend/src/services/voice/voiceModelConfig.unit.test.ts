/**
 * Unit Test for Voice Model Configuration
 * Feature: jojo-voice-assistant-enhanced
 * Task: 38.2 Write unit test for voice model configuration
 * Validates: Requirements 3.2
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ElevenLabsClient } from './elevenLabsClient';
import { VOICE_CONFIG } from './config';

describe('Voice Model Configuration - Unit Tests', () => {
  let client: ElevenLabsClient;

  beforeEach(() => {
    // Clear localStorage before each test
    localStorage.clear();
    
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
   * Test that TTS_Engine uses Rachel or Bella voice model
   * Requirement 3.2: Voice model should be Rachel or Bella
   */
  it('should use Rachel voice model by default', async () => {
    // Mock fetch to capture the request
    let capturedVoiceId: string | null = null;
    
    global.fetch = vi.fn().mockImplementation((url: string) => {
      // Extract voice ID from URL
      const match = url.match(/text-to-speech\/([^/]+)/);
      if (match) {
        capturedVoiceId = match[1];
      }
      
      return Promise.resolve({
        ok: true,
        arrayBuffer: () => Promise.resolve(new ArrayBuffer(1024))
      });
    });

    // Synthesize without specifying voice (should use default)
    await client.synthesize('Test message');

    // Verify Rachel voice ID was used
    expect(capturedVoiceId).toBe(VOICE_CONFIG.elevenlabs.voices.rachel);
    expect(capturedVoiceId).toBe('21m00Tcm4TlvDq8ikWAM');
  });

  it('should use Bella voice model when specified', async () => {
    // Mock fetch to capture the request
    let capturedVoiceId: string | null = null;
    
    global.fetch = vi.fn().mockImplementation((url: string) => {
      // Extract voice ID from URL
      const match = url.match(/text-to-speech\/([^/]+)/);
      if (match) {
        capturedVoiceId = match[1];
      }
      
      return Promise.resolve({
        ok: true,
        arrayBuffer: () => Promise.resolve(new ArrayBuffer(1024))
      });
    });

    // Synthesize with Bella voice
    await client.synthesize('Test message', { voice: 'bella' });

    // Verify Bella voice ID was used
    expect(capturedVoiceId).toBe(VOICE_CONFIG.elevenlabs.voices.bella);
    expect(capturedVoiceId).toBe('EXAVITQu4vr4xnSDxMaL');
  });

  it('should configure stability parameter correctly', async () => {
    // Mock fetch to capture the request body
    let capturedRequestBody: any = null;
    
    global.fetch = vi.fn().mockImplementation((_url: string, options: any) => {
      capturedRequestBody = JSON.parse(options.body);
      
      return Promise.resolve({
        ok: true,
        arrayBuffer: () => Promise.resolve(new ArrayBuffer(1024))
      });
    });

    // Synthesize with default settings
    await client.synthesize('Test message');

    // Verify stability is configured
    expect(capturedRequestBody.voice_settings.stability).toBe(0.75);
  });

  it('should configure similarity boost parameter correctly', async () => {
    // Mock fetch to capture the request body
    let capturedRequestBody: any = null;
    
    global.fetch = vi.fn().mockImplementation((_url: string, options: any) => {
      capturedRequestBody = JSON.parse(options.body);
      
      return Promise.resolve({
        ok: true,
        arrayBuffer: () => Promise.resolve(new ArrayBuffer(1024))
      });
    });

    // Synthesize with default settings
    await client.synthesize('Test message');

    // Verify similarity_boost is configured
    expect(capturedRequestBody.voice_settings.similarity_boost).toBe(0.75);
  });

  it('should allow custom stability and similarity boost values', async () => {
    // Mock fetch to capture the request body
    let capturedRequestBody: any = null;
    
    global.fetch = vi.fn().mockImplementation((_url: string, options: any) => {
      capturedRequestBody = JSON.parse(options.body);
      
      return Promise.resolve({
        ok: true,
        arrayBuffer: () => Promise.resolve(new ArrayBuffer(1024))
      });
    });

    // Synthesize with custom settings
    await client.synthesize('Test message', {
      stability: 0.5,
      similarityBoost: 0.9
    });

    // Verify custom values are used
    expect(capturedRequestBody.voice_settings.stability).toBe(0.5);
    expect(capturedRequestBody.voice_settings.similarity_boost).toBe(0.9);
  });

  it('should use correct voice model in streaming mode', async () => {
    // Mock fetch to capture the request
    let capturedVoiceId: string | null = null;
    
    global.fetch = vi.fn().mockImplementation((url: string) => {
      // Extract voice ID from URL
      const match = url.match(/text-to-speech\/([^/]+)/);
      if (match) {
        capturedVoiceId = match[1];
      }
      
      return Promise.resolve({
        ok: true,
        body: new ReadableStream()
      });
    });

    // Synthesize stream with Rachel (default)
    await client.synthesizeStream('Test message');

    // Verify Rachel voice ID was used
    expect(capturedVoiceId).toBe(VOICE_CONFIG.elevenlabs.voices.rachel);
  });

  it('should configure voice settings in streaming mode', async () => {
    // Mock fetch to capture the request body
    let capturedRequestBody: any = null;
    
    global.fetch = vi.fn().mockImplementation((_url: string, options: any) => {
      capturedRequestBody = JSON.parse(options.body);
      
      return Promise.resolve({
        ok: true,
        body: new ReadableStream()
      });
    });

    // Synthesize stream with default settings
    await client.synthesizeStream('Test message');

    // Verify voice settings are configured
    expect(capturedRequestBody.voice_settings.stability).toBe(0.75);
    expect(capturedRequestBody.voice_settings.similarity_boost).toBe(0.75);
  });

  it('should have Rachel and Bella as the only configured voices', () => {
    // Verify configuration has exactly Rachel and Bella
    const voices = Object.keys(VOICE_CONFIG.elevenlabs.voices);
    expect(voices).toHaveLength(2);
    expect(voices).toContain('rachel');
    expect(voices).toContain('bella');
  });

  it('should have valid voice IDs for Rachel and Bella', () => {
    // Verify voice IDs are non-empty strings
    expect(VOICE_CONFIG.elevenlabs.voices.rachel).toBeTruthy();
    expect(VOICE_CONFIG.elevenlabs.voices.bella).toBeTruthy();
    expect(typeof VOICE_CONFIG.elevenlabs.voices.rachel).toBe('string');
    expect(typeof VOICE_CONFIG.elevenlabs.voices.bella).toBe('string');
    
    // Verify they are different
    expect(VOICE_CONFIG.elevenlabs.voices.rachel).not.toBe(VOICE_CONFIG.elevenlabs.voices.bella);
  });

  it('should default to Rachel when invalid voice name is provided', async () => {
    // Mock fetch to capture the request
    let capturedVoiceId: string | null = null;
    
    global.fetch = vi.fn().mockImplementation((url: string) => {
      // Extract voice ID from URL
      const match = url.match(/text-to-speech\/([^/]+)/);
      if (match) {
        capturedVoiceId = match[1];
      }
      
      return Promise.resolve({
        ok: true,
        arrayBuffer: () => Promise.resolve(new ArrayBuffer(1024))
      });
    });

    // Synthesize with invalid voice name
    await client.synthesize('Test message', { voice: 'invalid_voice' as any });

    // Should fall back to Rachel
    expect(capturedVoiceId).toBe(VOICE_CONFIG.elevenlabs.voices.rachel);
  });
});
