/**
 * HandsFreeModeManager Service
 * 
 * Manages hands-free mode state, preferences, and lifecycle.
 * Provides mode toggle with persistent preference, inactivity timeout,
 * and wake word detector lifecycle management.
 * 
 * Requirements: 13.1, 13.2, 13.3, 13.4, 13.5, 13.6
 * Feature: jojo-voice-assistant-enhanced
 */

import type { WakeWordDetector } from './types';

/**
 * Inactivity timeout duration (30 minutes in milliseconds)
 */
const INACTIVITY_TIMEOUT_MS = 30 * 60 * 1000;

/**
 * LocalStorage key for hands-free mode preference
 */
const STORAGE_KEY = 'jojo-hands-free-mode';

/**
 * LocalStorage key for last activity timestamp
 */
const LAST_ACTIVITY_KEY = 'jojo-last-activity';

/**
 * Callback type for mode state changes
 */
export type ModeStateCallback = (enabled: boolean) => void;

/**
 * Callback type for inactivity timeout
 */
export type InactivityCallback = () => Promise<boolean>;

/**
 * HandsFreeModeManager Interface
 */
export interface HandsFreeModeManager {
  /**
   * Initialize the manager with wake word detector
   */
  initialize(detector: WakeWordDetector): Promise<void>;

  /**
   * Enable hands-free mode
   */
  enable(): Promise<void>;

  /**
   * Disable hands-free mode
   */
  disable(): void;

  /**
   * Toggle hands-free mode
   */
  toggle(): Promise<void>;

  /**
   * Get current mode state
   */
  isEnabled(): boolean;

  /**
   * Get persistent preference
   */
  getPreference(): boolean;

  /**
   * Set persistent preference
   */
  setPreference(enabled: boolean): void;

  /**
   * Register callback for mode state changes
   */
  onModeChange(callback: ModeStateCallback): void;

  /**
   * Register callback for inactivity timeout
   */
  onInactivityTimeout(callback: InactivityCallback): void;

  /**
   * Track user activity (resets inactivity timer)
   */
  trackActivity(): void;

  /**
   * Get time since last activity (in milliseconds)
   */
  getTimeSinceLastActivity(): number;

  /**
   * Cleanup resources
   */
  cleanup(): void;
}

/**
 * Create HandsFreeModeManager instance
 */
