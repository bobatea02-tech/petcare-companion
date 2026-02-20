/**
 * Wake Word Detector Usage Examples
 * Feature: jojo-voice-assistant-enhanced
 * 
 * This file demonstrates how to use the WakeWordDetector service
 * for implementing hands-free voice activation with "Hey JoJo"
 */

import { wakeWordDetector, createWakeWordDetector } from './wakeWordDetector';

/**
 * Example 1: Basic Usage with Singleton Instance
 * 
 * This is the recommended approach for most applications.
 * The singleton instance is shared across the application.
 */
export async function basicUsageExample() {
  try {
    // Step 1: Initialize the detector with wake word
    await wakeWordDetector.initialize('Hey JoJo');
    console.log('Wake word detector initialized');

    // Step 2: Register callback for wake word detection
    wakeWordDetector.onWakeWordDetected(() => {
      console.log('Wake word detected! Activating voice assistant...');
      // Trigger voice recognition here
      // e.g., voiceRecognitionEngine.startRecognition();
    });

    // Step 3: Start listening for wake word
    wakeWordDetector.startListening();
    console.log('Listening for "Hey JoJo"...');

    // The detector will now continuously monitor audio in the background
    // When "Hey JoJo" is detected, the callback will be triggered

  } catch (error) {
    console.error('Failed to start wake word detection:', error);
  }
}

/**
 * Example 2: Hands-Free Mode Toggle
 * 
 * Demonstrates how to implement a toggle for hands-free mode
 * that users can enable/disable.
 */
export async function handsFreeToggleExample() {
  let isHandsFreeEnabled = false;

  async function toggleHandsFreeMode() {
    if (!isHandsFreeEnabled) {
      // Enable hands-free mode
      try {
        await wakeWordDetector.initialize('Hey JoJo');
        
        wakeWordDetector.onWakeWordDetected(() => {
          console.log('Wake word detected in hands-free mode');
          // Activate voice assistant
        });

        wakeWordDetector.startListening();
        isHandsFreeEnabled = true;
        console.log('Hands-free mode enabled');
      } catch (error) {
        console.error('Failed to enable hands-free mode:', error);
      }
    } else {
      // Disable hands-free mode
      wakeWordDetector.stopListening();
      isHandsFreeEnabled = false;
      console.log('Hands-free mode disabled');
    }
  }

  // Call this function when user clicks the hands-free toggle button
  await toggleHandsFreeMode();
}

/**
 * Example 3: Multiple Detector Instances
 * 
 * For advanced use cases where you need separate detector instances
 * with different configurations.
 */
export async function multipleInstancesExample() {
  // Create a custom instance
  const customDetector = createWakeWordDetector();

  try {
    await customDetector.initialize('Hey JoJo');

    customDetector.onWakeWordDetected(() => {
      console.log('Custom detector triggered');
    });

    customDetector.startListening();

    // Later, cleanup
    customDetector.stopListening();
    customDetector.dispose();
  } catch (error) {
    console.error('Custom detector error:', error);
  }
}

/**
 * Example 4: React Component Integration
 * 
 * Shows how to integrate wake word detection in a React component
 */
export function ReactComponentExample() {
  // This is a conceptual example - actual implementation would use React hooks
  
  const initializeWakeWord = async () => {
    try {
      await wakeWordDetector.initialize('Hey JoJo');
      
      wakeWordDetector.onWakeWordDetected(() => {
        // Update UI state
        console.log('Wake word detected - show listening indicator');
        // setIsListening(true);
      });

      wakeWordDetector.startListening();
    } catch (error) {
      console.error('Wake word initialization failed:', error);
    }
  };

  const cleanup = () => {
    wakeWordDetector.stopListening();
  };

  // In React: useEffect(() => { initializeWakeWord(); return cleanup; }, []);
}

/**
 * Example 5: Error Handling
 * 
 * Demonstrates proper error handling for common scenarios
 */
export async function errorHandlingExample() {
  try {
    await wakeWordDetector.initialize('Hey JoJo');
    
    wakeWordDetector.onWakeWordDetected(() => {
      console.log('Wake word detected');
    });

    wakeWordDetector.startListening();

  } catch (error) {
    if (error instanceof Error) {
      if (error.message.includes('Microphone access denied')) {
        console.error('User denied microphone access');
        // Show UI message asking user to grant microphone permission
      } else if (error.message.includes('not initialized')) {
        console.error('Detector not initialized');
        // Initialize before starting
      } else {
        console.error('Unknown error:', error.message);
      }
    }
  }
}

/**
 * Example 6: Checking Listening State
 * 
 * Shows how to check if the detector is currently listening
 */
export function checkListeningStateExample() {
  if (wakeWordDetector.isListening()) {
    console.log('Wake word detector is active');
    // Show "listening" indicator in UI
  } else {
    console.log('Wake word detector is inactive');
    // Show "inactive" indicator in UI
  }
}

/**
 * Example 7: Production Setup with Porcupine
 * 
 * For production deployment with actual Porcupine Web SDK:
 * 
 * 1. Install Porcupine:
 *    npm install @picovoice/porcupine-web
 * 
 * 2. Get access key from https://console.picovoice.ai/
 * 
 * 3. Set environment variable:
 *    VITE_PORCUPINE_ACCESS_KEY=your_access_key_here
 * 
 * 4. Train custom wake word model for "Hey JoJo" at:
 *    https://console.picovoice.ai/ppn
 * 
 * 5. The detector will automatically use Porcupine when access key is available
 */
export async function productionSetupExample() {
  // Check if Porcupine is configured
  const hasPorcupineKey = !!import.meta.env.VITE_PORCUPINE_ACCESS_KEY;
  
  if (hasPorcupineKey) {
    console.log('Using Porcupine Web SDK for wake word detection');
  } else {
    console.log('Using simulation mode (development only)');
  }

  await wakeWordDetector.initialize('Hey JoJo');
  wakeWordDetector.startListening();
}

/**
 * Example 8: Cleanup and Resource Management
 * 
 * Proper cleanup when component unmounts or app closes
 */
export function cleanupExample() {
  // Stop listening
  wakeWordDetector.stopListening();

  // Full cleanup (terminates worker, closes audio context)
  wakeWordDetector.dispose();

  console.log('Wake word detector cleaned up');
}
