/**
 * Voice Activity Detector using Web Audio API
 * Feature: jojo-voice-assistant-enhanced
 * 
 * Determines when user has finished speaking by analyzing audio amplitude
 * and silence duration. Uses Web Audio API for real-time audio analysis.
 * 
 * Requirements: 2.4, 18.1, 18.3
 */

import { VoiceActivityDetector } from './types';

/**
 * Default configuration values
 */
const DEFAULT_CONFIG = {
  silenceThreshold: 1500, // 1.5 seconds in milliseconds
  samplingInterval: 100, // Sample audio every 100ms
  speechThreshold: -50, // -50dB for speech detection
  noiseGate: -60, // -60dB noise gate (ignore below this)
  fftSize: 2048, // FFT size for frequency analysis
  smoothingTimeConstant: 0.8, // Smoothing for audio analysis
  midUtterancePauseThreshold: 500, // 500ms for mid-utterance pauses
  endOfUtteranceThreshold: 1500, // 1.5s for end-of-utterance
  fillerWordGracePeriod: 800, // 800ms grace period after filler words
};

/**
 * Filler words that should not trigger end-of-utterance detection
 */
const FILLER_WORDS = ['um', 'uh', 'er', 'ah', 'hmm', 'like', 'you know', 'i mean'];

/**
 * VoiceActivityDetectorImpl
 * 
 * Implementation of VoiceActivityDetector using Web Audio API.
 * Monitors audio stream to detect speech start/end events.
 */
export class VoiceActivityDetectorImpl implements VoiceActivityDetector {
  private audioContext: AudioContext | null = null;
  private analyser: AnalyserNode | null = null;
  private mediaStreamSource: MediaStreamAudioSourceNode | null = null;
  private dataArray: Uint8Array | null = null;
  
  private isMonitoring: boolean = false;
  private isSpeaking: boolean = false;
  private silenceStartTime: number | null = null;
  private monitoringInterval: number | null = null;
  
  // Event callbacks
  private speechStartCallback: (() => void) | null = null;
  private speechEndCallback: (() => void) | null = null;
  
  // Configuration
  private silenceThreshold: number = DEFAULT_CONFIG.silenceThreshold;
  private samplingInterval: number = DEFAULT_CONFIG.samplingInterval;
  private speechThreshold: number = DEFAULT_CONFIG.speechThreshold;
  private noiseGate: number = DEFAULT_CONFIG.noiseGate;
  
  // Current audio level (0-100)
  private currentAudioLevel: number = 0;
  
  // Intelligent pause detection state
  private speechSegments: Array<{ start: number; end: number; level: number }> = [];
  private lastSpeechTime: number | null = null;
  private pauseCount: number = 0;
  private isInMidUtterancePause: boolean = false;
  private lastFillerWordTime: number | null = null;
  private currentUtteranceStartTime: number | null = null;

  /**
   * Start monitoring audio stream for voice activity
   */
  public startMonitoring(stream: MediaStream): void {
    if (this.isMonitoring) {
      console.warn('Voice activity detection is already monitoring');
      return;
    }

    try {
      // Create audio context
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      
      // Create analyser node
      this.analyser = this.audioContext.createAnalyser();
      this.analyser.fftSize = DEFAULT_CONFIG.fftSize;
      this.analyser.smoothingTimeConstant = DEFAULT_CONFIG.smoothingTimeConstant;
      
      // Create media stream source
      this.mediaStreamSource = this.audioContext.createMediaStreamSource(stream);
      this.mediaStreamSource.connect(this.analyser);
      
      // Create data array for audio samples
      const bufferLength = this.analyser.frequencyBinCount;
      this.dataArray = new Uint8Array(bufferLength);
      
      // Start monitoring loop
      this.isMonitoring = true;
      this.startMonitoringLoop();
      
      console.log('Voice activity detection started');
    } catch (error) {
      console.error('Failed to start voice activity detection:', error);
      this.cleanup();
    }
  }

  /**
   * Stop monitoring audio stream
   */
  public stopMonitoring(): void {
    if (!this.isMonitoring) {
      return;
    }

    this.isMonitoring = false;
    
    // Clear monitoring interval
    if (this.monitoringInterval !== null) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = null;
    }
    
    // Cleanup audio resources
    this.cleanup();
    
