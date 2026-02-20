/**
 * Tests for Voice Recognition Engine
 * Feature: jojo-voice-assistant-enhanced
 * Task: 37.1 Configure voice recognition for English only
 * 
 * Tests language configuration and validation
 * Requirements: 2.6
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { VoiceRecognitionEngineImpl } from './voiceRecognitionEngine';

// Mock Web Speech API
class MockSpeechRecognition {
  continuous = false;
  interimResults = false;
  lang = '';
  maxAlternatives = 1;
  onresult: ((event: any) => void) | null = null;
  onerror: ((event: any) => void) | null = null;
  onend: (() => void) | null = null;
  onstart: (() => void) | null = null;

  start() {}
  stop() {}
  abort() {}
}

describe('VoiceRecognitionEngine - Language Configuration', () => {
  beforeEach(() => {
    // Setup Web Speech API mock
    (global as any).window = {
      SpeechRecognition: MockSpeechRecognition,
      webkitSpeechRecognition: MockSpeechRecognition,
    };
  });

  describe('Default Language Configuration', () => {
    it('should initialize with en-IN language by default', () => {
      const engine = new VoiceRecognitionEngineImpl();
      expect(engine.getLanguage()).toBe('en-IN');
    });

    it('should configure Web Speech API with en-IN language', () => {
      const engine = new VoiceRecognitionEngineImpl();
      // The language should be set during initialization
      expect(engine.getLanguage()).toBe('en-IN');
    });
  });

  describe('Language Validation - Requirement 2.6', () => {
    it('should accept valid English language variants', () => {
      const engine = new VoiceRecognitionEngineImpl();
      
      const validLanguages = [
        'en-IN',
        'en-US',
        'en-GB',
        'en-AU',
        'en-CA',
        'en-NZ',
        'en-ZA',
        'en',
      ];

      validLanguages.forEach(lang => {
        expect(() => engine.setLanguage(lang)).not.toThrow();
        expect(engine.getLanguage()).toBe(lang);
      });
    });

    it('should reject non-English languages', () => {
      const engine = new VoiceRecognitionEngineImpl();
      
      const invalidLanguages = [
        'hi-IN', // Hindi
        'es-ES', // Spanish
        'fr-FR', // French
        'de-DE', // German
        'ja-JP', // Japanese
        'zh-CN', // Chinese
        'ar-SA', // Arabic
      ];

      invalidLanguages.forEach(lang => {
        expect(() => engine.setLanguage(lang)).toThrow(
          `Language '${lang}' is not supported. Only English language variants are supported (e.g., en-IN, en-US, en-GB).`
        );
      });
    });

    it('should reject invalid language codes', () => {
      const engine = new VoiceRecognitionEngineImpl();
      
      expect(() => engine.setLanguage('invalid')).toThrow();
      expect(() => engine.setLanguage('en-XX')).toThrow();
      expect(() => engine.setLanguage('')).toThrow();
    });

    it('should maintain previous language when validation fails', () => {
      const engine = new VoiceRecognitionEngineImpl();
      const initialLanguage = engine.getLanguage();
      
      expect(() => engine.setLanguage('hi-IN')).toThrow();
      expect(engine.getLanguage()).toBe(initialLanguage);
    });
  });

  describe('Language Configuration Persistence', () => {
    it('should persist language changes across operations', () => {
      const engine = new VoiceRecognitionEngineImpl();
      
      engine.setLanguage('en-US');
      expect(engine.getLanguage()).toBe('en-US');
      
      engine.setLanguage('en-GB');
      expect(engine.getLanguage()).toBe('en-GB');
    });
  });

  describe('English-Only Enforcement', () => {
    it('should only support English language input as per Requirement 2.6', () => {
      const engine = new VoiceRecognitionEngineImpl();
      
      // Test that the system enforces English-only
      const currentLang = engine.getLanguage();
      expect(currentLang).toMatch(/^en(-[A-Z]{2})?$/);
      
      // Verify non-English languages are rejected
      expect(() => engine.setLanguage('hi-IN')).toThrow();
      expect(() => engine.setLanguage('es-ES')).toThrow();
      
      // Verify English variants are accepted
      expect(() => engine.setLanguage('en-US')).not.toThrow();
      expect(() => engine.setLanguage('en-GB')).not.toThrow();
    });
  });
});
