/**
 * AudioFeedbackController
 * 
 * Provides visual and auditory feedback for voice interactions.
 * Implements real-time waveform visualization, avatar animations, and feedback sounds.
 * 
 * Requirements: 1.2, 1.3, 10.1, 10.2, 10.3, 10.4, 10.5
 */

export enum FeedbackSound {
  WAKE_WORD_DETECTED = "chime",
  COMMAND_ACCEPTED = "success",
  ERROR = "error",
  PROCESSING = "thinking"
}

export enum AvatarState {
  IDLE = "idle",
  LISTENING = "listening",
  THINKING = "thinking",
  SPEAKING = "speaking"
}

export interface AudioFeedbackController {
  // Show listening indicator
  showListening(): void;
  
  // Show processing indicator
  showProcessing(): void;
  
  // Show speaking indicator with waveform
  showSpeaking(audioStream?: MediaStream): void;
  
  // Show idle state
  showIdle(): void;
  
  // Update voice waveform visualization
  updateWaveform(audioData: Float32Array): void;
  
  // Play feedback sound (chime, error, etc.)
  playFeedbackSound(sound: FeedbackSound): Promise<void>;
  
  // Animate JoJo avatar
  animateAvatar(state: AvatarState): void;
  
  // Get current state
  getCurrentState(): AvatarState;
  
  // Cleanup resources
  cleanup(): void;
}

interface AudioFeedbackState {
  currentState: AvatarState;
  isAnimating: boolean;
  audioContext: AudioContext | null;
  analyser: AnalyserNode | null;
  animationFrameId: number | null;
}

/**
 * Implementation of AudioFeedbackController
 */
export class AudioFeedbackControllerImpl implements AudioFeedbackController {
  private state: AudioFeedbackState;
  private stateChangeCallbacks: Array<(state: AvatarState) => void> = [];
  private waveformCallbacks: Array<(data: Float32Array) => void> = [];
  private feedbackSounds: Map<FeedbackSound, HTMLAudioElement> = new Map();

  constructor() {
    this.state = {
      currentState: AvatarState.IDLE,
      isAnimating: false,
      audioContext: null,
      analyser: null,
      animationFrameId: null
    };

    this.initializeFeedbackSounds();
  }

  /**
   * Initialize feedback sound audio elements
   */
  private initializeFeedbackSounds(): void {
    // Create audio elements for each feedback sound
    // In a real implementation, these would load actual audio files
    const sounds: Record<FeedbackSound, string> = {
      [FeedbackSound.WAKE_WORD_DETECTED]: '/sounds/chime.mp3',
      [FeedbackSound.COMMAND_ACCEPTED]: '/sounds/success.mp3',
      [FeedbackSound.ERROR]: '/sounds/error.mp3',
      [FeedbackSound.PROCESSING]: '/sounds/thinking.mp3'
    };

    Object.entries(sounds).forEach(([key, src]) => {
      const audio = new Audio();
      audio.src = src;
      audio.preload = 'auto';
      this.feedbackSounds.set(key as FeedbackSound, audio);
    });
  }

  /**
   * Show listening indicator
   * Requirement 1.3: Visual indicator when JoJo is listening
   * Requirement 10.1: Animated listening indicator (pulsing microphone icon)
   */
  showListening(): void {
    this.setState(AvatarState.LISTENING);
    this.animateAvatar(AvatarState.LISTENING);
  }

  /**
   * Show processing indicator
   * Requirement 10.2: Processing indicator during command processing
   */
  showProcessing(): void {
    this.setState(AvatarState.THINKING);
    this.animateAvatar(AvatarState.THINKING);
  }

  /**
   * Show speaking indicator with waveform
   * Requirement 10.3: Animated avatar with mouth movements synchronized to speech
   * Requirement 10.5: Waveform visualization of TTS output
   */
  showSpeaking(audioStream?: MediaStream): void {
    this.setState(AvatarState.SPEAKING);
    this.animateAvatar(AvatarState.SPEAKING);

    if (audioStream) {
      this.startWaveformVisualization(audioStream);
    }
  }

  /**
   * Show idle state
   */
  showIdle(): void {
    this.setState(AvatarState.IDLE);
    this.animateAvatar(AvatarState.IDLE);
    this.stopWaveformVisualization();
  }

  /**
   * Update voice waveform visualization
   * Requirement 10.4: Real-time voice waveform when user is speaking
   */
  updateWaveform(audioData: Float32Array): void {
    // Notify all registered waveform callbacks
    this.waveformCallbacks.forEach(callback => {
      callback(audioData);
    });
  }

  /**
   * Play feedback sound
   * Requirement 1.2: Audio feedback (chime) within 200ms of wake word detection
   */
  async playFeedbackSound(sound: FeedbackSound): Promise<void> {
    const audio = this.feedbackSounds.get(sound);
    if (!audio) {
      console.warn(`Feedback sound not found: ${sound}`);
      return;
    }

    try {
      // Reset audio to beginning
      audio.currentTime = 0;
      
      // Play the sound
      await audio.play();
    } catch (error) {
      console.error(`Error playing feedback sound ${sound}:`, error);
      // Fallback: use Web Audio API to generate a simple tone
      this.playFallbackTone(sound);
    }
  }

