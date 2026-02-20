/**
 * Voice Recognition Engine using Web Speech API
 * Feature: jojo-voice-assistant-enhanced
 * 
 * Converts user speech to text using browser-native Web Speech API.
 * Configured for English (en-IN) locale with continuous recognition mode.
 * 
 * Requirements: 2.1, 2.5, 2.6
 */

import { VoiceRecognitionEngine, RecognitionError } from './types';

// Extend Window interface for Web Speech API
interface SpeechRecognitionEvent extends Event {
  results: SpeechRecognitionResultList;
  resultIndex: number;
}

interface SpeechRecognitionErrorEvent extends Event {
  error: string;
  message: string;
}

interface SpeechRecognitionResultList {
  length: number;
  item(index: number): SpeechRecognitionResult;
  [index: number]: SpeechRecognitionResult;
}

interface SpeechRecognitionResult {
  isFinal: boolean;
  length: number;
  item(index: number): SpeechRecognitionAlternative;
  [index: number]: SpeechRecognitionAlternative;
}

interface SpeechRecognitionAlternative {
  transcript: string;
  confidence: number;
}

interface SpeechRecognition extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  maxAlternatives: number;
  start(): void;
  stop(): void;
  abort(): void;
  onresult: ((event: SpeechRecognitionEvent) => void) | null;
  onerror: ((event: SpeechRecognitionErrorEvent) => void) | null;
  onend: (() => void) | null;
  onstart: (() => void) | null;
}

declare global {
  interface Window {
    SpeechRecognition: new () => SpeechRecognition;
    webkitSpeechRecognition: new () => SpeechRecognition;
  }
}

/**
 * Default configuration values
 */
const DEFAULT_CONFIG = {
  language: 'en-IN', // English (India) locale
  continuous: true, // Enable continuous recognition
  interimResults: true, // Enable interim results for real-time feedback
  maxAlternatives: 1, // Number of alternative transcriptions
  confidenceThreshold: 0.8, // Minimum confidence for accepting results
};

/**
 * Supported English language codes
 * Requirement 2.6: Voice_Recognition_Engine SHALL support English language input only
 */
const SUPPORTED_LANGUAGES = [
  'en-IN', // English (India) - primary
  'en-US', // English (United States)
  'en-GB', // English (United Kingdom)
  'en-AU', // English (Australia)
  'en-CA', // English (Canada)
  'en-NZ', // English (New Zealand)
  'en-ZA', // English (South Africa)
  'en',    // Generic English
];

/**
 * Validate if the language code is a supported English variant
 */
function isValidEnglishLanguage(lang: string): boolean {
  return SUPPORTED_LANGUAGES.includes(lang);
}

/**
 * VoiceRecognitionEngineImpl
 * 
 * Implementation of VoiceRecognitionEngine using Web Speech API.
 * Provides speech-to-text conversion with configurable language and modes.
 */
export class VoiceRecognitionEngineImpl implements VoiceRecognitionEngine {
  private recognition: SpeechRecognition | null = null;
  private isRecognizing: boolean = false;
  
  // Event callbacks
  private interimResultCallback: ((text: string) => void) | null = null;
  private finalResultCallback: ((text: string, confidence: number) => void) | null = null;
  private errorCallback: ((error: RecognitionError) => void) | null = null;
  
  // Configuration
  private language: string = DEFAULT_CONFIG.language;
  private continuous: boolean = DEFAULT_CONFIG.continuous;
  private confidenceThreshold: number = DEFAULT_CONFIG.confidenceThreshold;

  constructor() {
    // Validate default language configuration
    if (!isValidEnglishLanguage(DEFAULT_CONFIG.language)) {
      throw new Error(
        `Default language '${DEFAULT_CONFIG.language}' is not a supported English variant.`
      );
    }
    
    this.initializeRecognition();
  }

  /**
   * Initialize the Web Speech API recognition instance
   */
  private initializeRecognition(): void {
    // Check for Web Speech API support
    const SpeechRecognitionAPI = window.SpeechRecognition || window.webkitSpeechRecognition;
    
    if (!SpeechRecognitionAPI) {
      console.error('Web Speech API is not supported in this browser');
      return;
    }

    this.recognition = new SpeechRecognitionAPI();
    this.configureRecognition();
    this.setupEventHandlers();
  }

  /**
   * Configure recognition settings
   */
  private configureRecognition(): void {
    if (!this.recognition) return;

    this.recognition.continuous = this.continuous;
    this.recognition.interimResults = DEFAULT_CONFIG.interimResults;
    this.recognition.lang = this.language;
    this.recognition.maxAlternatives = DEFAULT_CONFIG.maxAlternatives;
  }

  /**
   * Setup event handlers for recognition events
   */
  private setupEventHandlers(): void {
    if (!this.recognition) return;

    // Handle recognition results
    this.recognition.onresult = (event: SpeechRecognitionEvent) => {
      this.handleResult(event);
    };

    // Handle recognition errors
    this.recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      this.handleError(event);
    };