    console.log('Voice activity detection stopped');
  }

  /**
   * Cleanup audio resources
   */
  private cleanup(): void {
    // Disconnect media stream source
    if (this.mediaStreamSource) {
      this.mediaStreamSource.disconnect();
      this.mediaStreamSource = null;
    }
    
    // Close audio context
    if (this.audioContext) {
      this.audioContext.close();
      this.audioContext = null;
    }
    
    // Clear references
    this.analyser = null;
    this.dataArray = null;
    this.silenceStartTime = null;
    this.isSpeaking = false;
    this.currentAudioLevel = 0;
    
    // Clear intelligent pause detection state
    this.speechSegments = [];
    this.lastSpeechTime = null;
    this.pauseCount = 0;
    this.isInMidUtterancePause = false;
    this.lastFillerWordTime = null;
    this.currentUtteranceStartTime = null;
  }

  /**
   * Start the monitoring loop
   */
  private startMonitoringLoop(): void {
    this.monitoringInterval = window.setInterval(() => {
      this.analyzeAudio();
    }, this.samplingInterval);
  }

  /**
   * Analyze audio and detect speech activity
   */
  private analyzeAudio(): void {
    if (!this.analyser || !this.dataArray) {
      return;
    }

    // Get frequency data
    this.analyser.getByteFrequencyData(this.dataArray);
    
    // Calculate average audio level
    const average = this.calculateAverageLevel(this.dataArray);
    
    // Convert to decibels
    const decibels = this.convertToDecibels(average);
    
    // Update current audio level (0-100 scale)
    this.currentAudioLevel = this.normalizeAudioLevel(average);
    
    // Check if audio is above noise gate
    if (decibels < this.noiseGate) {
      // Below noise gate - treat as silence
      this.handleSilence();
      return;
    }
    
    // Check if audio is above speech threshold
    if (decibels >= this.speechThreshold) {
      // Speech detected
      this.handleSpeech();
    } else {
      // Between noise gate and speech threshold - treat as silence
      this.handleSilence();
    }
  }

  /**
   * Calculate average audio level from frequency data
   */
  private calculateAverageLevel(dataArray: Uint8Array): number {
    let sum = 0;
    for (let i = 0; i < dataArray.length; i++) {
      sum += dataArray[i];
    }
    return sum / dataArray.length;
  }

  /**
   * Convert audio level to decibels
   */
  private convertToDecibels(level: number): number {
    // Normalize to 0-1 range
    const normalized = level / 255;
    
    // Convert to decibels (with minimum threshold to avoid log(0))
    const minLevel = 0.001;
    const safeLevel = Math.max(normalized, minLevel);
    return 20 * Math.log10(safeLevel);
  }

  /**
   * Normalize audio level to 0-100 scale
   */
  private normalizeAudioLevel(level: number): number {
    // Map 0-255 to 0-100
    return Math.round((level / 255) * 100);
  }

  /**
   * Handle speech detection
   */
  private handleSpeech(): void {
    const now = Date.now();
    
    // Track speech segment
    if (!this.isSpeaking) {
      // Starting new utterance
      this.currentUtteranceStartTime = now;
      this.pauseCount = 0;
      this.speechSegments = [];
    }
    
    // Record speech segment
    this.lastSpeechTime = now;
    this.speechSegments.push({
      start: now,
      end: now,
      level: this.currentAudioLevel
    });
    
    // Reset silence timer
    this.silenceStartTime = null;
    this.isInMidUtterancePause = false;
    
    // Fire speech start event if transitioning from silence
    if (!this.isSpeaking) {
      this.isSpeaking = true;
      this.speechStartCallback?.();
    }
  }

  /**
   * Handle silence detection with intelligent pause distinction
   */
  private handleSilence(): void {
    // Only track silence if we were speaking
    if (!this.isSpeaking) {
      return;
    }
    
    const now = Date.now();
    
    // Start silence timer if not already started
    if (this.silenceStartTime === null) {
      this.silenceStartTime = now;
      return;
    }
    
    // Calculate silence duration
    const silenceDuration = now - this.silenceStartTime;
    
    // Check if we're within filler word grace period
    if (this.lastFillerWordTime && (now - this.lastFillerWordTime) < DEFAULT_CONFIG.fillerWordGracePeriod) {
      // Within grace period after filler word - don't end utterance yet
      return;
    }
    
    // Determine if this is a mid-utterance pause or end-of-utterance
    const pauseType = this.classifyPause(silenceDuration);
    
    if (pauseType === 'mid-utterance') {
      // Mid-utterance pause - continue listening
      if (!this.isInMidUtterancePause) {
        this.isInMidUtterancePause = true;
        this.pauseCount++;
      }
    } else if (pauseType === 'end-of-utterance') {
      // End of utterance detected
      this.isSpeaking = false;
      this.silenceStartTime = null;
      this.isInMidUtterancePause = false;
      this.speechEndCallback?.();
      
      // Reset utterance tracking
      this.currentUtteranceStartTime = null;
      this.pauseCount = 0;
      this.speechSegments = [];
    }
  }
  
  /**
   * Classify pause as mid-utterance or end-of-utterance
   * Uses adaptive thresholds based on speech patterns
   */
  private classifyPause(silenceDuration: number): 'mid-utterance' | 'end-of-utterance' | 'continue' {
    // If silence is very short, it's definitely mid-utterance
    if (silenceDuration < DEFAULT_CONFIG.midUtterancePauseThreshold) {
      return 'continue';
    }
    
    // If silence exceeds end-of-utterance threshold, it's definitely the end
    if (silenceDuration >= DEFAULT_CONFIG.endOfUtteranceThreshold) {
      return 'end-of-utterance';
    }
    
    // In the ambiguous range (500ms - 1500ms), use context to decide
    const utteranceDuration = this.currentUtteranceStartTime 
      ? Date.now() - this.currentUtteranceStartTime 
      : 0;
    
    // If utterance is very short (< 1 second), likely still speaking
    if (utteranceDuration < 1000) {
      return 'mid-utterance';
    }
    
    // If we've had multiple pauses already, this might be the end
    if (this.pauseCount >= 2 && silenceDuration > 800) {
      return 'end-of-utterance';
    }
    
    // If speech segments show declining energy, likely ending
    if (this.isEnergyDeclining()) {
      return 'end-of-utterance';
    }
    
    // Default to mid-utterance for ambiguous cases
    return 'mid-utterance';
  }
  
  /**
   * Check if speech energy is declining (indicates end of utterance)
   */
  private isEnergyDeclining(): boolean {
    if (this.speechSegments.length < 3) {
      return false;
    }
    
    // Compare recent segments to earlier segments
    const recentSegments = this.speechSegments.slice(-3);
    const earlierSegments = this.speechSegments.slice(0, Math.min(3, this.speechSegments.length - 3));
    
    if (earlierSegments.length === 0) {
      return false;
    }
    
    const recentAvgLevel = recentSegments.reduce((sum, seg) => sum + seg.level, 0) / recentSegments.length;
    const earlierAvgLevel = earlierSegments.reduce((sum, seg) => sum + seg.level, 0) / earlierSegments.length;
    
    // Energy is declining if recent average is significantly lower
    return recentAvgLevel < earlierAvgLevel * 0.7;
  }
  
  /**
   * Detect filler words (um, uh, etc.) to handle gracefully
   * This is a simplified detection based on audio patterns
   * In a full implementation, this would integrate with speech recognition
   */
  public markFillerWord(): void {
    this.lastFillerWordTime = Date.now();
  }

  /**
   * Register callback for speech start event
   */
  public onSpeechStart(callback: () => void): void {
    this.speechStartCallback = callback;
  }

  /**
   * Register callback for speech end event
   */
  public onSpeechEnd(callback: () => void): void {
    this.speechEndCallback = callback;
  }

  /**
   * Get current audio level (0-100)
   */
  public getAudioLevel(): number {
    return this.currentAudioLevel;
  }

  /**
   * Configure silence threshold (ms)
   */
  public setSilenceThreshold(ms: number): void {
    if (ms < 0) {
      throw new Error('Silence threshold must be non-negative');
    }
    this.silenceThreshold = ms;
  }

  /**
   * Get current silence threshold
   */
  public getSilenceThreshold(): number {
    return this.silenceThreshold;
  }

  /**
   * Get current monitoring state
   */
  public isActive(): boolean {
    return this.isMonitoring;
  }

  /**
   * Get current speaking state
   */
  public isSpeakingNow(): boolean {
    return this.isSpeaking;
  }

  /**
   * Set speech threshold (dB)
   */
  public setSpeechThreshold(db: number): void {
    this.speechThreshold = db;
  }

  /**
   * Get speech threshold
   */
  public getSpeechThreshold(): number {
    return this.speechThreshold;
  }

  /**
   * Set noise gate (dB)
   */
  public setNoiseGate(db: number): void {
    this.noiseGate = db;
  }

  /**
   * Get noise gate
   */
  public getNoiseGate(): number {
    return this.noiseGate;
  }

  /**
   * Check if Web Audio API is supported
   */
  public static isSupported(): boolean {
    return !!(window.AudioContext || (window as any).webkitAudioContext);
  }
  
  /**
   * Get mid-utterance pause threshold
   */
  public getMidUtterancePauseThreshold(): number {
    return DEFAULT_CONFIG.midUtterancePauseThreshold;
  }
  
  /**
   * Get end-of-utterance threshold
   */
  public getEndOfUtteranceThreshold(): number {
    return DEFAULT_CONFIG.endOfUtteranceThreshold;
  }
  
  /**
   * Get current pause count in utterance
   */
  public getPauseCount(): number {
    return this.pauseCount;
  }
  
  /**
   * Check if currently in mid-utterance pause
   */
  public isInMidUtterancePauseState(): boolean {
    return this.isInMidUtterancePause;
  }
}

/**
 * Factory function to create a VoiceActivityDetector instance
 */
export function createVoiceActivityDetector(): VoiceActivityDetector {
  return new VoiceActivityDetectorImpl();
}

/**
 * Export singleton instance for convenience
 */
export const voiceActivityDetector = createVoiceActivityDetector();
