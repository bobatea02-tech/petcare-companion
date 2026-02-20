/**
 * HandsFreeModeManager Usage Examples
 * 
 * This file demonstrates how to use the HandsFreeModeManager service
 * to manage hands-free mode in the JoJo voice assistant.
 * 
 * Feature: jojo-voice-assistant-enhanced
 */

import { createHandsFreeModeManager } from './handsFreeMode Manager';
import { createWakeWordDetector } from './wakeWordDetector';
import type { HandsFreeModeManager } from './handsFreeMode Manager';

/**
 * Example 1: Basic Setup and Toggle
 * 
 * Initialize the manager and toggle hands-free mode on/off
 */
export async function basicSetupExample() {
  // Create wake word detector
  const wakeWordDetector = createWakeWordDetector();
  
  // Create hands-free mode manager
  const manager = createHandsFreeModeManager();
  
  // Initialize with wake word detector
  await manager.initialize(wakeWordDetector);
  
  // Enable hands-free mode
  await manager.enable();
  console.log('Hands-free mode enabled:', manager.isEnabled()); // true
  
  // Disable hands-free mode
  manager.disable();
  console.log('Hands-free mode enabled:', manager.isEnabled()); // false
  
  // Toggle mode
  await manager.toggle(); // Enables
  console.log('Hands-free mode enabled:', manager.isEnabled()); // true
  
  await manager.toggle(); // Disables
  console.log('Hands-free mode enabled:', manager.isEnabled()); // false
  
  // Cleanup
  manager.cleanup();
}

/**
 * Example 2: Persistent Preferences
 * 
 * Save and restore user preference across sessions
 */
export async function persistentPreferencesExample() {
  const wakeWordDetector = createWakeWordDetector();
  const manager = createHandsFreeModeManager();
  
  await manager.initialize(wakeWordDetector);
  
  // Enable and save preference
  await manager.enable();
  console.log('Preference saved:', manager.getPreference()); // true
  
  // Simulate page reload - create new manager
  const newManager = createHandsFreeModeManager();
  await newManager.initialize(wakeWordDetector);
  
  // Preference is automatically restored
  console.log('Preference restored:', newManager.getPreference()); // true
  console.log('Mode enabled:', newManager.isEnabled()); // true (auto-enabled from preference)
  
  newManager.cleanup();
}

/**
 * Example 3: Mode Change Callbacks
 * 
 * Listen for mode state changes
 */
export async function modeChangeCallbacksExample() {
  const wakeWordDetector = createWakeWordDetector();
  const manager = createHandsFreeModeManager();
  
  await manager.initialize(wakeWordDetector);
  
  // Register callback
  manager.onModeChange((enabled) => {
    console.log(`Hands-free mode ${enabled ? 'enabled' : 'disabled'}`);
    
    // Update UI
    updateModeIndicator(enabled);
    showToast(enabled ? 'Hands-free mode enabled' : 'Hands-free mode disabled');
  });
  
  // Toggle mode - callback will be called
  await manager.toggle(); // Logs: "Hands-free mode enabled"
  await manager.toggle(); // Logs: "Hands-free mode disabled"
  
  manager.cleanup();
}

/**
 * Example 4: Activity Tracking
 * 
 * Track user activity to reset inactivity timer
 */
export async function activityTrackingExample() {
  const wakeWordDetector = createWakeWordDetector();
  const manager = createHandsFreeModeManager();
  
  await manager.initialize(wakeWordDetector);
  await manager.enable();
  
  // Set up activity tracking on common events
  const trackActivity = () => {
    manager.trackActivity();
    console.log('Activity tracked');
  };
  
  window.addEventListener('mousemove', trackActivity);
  window.addEventListener('keydown', trackActivity);
  window.addEventListener('click', trackActivity);
  window.addEventListener('scroll', trackActivity);
  window.addEventListener('touchstart', trackActivity);
  
  // Check time since last activity
  setTimeout(() => {
    const timeSinceActivity = manager.getTimeSinceLastActivity();
    console.log(`Inactive for ${timeSinceActivity}ms`);
  }, 5000);
  
  // Cleanup
  manager.cleanup();
  window.removeEventListener('mousemove', trackActivity);
  window.removeEventListener('keydown', trackActivity);
  window.removeEventListener('click', trackActivity);
  window.removeEventListener('scroll', trackActivity);
  window.removeEventListener('touchstart', trackActivity);
}

/**
 * Example 5: Inactivity Timeout Handling
 * 
 * Handle inactivity timeout with user dialog
 */