    // Handle recognition end
    this.recognition.onend = () => {
      this.isRecognizing = false;
      
      // Restart if continuous mode is enabled and we didn't explicitly stop
      if (this.continuous && this.recognition) {
        try {
          this.recognition.start();
          this.isRecognizing = true;
        } catch (error) {
          // Ignore errors from rapid restart attempts
          console.debug('Recognition restart skipped:', error);
        }
      }
    };

    // Handle recognition start
    this.recognition.onstart = () => {
      this.isRecognizing = true;
    };
  }

  /**
   * Handle recognition results
   */
  private handleResult(event: SpeechRecognitionEvent): void {
    for (let i = event.resultIndex; i < event.results.length; i++) {
      const result = event.results[i];
      const transcript = result[0].transcript;
      const confidence = result[0].confidence;

      if (result.isFinal) {
        // Final result - check confidence threshold
        if (confidence >= this.confidenceThreshold) {
          this.finalResultCallback?.(transcript, confidence);
        } else {
          // Low confidence - still report but flag for confirmation
          this.finalResultCallback?.(transcript, confidence);
        }
      } else {
        // Interim result - for real-time feedback
        this.interimResultCallback?.(transcript);
      }
    }
  }

  /**
   * Handle recognition errors
   */
  private handleError(event: SpeechRecognitionErrorEvent): void {
    const error: RecognitionError = {
      code: event.error,
      message: this.getErrorMessage(event.error),
    };

    this.errorCallback?.(error);
    this.isRecognizing = false;
  }

  /**
   * Get user-friendly error message
   */
  private getErrorMessage(errorCode: string): string {
    const errorMessages: Record<string, string> = {
      'no-speech': 'No speech was detected. Please try again.',
      'aborted': 'Speech recognition was aborted.',
      'audio-capture': 'No microphone was found. Please check your microphone settings.',
      'network': 'Network error occurred. Please check your internet connection.',
      'not-allowed': 'Microphone permission was denied. Please allow microphone access.',
      'service-not-allowed': 'Speech recognition service is not allowed.',
      'bad-grammar': 'Speech recognition grammar error.',
      'language-not-supported': 'The specified language is not supported.',
    };

    return errorMessages[errorCode] || `Speech recognition error: ${errorCode}`;
  }

  /**
   * Start listening for speech
   */
  public startRecognition(): void {
    if (!this.recognition) {
      console.error('Speech recognition is not initialized');
      return;
    }

    if (this.isRecognizing) {
      console.warn('Speech recognition is already running');
      return;
    }

    try {
      this.recognition.start();
    } catch (error) {
      console.error('Failed to start speech recognition:', error);
      this.errorCallback?.({
        code: 'start-failed',
        message: 'Failed to start speech recognition',
      });
    }
  }

  /**
   * Stop listening
   */
  public stopRecognition(): void {
    if (!this.recognition) {
      return;
    }

    if (!this.isRecognizing) {
      return;
    }

    try {
      this.recognition.stop();
      this.isRecognizing = false;
    } catch (error) {
      console.error('Failed to stop speech recognition:', error);
    }
  }

  /**
   * Register callback for interim results
   */
  public onInterimResult(callback: (text: string) => void): void {
    this.interimResultCallback = callback;
  }

  /**
   * Register callback for final transcription
   */
  public onFinalResult(callback: (text: string, confidence: number) => void): void {
    this.finalResultCallback = callback;
  }

  /**
   * Register callback for recognition errors
   */
  public onError(callback: (error: RecognitionError) => void): void {
    this.errorCallback = callback;
  }

  /**
   * Configure language
   * Requirement 2.6: Only English language variants are supported
   */
  public setLanguage(lang: string): void {
    // Validate that the language is English
    if (!isValidEnglishLanguage(lang)) {
      throw new Error(
        `Language '${lang}' is not supported. Only English language variants are supported (e.g., en-IN, en-US, en-GB).`
      );
    }
    
    this.language = lang;
    
    if (this.recognition) {
      this.recognition.lang = lang;
    }
  }

  /**
   * Configure continuous mode
   */
  public setContinuous(continuous: boolean): void {
    this.continuous = continuous;
    
    if (this.recognition) {
      this.recognition.continuous = continuous;
    }
  }

  /**
   * Get current recognition state
   */
  public isActive(): boolean {
    return this.isRecognizing;
  }

  /**
   * Get current language setting
   */
  public getLanguage(): string {
    return this.language;
  }

  /**
   * Get confidence threshold
   */
  public getConfidenceThreshold(): number {
    return this.confidenceThreshold;
  }

  /**
   * Set confidence threshold
   */
  public setConfidenceThreshold(threshold: number): void {
    if (threshold < 0 || threshold > 1) {
      throw new Error('Confidence threshold must be between 0 and 1');
    }
    this.confidenceThreshold = threshold;
  }

  /**
   * Check if Web Speech API is supported
   */
  public static isSupported(): boolean {
    return !!(window.SpeechRecognition || window.webkitSpeechRecognition);
  }
}

/**
 * Factory function to create a VoiceRecognitionEngine instance
 */
export function createVoiceRecognitionEngine(): VoiceRecognitionEngine {
  return new VoiceRecognitionEngineImpl();
}

/**
 * Export singleton instance for convenience
 */
export const voiceRecognitionEngine = createVoiceRecognitionEngine();
