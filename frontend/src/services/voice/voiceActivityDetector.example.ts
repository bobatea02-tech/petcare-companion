/**
 * Voice Activity Detector - Usage Examples
 * Feature: jojo-voice-assistant-enhanced
 */

import { voiceActivityDetector, createVoiceActivityDetector } from './voiceActivityDetector';

/**
 * Example 1: Basic Usage
 * 
 * Simple speech detection with default settings
 */
export async function basicUsageExample() {
  try {
    // Request microphone access
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    
    // Register event callbacks
    voiceActivityDetector.onSpeechStart(() => {
      console.log('🎤 User started speaking');
    });
    
    voiceActivityDetector.onSpeechEnd(() => {
      console.log('🔇 User stopped speaking');
    });
    
    // Start monitoring
    voiceActivityDetector.startMonitoring(stream);
    console.log('✓ Voice activity detection started');
    
    // Monitor audio level
    const levelInterval = setInterval(() => {
      const level = voiceActivityDetector.getAudioLevel();
      console.log(`Audio level: ${level}%`);
    }, 500);
    
    // Stop after 30 seconds
    setTimeout(() => {
      clearInterval(levelInterval);
      voiceActivityDetector.stopMonitoring();
      console.log('✓ Voice activity detection stopped');
    }, 30000);
    
  } catch (error) {
    console.error('Failed to start voice activity detection:', error);
  }
}

/**
 * Example 2: Custom Configuration
 * 
 * Create a custom instance with adjusted thresholds
 */
export async function customConfigExample() {
  try {
    // Create custom instance
    const vad = createVoiceActivityDetector();
    
    // Configure for more sensitive detection
    vad.setSilenceThreshold(2000);  // 2 seconds
    vad.setSpeechThreshold(-45);    // More sensitive
    vad.setNoiseGate(-55);          // Less noise filtering
    
    console.log('Configuration:');
    console.log(`- Silence threshold: ${vad.getSilenceThreshold()}ms`);
    console.log(`- Speech threshold: ${vad.getSpeechThreshold()}dB`);
    console.log(`- Noise gate: ${vad.getNoiseGate()}dB`);
    
    // Get microphone stream
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    
    // Start monitoring
    vad.startMonitoring(stream);
    
    vad.onSpeechStart(() => {
      console.log('Speech detected with custom settings');
    });
    
    vad.onSpeechEnd(() => {
      console.log('Speech ended with custom settings');
    });
    
  } catch (error) {
    console.error('Failed to configure voice activity detection:', error);
  }
}

/**
 * Example 3: Integration with Voice Recognition
 * 
 * Use VAD to control voice recognition engine
 */
export async function voiceRecognitionIntegrationExample() {
  try {
    // Import voice recognition engine
    const { voiceRecognitionEngine } = await import('./voiceRecognitionEngine');
    
    // Get microphone stream
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    
    // Start monitoring for voice activity
    voiceActivityDetector.startMonitoring(stream);
    
    // Start recognition when speech detected
    voiceActivityDetector.onSpeechStart(() => {
      console.log('🎤 Speech started - Starting recognition');
      voiceRecognitionEngine.startRecognition();
    });
    
    // Stop recognition when speech ends
    voiceActivityDetector.onSpeechEnd(() => {
      console.log('🔇 Speech ended - Stopping recognition');
      voiceRecognitionEngine.stopRecognition();
    });
    
    // Handle recognition results
    voiceRecognitionEngine.onFinalResult((text, confidence) => {
      console.log(`Transcription: "${text}" (confidence: ${confidence})`);
    });
    
    console.log('✓ Voice recognition integration active');
    
  } catch (error) {
    console.error('Failed to integrate with voice recognition:', error);
  }
}

/**
 * Example 4: Real-time Audio Level Visualization
 * 
 * Display audio level in real-time
 */
export async function audioLevelVisualizationExample() {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    
    voiceActivityDetector.startMonitoring(stream);
    
    // Create visual bar for audio level
    const visualizeLevel = () => {
      const level = voiceActivityDetector.getAudioLevel();
      const bars = '█'.repeat(Math.floor(level / 5));
      const spaces = ' '.repeat(20 - Math.floor(level / 5));
      console.log(`[${bars}${spaces}] ${level}%`);
    };
    
    // Update visualization every 100ms
    const visualInterval = setInterval(visualizeLevel, 100);
    
    // Track speech state
    let isSpeaking = false;
    
    voiceActivityDetector.onSpeechStart(() => {
      isSpeaking = true;
      console.log('\n🎤 SPEAKING\n');
    });
    
    voiceActivityDetector.onSpeechEnd(() => {
      isSpeaking = false;
      console.log('\n🔇 SILENT\n');
    });
    
    // Stop after 30 seconds
    setTimeout(() => {
      clearInterval(visualInterval);
      voiceActivityDetector.stopMonitoring();
    }, 30000);
    
  } catch (error) {
    console.error('Failed to visualize audio level:', error);
  }
}

/**
 * Example 5: Adaptive Threshold Adjustment
 * 
 * Automatically adjust thresholds based on ambient noise
 */