export function createHandsFreeModeManager(): HandsFreeModeManager {
  let wakeWordDetector: WakeWordDetector | null = null;
  let isHandsFreeEnabled = false;
  let inactivityTimer: NodeJS.Timeout | null = null;
  let lastActivityTime = Date.now();
  
  const modeChangeCallbacks: ModeStateCallback[] = [];
  const inactivityCallbacks: InactivityCallback[] = [];

  /**
   * Load preference from localStorage
   */
  function loadPreference(): boolean {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      return saved === 'true';
    } catch (error) {
      console.error('Failed to load hands-free mode preference:', error);
      return false;
    }
  }

  /**
   * Save preference to localStorage
   */
  function savePreference(enabled: boolean): void {
    try {
      localStorage.setItem(STORAGE_KEY, String(enabled));
    } catch (error) {
      console.error('Failed to save hands-free mode preference:', error);
    }
  }

  /**
   * Save last activity timestamp
   */
  function saveLastActivity(): void {
    try {
      lastActivityTime = Date.now();
      localStorage.setItem(LAST_ACTIVITY_KEY, String(lastActivityTime));
    } catch (error) {
      console.error('Failed to save last activity timestamp:', error);
    }
  }

  /**
   * Load last activity timestamp
   */
  function loadLastActivity(): number {
    try {
      const saved = localStorage.getItem(LAST_ACTIVITY_KEY);
      return saved ? parseInt(saved, 10) : Date.now();
    } catch (error) {
      console.error('Failed to load last activity timestamp:', error);
      return Date.now();
    }
  }

  /**
   * Start inactivity timer
   */
  function startInactivityTimer(): void {
    // Clear existing timer
    if (inactivityTimer) {
      clearTimeout(inactivityTimer);
    }

    // Start new timer
    inactivityTimer = setTimeout(async () => {
      // Check if still in hands-free mode
      if (!isHandsFreeEnabled) return;

      // Notify callbacks and ask if user wants to continue
      let shouldContinue = false;
      
      for (const callback of inactivityCallbacks) {
        try {
          shouldContinue = await callback();
          if (shouldContinue) break;
        } catch (error) {
          console.error('Error in inactivity callback:', error);
        }
      }

      // If user doesn't want to continue, disable hands-free mode
      if (!shouldContinue) {
        await disable();
      } else {
        // Reset timer if user wants to continue
        trackActivity();
      }
    }, INACTIVITY_TIMEOUT_MS);
  }

  /**
   * Stop inactivity timer
   */
  function stopInactivityTimer(): void {
    if (inactivityTimer) {
      clearTimeout(inactivityTimer);
      inactivityTimer = null;
    }
  }

  /**
   * Notify mode change callbacks
   */
  function notifyModeChange(enabled: boolean): void {
    for (const callback of modeChangeCallbacks) {
      try {
        callback(enabled);
      } catch (error) {
        console.error('Error in mode change callback:', error);
      }
    }
  }

  /**
   * Initialize the manager
   */
  async function initialize(detector: WakeWordDetector): Promise<void> {
    wakeWordDetector = detector;
    
    // Load saved preference
    const savedPreference = loadPreference();
    lastActivityTime = loadLastActivity();
    
    // If preference is enabled, start hands-free mode
    if (savedPreference) {
      await enable();
    }
  }

  /**
   * Enable hands-free mode
   */
  async function enable(): Promise<void> {
    if (isHandsFreeEnabled) return;
    if (!wakeWordDetector) {
      throw new Error('HandsFreeModeManager not initialized with wake word detector');
    }

    try {
      // Initialize and start wake word detector
      await wakeWordDetector.initialize('Hey JoJo');
      wakeWordDetector.startListening();

      // Update state
      isHandsFreeEnabled = true;
      savePreference(true);
      trackActivity();

      // Start inactivity timer
      startInactivityTimer();

      // Notify callbacks
      notifyModeChange(true);
    } catch (error) {
      console.error('Failed to enable hands-free mode:', error);
      isHandsFreeEnabled = false;
      throw error;
    }
  }

  /**
   * Disable hands-free mode
   */
  function disable(): void {
    if (!isHandsFreeEnabled) return;
    if (!wakeWordDetector) return;

    // Stop wake word detector
    if (wakeWordDetector.isListening()) {
      wakeWordDetector.stopListening();
    }

    // Update state
    isHandsFreeEnabled = false;
    savePreference(false);

    // Stop inactivity timer
    stopInactivityTimer();

    // Notify callbacks
    notifyModeChange(false);
  }

  /**
   * Toggle hands-free mode
   */
  async function toggle(): Promise<void> {
    if (isHandsFreeEnabled) {
      disable();
    } else {
      await enable();
    }
  }

  /**
   * Get current mode state
   */
  function isEnabled(): boolean {
    return isHandsFreeEnabled;
  }

  /**
   * Get persistent preference
   */
  function getPreference(): boolean {
    return loadPreference();
  }

  /**
   * Set persistent preference
   */
  function setPreference(enabled: boolean): void {
    savePreference(enabled);
  }

  /**
   * Register mode change callback
   */
  function onModeChange(callback: ModeStateCallback): void {
    modeChangeCallbacks.push(callback);
  }

  /**
   * Register inactivity timeout callback
   */
  function onInactivityTimeout(callback: InactivityCallback): void {
    inactivityCallbacks.push(callback);
  }

  /**
   * Track user activity
   */
  function trackActivity(): void {
    saveLastActivity();
    
    // Restart inactivity timer if in hands-free mode
    if (isHandsFreeEnabled) {
      startInactivityTimer();
    }
  }

  /**
   * Get time since last activity
   */
  function getTimeSinceLastActivity(): number {
    return Date.now() - lastActivityTime;
  }

  /**
   * Cleanup resources
   */
  function cleanup(): void {
    stopInactivityTimer();
    
    if (wakeWordDetector?.isListening()) {
      wakeWordDetector.stopListening();
    }
    
    modeChangeCallbacks.length = 0;
    inactivityCallbacks.length = 0;
  }

  return {
    initialize,
    enable,
    disable,
    toggle,
    isEnabled,
    getPreference,
    setPreference,
    onModeChange,
    onInactivityTimeout,
    trackActivity,
    getTimeSinceLastActivity,
    cleanup
  };
}
