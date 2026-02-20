/**
 * AudioFeedbackController Usage Examples
 * 
 * This file demonstrates how to use the AudioFeedbackController
 * for providing visual and auditory feedback in voice interactions.
 */

import { 
  createAudioFeedbackController, 
  FeedbackSound, 
  AvatarState 
} from './audioFeedbackController';

/**
 * Example 1: Basic Usage
 * Shows how to create and use the controller for basic state transitions
 */
export async function basicUsageExample() {
  // Create controller instance
  const controller = createAudioFeedbackController();

  // Show idle state (default)
  controller.showIdle();

  // Simulate wake word detection
  await controller.playFeedbackSound(FeedbackSound.WAKE_WORD_DETECTED);
  controller.showListening();

  // Wait for user to speak
  await new Promise(resolve => setTimeout(resolve, 2000));

  // Show processing state
  controller.showProcessing();
  await controller.playFeedbackSound(FeedbackSound.PROCESSING);

  // Wait for processing
  await new Promise(resolve => setTimeout(resolve, 1500));

  // Show speaking state
  controller.showSpeaking();

  // Wait for TTS to complete
  await new Promise(resolve => setTimeout(resolve, 3000));

  // Return to idle
  controller.showIdle();
  await controller.playFeedbackSound(FeedbackSound.COMMAND_ACCEPTED);

  // Cleanup
  controller.cleanup();
}

/**
 * Example 2: With Audio Stream
 * Shows how to use the controller with real audio streams for waveform visualization
 */
export async function audioStreamExample() {
  const controller = createAudioFeedbackController();

  try {
    // Get user's microphone
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

    // Show listening with waveform
    controller.showListening();
    controller.showSpeaking(stream);

    // Subscribe to waveform updates
    const unsubscribe = controller.onWaveformUpdate((data) => {
      // Calculate average amplitude
      const average = data.reduce((sum, val) => sum + Math.abs(val), 0) / data.length;
      console.log('Audio level:', average);
    });

    // Listen for 5 seconds
    await new Promise(resolve => setTimeout(resolve, 5000));

    // Stop listening
    unsubscribe();
    stream.getTracks().forEach(track => track.stop());
    controller.showIdle();
  } catch (error) {
    console.error('Error accessing microphone:', error);
    await controller.playFeedbackSound(FeedbackSound.ERROR);
  }

  controller.cleanup();
}

/**
 * Example 3: State Change Monitoring
 * Shows how to monitor state changes for logging or analytics
 */
export function stateMonitoringExample() {
  const controller = createAudioFeedbackController();

  // Subscribe to state changes
  const unsubscribe = controller.onStateChange((state) => {
    console.log(`State changed to: ${state}`);
    
    // Log to analytics
    logStateChange(state);
    
    // Update UI
    updateUIForState(state);
  });

  // Simulate state transitions
  controller.showListening();
  setTimeout(() => controller.showProcessing(), 2000);
  setTimeout(() => controller.showSpeaking(), 4000);
  setTimeout(() => controller.showIdle(), 7000);

  // Cleanup after 10 seconds
  setTimeout(() => {
    unsubscribe();
    controller.cleanup();
  }, 10000);
}

/**
 * Example 4: Error Handling
 * Shows how to handle errors and provide appropriate feedback
 */
export async function errorHandlingExample() {
  const controller = createAudioFeedbackController();

  try {
    // Attempt voice recognition
    controller.showListening();
    
    // Simulate recognition error
    throw new Error('Voice recognition failed');
  } catch (error) {
    console.error('Error:', error);
    
    // Show error feedback
    await controller.playFeedbackSound(FeedbackSound.ERROR);
    controller.showIdle();
    
    // Show error message to user
    showErrorMessage('Sorry, I couldn\'t understand that. Please try again.');
  } finally {
    controller.cleanup();
  }
}

/**
 * Example 5: Integration with Voice Assistant
 * Shows how to integrate the controller with a complete voice assistant flow
 */
export async function voiceAssistantIntegrationExample() {
  const controller = createAudioFeedbackController();

  // Subscribe to state changes for UI updates
  const unsubscribeState = controller.onStateChange((state) => {
    updateVoiceAssistantUI(state);
  });

  // Subscribe to waveform for visualization
  const unsubscribeWaveform = controller.onWaveformUpdate((data) => {
    renderWaveform(data);
  });

  try {
    // 1. Wake word detected
    await controller.playFeedbackSound(FeedbackSound.WAKE_WORD_DETECTED);
    controller.showListening();

    // 2. Start voice recognition
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    controller.showSpeaking(stream);

    // 3. Get transcription
    const transcription = await recognizeSpeech(stream);
    stream.getTracks().forEach(track => track.stop());

    // 4. Process command
    controller.showProcessing();
    const response = await processCommand(transcription);

    // 5. Speak response
    controller.showSpeaking();
    await speakResponse(response);

    // 6. Return to idle
    controller.showIdle();
    await controller.playFeedbackSound(FeedbackSound.COMMAND_ACCEPTED);
  } catch (error) {
    console.error('Voice assistant error:', error);
    await controller.playFeedbackSound(FeedbackSound.ERROR);
    controller.showIdle();
  } finally {
    unsubscribeState();
    unsubscribeWaveform();
    controller.cleanup();
  }
}

/**
 * Example 6: React Hook Integration
 * Shows how to create a custom React hook for the controller
 */
export function useAudioFeedback() {
  const [controller] = React.useState(() => createAudioFeedbackController());
  const [currentState, setCurrentState] = React.useState<AvatarState>(AvatarState.IDLE);

  React.useEffect(() => {
    const unsubscribe = controller.onStateChange(setCurrentState);
    return () => {
      unsubscribe();
      controller.cleanup();
    };
  }, [controller]);

  return {
    controller,
    currentState,
    showListening: () => controller.showListening(),
    showProcessing: () => controller.showProcessing(),
    showSpeaking: (stream?: MediaStream) => controller.showSpeaking(stream),
    showIdle: () => controller.showIdle(),
    playSound: (sound: FeedbackSound) => controller.playFeedbackSound(sound)
  };
}

// Helper functions (mock implementations)
function logStateChange(state: AvatarState) {
  console.log('Analytics: State changed to', state);
}

function updateUIForState(state: AvatarState) {
  console.log('UI: Updating for state', state);
}

function showErrorMessage(message: string) {
  console.log('Error message:', message);
}

function updateVoiceAssistantUI(state: AvatarState) {
  console.log('Voice Assistant UI: State', state);
}

function renderWaveform(data: Float32Array) {
  console.log('Rendering waveform with', data.length, 'samples');
}

async function recognizeSpeech(stream: MediaStream): Promise<string> {
  // Mock implementation
  return 'What is the weather today?';
}

async function processCommand(transcription: string): Promise<string> {
  // Mock implementation
  return 'The weather is sunny and 72 degrees.';
}

async function speakResponse(response: string): Promise<void> {
  // Mock implementation
  await new Promise(resolve => setTimeout(resolve, 2000));
}

// Note: React import for the hook example
declare const React: any;