export async function adaptiveThresholdExample() {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    
    voiceActivityDetector.startMonitoring(stream);
    
    // Measure ambient noise level for 3 seconds
    console.log('Measuring ambient noise...');
    
    const noiseLevels: number[] = [];
    const measureInterval = setInterval(() => {
      const level = voiceActivityDetector.getAudioLevel();
      noiseLevels.push(level);
    }, 100);
    
    setTimeout(() => {
      clearInterval(measureInterval);
      
      // Calculate average ambient noise
      const avgNoise = noiseLevels.reduce((a, b) => a + b, 0) / noiseLevels.length;
      console.log(`Average ambient noise: ${avgNoise}%`);
      
      // Adjust thresholds based on ambient noise
      // Higher ambient noise = higher thresholds
      const adjustedSpeechThreshold = -50 + (avgNoise / 10);
      const adjustedNoiseGate = -60 + (avgNoise / 10);
      
      voiceActivityDetector.setSpeechThreshold(adjustedSpeechThreshold);
      voiceActivityDetector.setNoiseGate(adjustedNoiseGate);
      
      console.log('Adjusted thresholds:');
      console.log(`- Speech threshold: ${adjustedSpeechThreshold}dB`);
      console.log(`- Noise gate: ${adjustedNoiseGate}dB`);
      console.log('✓ Ready for speech detection');
      
    }, 3000);
    
    voiceActivityDetector.onSpeechStart(() => {
      console.log('Speech detected with adaptive thresholds');
    });
    
    voiceActivityDetector.onSpeechEnd(() => {
      console.log('Speech ended');
    });
    
  } catch (error) {
    console.error('Failed to adjust thresholds:', error);
  }
}

/**
 * Example 6: Browser Compatibility Check
 * 
 * Check if VAD is supported before using
 */
export function compatibilityCheckExample() {
  const { VoiceActivityDetectorImpl } = require('./voiceActivityDetector');
  
  if (VoiceActivityDetectorImpl.isSupported()) {
    console.log('✓ Web Audio API is supported');
    console.log('✓ Voice Activity Detection is available');
    
    // Check for getUserMedia support
    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
      console.log('✓ Microphone access is available');
      return true;
    } else {
      console.warn('⚠ Microphone access is not available');
      return false;
    }
  } else {
    console.error('✗ Web Audio API is not supported');
    console.error('✗ Voice Activity Detection is not available');
    return false;
  }
}

/**
 * Example 7: Error Handling
 * 
 * Handle common errors gracefully
 */
export async function errorHandlingExample() {
  try {
    // Check browser support first
    const { VoiceActivityDetectorImpl } = await import('./voiceActivityDetector');
    
    if (!VoiceActivityDetectorImpl.isSupported()) {
      throw new Error('Web Audio API is not supported in this browser');
    }
    
    // Request microphone with error handling
    let stream: MediaStream;
    try {
      stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    } catch (error: any) {
      if (error.name === 'NotAllowedError') {
        console.error('Microphone permission denied by user');
        return;
      } else if (error.name === 'NotFoundError') {
        console.error('No microphone found');
        return;
      } else {
        console.error('Failed to access microphone:', error);
        return;
      }
    }
    
    // Start monitoring with error handling
    try {
      voiceActivityDetector.startMonitoring(stream);
      console.log('✓ Voice activity detection started successfully');
    } catch (error) {
      console.error('Failed to start monitoring:', error);
      // Cleanup stream
      stream.getTracks().forEach(track => track.stop());
      return;
    }
    
    // Register callbacks
    voiceActivityDetector.onSpeechStart(() => {
      console.log('Speech detected');
    });
    
    voiceActivityDetector.onSpeechEnd(() => {
      console.log('Speech ended');
    });
    
    // Cleanup on page unload
    window.addEventListener('beforeunload', () => {
      voiceActivityDetector.stopMonitoring();
      stream.getTracks().forEach(track => track.stop());
    });
    
  } catch (error) {
    console.error('Unexpected error:', error);
  }
}

/**
 * Run all examples
 */
export async function runAllExamples() {
  console.log('=== Voice Activity Detector Examples ===\n');
  
  // Check compatibility first
  console.log('Example 1: Compatibility Check');
  const isSupported = compatibilityCheckExample();
  console.log('\n');
  
  if (!isSupported) {
    console.log('Voice Activity Detection is not supported. Skipping examples.');
    return;
  }
  
  // Run examples sequentially
  console.log('Example 2: Basic Usage');
  await basicUsageExample();
  console.log('\n');
  
  console.log('Example 3: Custom Configuration');
  await customConfigExample();
  console.log('\n');
  
  console.log('Example 4: Voice Recognition Integration');
  await voiceRecognitionIntegrationExample();
  console.log('\n');
  
  console.log('Example 5: Audio Level Visualization');
  await audioLevelVisualizationExample();
  console.log('\n');
  
  console.log('Example 6: Adaptive Threshold Adjustment');
  await adaptiveThresholdExample();
  console.log('\n');
  
  console.log('Example 7: Error Handling');
  await errorHandlingExample();
  console.log('\n');
  
  console.log('=== All examples completed ===');
}