  /**
   * Fallback tone generation when audio files are not available
   */
  private playFallbackTone(sound: FeedbackSound): void {
    if (!this.state.audioContext) {
      this.state.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    }

    const ctx = this.state.audioContext;
    const oscillator = ctx.createOscillator();
    const gainNode = ctx.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(ctx.destination);

    // Different tones for different sounds
    switch (sound) {
      case FeedbackSound.WAKE_WORD_DETECTED:
        oscillator.frequency.value = 800;
        break;
      case FeedbackSound.COMMAND_ACCEPTED:
        oscillator.frequency.value = 1000;
        break;
      case FeedbackSound.ERROR:
        oscillator.frequency.value = 400;
        break;
      case FeedbackSound.PROCESSING:
        oscillator.frequency.value = 600;
        break;
    }

    gainNode.gain.setValueAtTime(0.3, ctx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.2);

    oscillator.start(ctx.currentTime);
    oscillator.stop(ctx.currentTime + 0.2);
  }

  /**
   * Animate JoJo avatar
   * Requirement 10.3: Animated avatar with mouth movements synchronized to speech
   */
  animateAvatar(state: AvatarState): void {
    this.state.isAnimating = true;
    
    // Notify state change callbacks
    this.stateChangeCallbacks.forEach(callback => {
      callback(state);
    });
  }

  /**
   * Start waveform visualization for an audio stream
   */
  private startWaveformVisualization(audioStream: MediaStream): void {
    try {
      // Initialize audio context if not already done
      if (!this.state.audioContext) {
        this.state.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      }

      const ctx = this.state.audioContext;

      // Create analyser node
      if (!this.state.analyser) {
        this.state.analyser = ctx.createAnalyser();
        this.state.analyser.fftSize = 2048;
        this.state.analyser.smoothingTimeConstant = 0.8;
      }

      // Connect audio stream to analyser
      const source = ctx.createMediaStreamSource(audioStream);
      source.connect(this.state.analyser);

      // Start animation loop
      this.animateWaveform();
    } catch (error) {
      console.error('Error starting waveform visualization:', error);
    }
  }

  /**
   * Animation loop for waveform visualization
   */
  private animateWaveform(): void {
    if (!this.state.analyser) return;

    const bufferLength = this.state.analyser.frequencyBinCount;
    const dataArray = new Float32Array(bufferLength);

    const draw = () => {
      if (this.state.currentState !== AvatarState.SPEAKING && 
          this.state.currentState !== AvatarState.LISTENING) {
        return;
      }

      this.state.animationFrameId = requestAnimationFrame(draw);

      // Get waveform data
      this.state.analyser!.getFloatTimeDomainData(dataArray);

      // Update waveform
      this.updateWaveform(dataArray);
    };

    draw();
  }

  /**
   * Stop waveform visualization
   */
  private stopWaveformVisualization(): void {
    if (this.state.animationFrameId !== null) {
      cancelAnimationFrame(this.state.animationFrameId);
      this.state.animationFrameId = null;
    }
  }

  /**
   * Get current state
   */
  getCurrentState(): AvatarState {
    return this.state.currentState;
  }

  /**
   * Set state and notify callbacks
   */
  private setState(newState: AvatarState): void {
    if (this.state.currentState !== newState) {
      this.state.currentState = newState;
    }
  }

  /**
   * Register callback for state changes
   */
  onStateChange(callback: (state: AvatarState) => void): () => void {
    this.stateChangeCallbacks.push(callback);
    
    // Return unsubscribe function
    return () => {
      const index = this.stateChangeCallbacks.indexOf(callback);
      if (index > -1) {
        this.stateChangeCallbacks.splice(index, 1);
      }
    };
  }

  /**
   * Register callback for waveform updates
   */
  onWaveformUpdate(callback: (data: Float32Array) => void): () => void {
    this.waveformCallbacks.push(callback);
    
    // Return unsubscribe function
    return () => {
      const index = this.waveformCallbacks.indexOf(callback);
      if (index > -1) {
        this.waveformCallbacks.splice(index, 1);
      }
    };
  }

  /**
   * Cleanup resources
   */
  cleanup(): void {
    this.stopWaveformVisualization();
    
    // Close audio context
    if (this.state.audioContext) {
      this.state.audioContext.close();
      this.state.audioContext = null;
    }

    // Clear callbacks
    this.stateChangeCallbacks = [];
    this.waveformCallbacks = [];

    // Cleanup audio elements
    this.feedbackSounds.forEach(audio => {
      audio.pause();
      audio.src = '';
    });
    this.feedbackSounds.clear();

    this.state.analyser = null;
    this.state.isAnimating = false;
    this.state.currentState = AvatarState.IDLE;
  }
}

/**
 * Create a new AudioFeedbackController instance
 */
export function createAudioFeedbackController(): AudioFeedbackController {
  return new AudioFeedbackControllerImpl();
}
