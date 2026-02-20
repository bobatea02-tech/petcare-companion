/**
 * Voice Recognition Engine - Usage Examples
 * Feature: jojo-voice-assistant-enhanced
 * 
 * This file demonstrates how to use the VoiceRecognitionEngine service
 * for speech-to-text conversion in the JoJo Voice Assistant.
 */

import { createVoiceRecognitionEngine, VoiceRecognitionEngineImpl } from './voiceRecognitionEngine';

/**
 * Example 1: Basic Usage
 * 
 * Start voice recognition and handle results
 */
export function basicUsageExample() {
  // Create engine instance
  const engine = createVoiceRecognitionEngine();

  // Register callbacks
  engine.onInterimResult((text) => {
    console.log('Interim result:', text);
    // Update UI with interim text for real-time feedback
  });

  engine.onFinalResult((text, confidence) => {
    console.log('Final result:', text);
    console.log('Confidence:', confidence);
    
    // Check confidence threshold (0.8)
    if (confidence < 0.8) {
      console.warn('Low confidence - may need confirmation');
    }
    
    // Process the transcribed text
    processVoiceCommand(text);
  });

  engine.onError((error) => {
    console.error('Recognition error:', error.code, error.message);
    // Handle error (show message to user, retry, etc.)
  });

  // Start recognition
  engine.startRecognition();
}

/**
 * Example 2: Configure for English (India)
 * 
 * Set language to en-IN as per requirements
 */
export function configureLanguageExample() {
  const engine = createVoiceRecognitionEngine();
  
  // Set language to English (India)
  engine.setLanguage('en-IN');
  
  console.log('Language configured:', engine.getLanguage());
  
  engine.startRecognition();
}

/**
 * Example 3: Continuous Recognition Mode
 * 
 * Enable continuous listening for hands-free operation
 */
export function continuousRecognitionExample() {
  const engine = createVoiceRecognitionEngine();
  
  // Enable continuous mode (default is true)
  engine.setContinuous(true);
  
  engine.onFinalResult((text, confidence) => {
    console.log('Continuous result:', text);
    // Process each utterance as it comes
  });
  
  // Start continuous recognition
  engine.startRecognition();
  
  // Recognition will continue until explicitly stopped
  // To stop:
  // engine.stopRecognition();
}

/**
 * Example 4: Confidence Threshold Checking
 * 
 * Handle low confidence results with confirmation
 */
export function confidenceThresholdExample() {
  const engine = createVoiceRecognitionEngine();
  
  // Set confidence threshold to 0.8 (80%)
  engine.setConfidenceThreshold(0.8);
  
  engine.onFinalResult((text, confidence) => {
    if (confidence >= engine.getConfidenceThreshold()) {
      // High confidence - proceed with command
      console.log('High confidence result:', text);
      executeCommand(text);
    } else {
      // Low confidence - request confirmation
      console.log('Low confidence result:', text, confidence);
      requestConfirmation(text);
    }
  });
  
  engine.startRecognition();
}

/**
 * Example 5: Error Handling
 * 
 * Handle various recognition errors gracefully
 */
export function errorHandlingExample() {
  const engine = createVoiceRecognitionEngine();
  
  engine.onError((error) => {
    switch (error.code) {
      case 'no-speech':
        console.log('No speech detected - please try again');
        // Show message to user
        break;
        
      case 'audio-capture':
        console.error('No microphone found');
        // Show microphone setup instructions
        break;
        
      case 'not-allowed':
        console.error('Microphone permission denied');
        // Show permission request dialog
        break;
        
      case 'network':
        console.error('Network error');
        // Show offline message
        break;
        
      default:
        console.error('Recognition error:', error.message);
    }
  });
  
  engine.startRecognition();
}

/**
 * Example 6: Check Browser Support
 * 
 * Verify Web Speech API is available before using
 */
export function checkSupportExample() {
  if (VoiceRecognitionEngineImpl.isSupported()) {
    console.log('Web Speech API is supported');
    const engine = createVoiceRecognitionEngine();
    engine.startRecognition();
  } else {
    console.error('Web Speech API is not supported in this browser');
    // Show fallback UI (text input, etc.)
  }
}

/**
 * Example 7: Start/Stop Control
 * 
 * Manually control recognition lifecycle
 */
export function startStopExample() {
  const engine = createVoiceRecognitionEngine();
  
  engine.onFinalResult((text) => {
    console.log('Result:', text);
  });
  
  // Start recognition
  console.log('Starting recognition...');
  engine.startRecognition();
  
  // Stop after 10 seconds
  setTimeout(() => {
    console.log('Stopping recognition...');
    engine.stopRecognition();
  }, 10000);
}

/**
 * Example 8: Integration with Wake Word Detector
 * 
 * Start recognition when wake word is detected
 */
export function wakeWordIntegrationExample() {
  const engine = createVoiceRecognitionEngine();
  
  // Assume wake word detector is already set up
  // When wake word is detected:
  function onWakeWordDetected() {
    console.log('Wake word detected - starting recognition');
    engine.startRecognition();
  }
  
  engine.onFinalResult((text, confidence) => {
    console.log('Command received:', text);
    
    // Process command
    processVoiceCommand(text);
    
    // Stop recognition after processing
    engine.stopRecognition();
  });
}

// Helper functions (placeholders)
function processVoiceCommand(text: string) {
  console.log('Processing command:', text);
}

function executeCommand(text: string) {
  console.log('Executing command:', text);
}

function requestConfirmation(text: string) {
  console.log('Requesting confirmation for:', text);
}