export async function inactivityTimeoutExample() {
  const wakeWordDetector = createWakeWordDetector();
  const manager = createHandsFreeModeManager();
  
  await manager.initialize(wakeWordDetector);
  
  // Register inactivity callback
  manager.onInactivityTimeout(async () => {
    console.log('User inactive for 30 minutes');
    
    // Show dialog asking if user wants to continue
    const shouldContinue = await showInactivityDialog();
    
    if (shouldContinue) {
      console.log('User wants to continue hands-free mode');
      return true; // Continue mode
    } else {
      console.log('User wants to disable hands-free mode');
      return false; // Disable mode
    }
  });
  
  // Enable mode - inactivity timer starts
  await manager.enable();
  
  // After 30 minutes of inactivity, callback will be called
  // If callback returns false, mode will be disabled automatically
  
  manager.cleanup();
}

/**
 * Example 6: React Component Integration
 * 
 * Integrate with React component
 */
export function reactComponentExample() {
  return `
import React, { useState, useEffect, useRef } from 'react';
import { createHandsFreeModeManager } from '@/services/voice/handsFreeMode Manager';
import { createWakeWordDetector } from '@/services/voice/wakeWordDetector';
import { HandsFreeModeToggle, HandsFreeModeIndicator, InactivityDialog } from '@/components/voice';

function VoiceAssistantComponent() {
  const [handsFreeMode, setHandsFreeMode] = useState(false);
  const [showInactivityDialog, setShowInactivityDialog] = useState(false);
  const managerRef = useRef<HandsFreeModeManager | null>(null);

  useEffect(() => {
    const initializeManager = async () => {
      const wakeWordDetector = createWakeWordDetector();
      const manager = createHandsFreeModeManager();
      managerRef.current = manager;

      await manager.initialize(wakeWordDetector);

      // Listen for mode changes
      manager.onModeChange((enabled) => {
        setHandsFreeMode(enabled);
      });

      // Handle inactivity timeout
      manager.onInactivityTimeout(async () => {
        setShowInactivityDialog(true);
        return new Promise((resolve) => {
          window.__inactivityPromiseResolve = resolve;
        });
      });

      // Track activity
      const trackActivity = () => manager.trackActivity();
      window.addEventListener('mousemove', trackActivity);
      window.addEventListener('keydown', trackActivity);

      return () => {
        manager.cleanup();
        window.removeEventListener('mousemove', trackActivity);
        window.removeEventListener('keydown', trackActivity);
      };
    };

    initializeManager();
  }, []);

  const handleToggle = async () => {
    await managerRef.current?.toggle();
  };

  const handleInactivityContinue = () => {
    setShowInactivityDialog(false);
    managerRef.current?.trackActivity();
    window.__inactivityPromiseResolve?.(true);
  };

  const handleInactivityDisable = () => {
    setShowInactivityDialog(false);
    managerRef.current?.disable();
    window.__inactivityPromiseResolve?.(false);
  };

  return (
    <>
      <HandsFreeModeToggle
        isEnabled={handsFreeMode}
        onToggle={handleToggle}
      />
      
      <HandsFreeModeIndicator isEnabled={handsFreeMode} />
      
      <InactivityDialog
        isOpen={showInactivityDialog}
        onContinue={handleInactivityContinue}
        onDisable={handleInactivityDisable}
      />
    </>
  );
}
  `;
}

/**
 * Example 7: Error Handling
 * 
 * Handle errors gracefully
 */
export async function errorHandlingExample() {
  const wakeWordDetector = createWakeWordDetector();
  const manager = createHandsFreeModeManager();
  
  try {
    await manager.initialize(wakeWordDetector);
    
    // Try to enable - may fail if microphone permission denied
    await manager.enable();
    console.log('Hands-free mode enabled successfully');
  } catch (error) {
    console.error('Failed to enable hands-free mode:', error);
    
    // Show error message to user
    showErrorToast('Failed to enable hands-free mode. Please check microphone permissions.');
    
    // Ensure mode is disabled
    manager.disable();
  }
  
  manager.cleanup();
}

/**
 * Example 8: Multiple Callbacks
 * 
 * Register multiple callbacks for mode changes
 */
export async function multipleCallbacksExample() {
  const wakeWordDetector = createWakeWordDetector();
  const manager = createHandsFreeModeManager();
  
  await manager.initialize(wakeWordDetector);
  
  // Register multiple mode change callbacks
  manager.onModeChange((enabled) => {
    console.log('Callback 1:', enabled);
  });
  
  manager.onModeChange((enabled) => {
    console.log('Callback 2:', enabled);
  });
  
  manager.onModeChange((enabled) => {
    console.log('Callback 3:', enabled);
  });
  
  // All callbacks will be called
  await manager.toggle();
  // Logs:
  // Callback 1: true
  // Callback 2: true
  // Callback 3: true
  
  manager.cleanup();
}

// Helper functions (mock implementations)
function updateModeIndicator(enabled: boolean) {
  console.log('Update indicator:', enabled);
}

function showToast(message: string) {
  console.log('Toast:', message);
}

async function showInactivityDialog(): Promise<boolean> {
  // Mock dialog - in real app, show actual dialog
  return confirm('Continue hands-free mode?');
}

function showErrorToast(message: string) {
  console.error('Error toast:', message);
}
