/**
 * Example Usage of Voice Assistant Services
 * Feature: jojo-voice-assistant-enhanced
 * 
 * This file demonstrates how to use the voice assistant infrastructure.
 * These examples can be used as reference when implementing the actual components.
 */

import {
  elevenLabsClient,
  responseCacheManager,
  wakeWordDetector,
  VOICE_CONFIG,
  shouldWarnAboutQuota,
  isQuotaExhausted
} from './index';

/**
 * Example 1: Basic TTS Usage
 */
export async function exampleBasicTTS() {
  try {
    // Synthesize speech with default options
    const audioBuffer = await elevenLabsClient.synthesize(
      'Hello! How can I help you today?'
    );
    
    // Play the audio
    const audioContext = new AudioContext();
    const source = audioContext.createBufferSource();
    source.buffer = audioBuffer;
    source.connect(audioContext.destination);
    source.start();
    
    console.log('Audio played successfully');
  } catch (error) {
    console.error('TTS error:', error);
  }
}

/**
 * Example 2: TTS with Custom Options
 */
export async function exampleCustomTTS() {
  try {
    const audioBuffer = await elevenLabsClient.synthesize(
      'Your appointment is scheduled for tomorrow at 3 PM.',
      {
        voice: 'bella',
        stability: 0.8,
        similarityBoost: 0.7,
        useCache: true
      }
    );
    
    console.log('Custom TTS generated');
  } catch (error) {
    console.error('TTS error:', error);
  }
}

/**
 * Example 3: Check Quota Usage
 */
export async function exampleCheckQuota() {
  try {
    const stats = await elevenLabsClient.getUsageStats();
    
    console.log(`Characters used: ${stats.charactersUsed}/${stats.charactersLimit}`);
    console.log(`Usage: ${stats.percentageUsed.toFixed(2)}%`);
    console.log(`Reset date: ${stats.resetDate.toLocaleDateString()}`);
    
    if (shouldWarnAboutQuota(stats.percentageUsed)) {
      console.warn('⚠️ Approaching quota limit! Consider using cached responses.');
    }
    
    if (isQuotaExhausted(stats.percentageUsed)) {
      console.error('❌ Quota exhausted! Falling back to text-only mode.');
    }
  } catch (error) {
    console.error('Error checking quota:', error);
  }
}

/**
 * Example 4: Preload Common Responses
 */
export async function examplePreloadResponses() {
  try {
    console.log('Preloading common responses...');
    
    await elevenLabsClient.preloadResponses(VOICE_CONFIG.commonResponses);
    
    console.log('Common responses preloaded successfully');
  } catch (error) {
    console.error('Preload error:', error);
  }
}

/**
 * Example 5: Cache Management
 */
export async function exampleCacheManagement() {
  try {
    // Get cache statistics
    const stats = responseCacheManager.getStats();
    
    console.log(`Cache entries: ${stats.entryCount}/${VOICE_CONFIG.cache.maxEntries}`);
    console.log(`Total size: ${(stats.totalSize / 1024 / 1024).toFixed(2)} MB`);
    console.log(`Hit rate: ${(stats.hitRate * 100).toFixed(2)}%`);
    
    // Show most used responses
    console.log('Most used responses:');
    stats.mostUsed.forEach((item, index) => {
      console.log(`${index + 1}. "${item.text}" (${item.hitCount} hits)`);
    });
    
    // Manually evict old entries if needed
    if (stats.entryCount >= VOICE_CONFIG.cache.maxEntries) {
      console.log('Cache full, evicting old entries...');
      await responseCacheManager.evictLRU(10);
    }
  } catch (error) {
    console.error('Cache management error:', error);
  }
}

/**
 * Example 6: Wake Word Detection Setup
 */
export async function exampleWakeWordSetup() {
  try {
    // Initialize wake word detector
    await wakeWordDetector.initialize(VOICE_CONFIG.wakeWord.phrase);
    
    // Set up callback for wake word detection
    wakeWordDetector.onWakeWordDetected(() => {
      console.log('🎤 Wake word detected! Starting voice recognition...');
      
      // Here you would start voice recognition
      // For example: startVoiceRecognition();
    });
    
    // Start listening
    wakeWordDetector.startListening();
    console.log('Wake word detector is now listening...');
    
    // To stop listening later:
    // wakeWordDetector.stopListening();
  } catch (error) {
    console.error('Wake word setup error:', error);
  }
}

/**
 * Example 7: Complete Voice Interaction Flow
 */
export async function exampleCompleteFlow() {
  try {
    // 1. Initialize wake word detector
    await wakeWordDetector.initialize(VOICE_CONFIG.wakeWord.phrase);
    
    // 2. Set up wake word callback
    wakeWordDetector.onWakeWordDetected(async () => {
      console.log('Wake word detected!');
      
      // 3. Play acknowledgment sound
      const ackAudio = await elevenLabsClient.synthesize(
        "I'm listening.",
        { useCache: true }
      );
      
      // Play audio...
      
      // 4. Start voice recognition (would be implemented in Task 3)
      // const transcription = await startVoiceRecognition();
      
      // 5. Parse intent (would be implemented in Task 6)
      // const intent = await parseIntent(transcription);
      
      // 6. Execute command (would be implemented in Task 8)
      // const result = await executeCommand(intent);
      
      // 7. Generate response (would be implemented in Task 13)
      // const response = composeResponse(result);
      
      // 8. Speak response
      // const responseAudio = await elevenLabsClient.synthesize(response.text);
      
      console.log('Voice interaction complete');
    });
    
    // 9. Start listening for wake word
    wakeWordDetector.startListening();
    
  } catch (error) {
    console.error('Complete flow error:', error);
  }
}

/**
 * Example 8: Error Handling with Fallback
 */
export async function exampleErrorHandling() {
  try {
    const text = 'This is a test message.';
    
    try {
      // Try to synthesize with TTS
      const audioBuffer = await elevenLabsClient.synthesize(text);
      
      // Play audio...
      console.log('Audio played successfully');
      
    } catch (ttsError) {
      // Fallback to text display
      console.warn('TTS failed, falling back to text display');
      console.log(`[Text Display] ${text}`);
      
      // Show error notification to user
      // showNotification('Voice output unavailable', 'error');
    }
    
  } catch (error) {
    console.error('Error handling example failed:', error);
  }
}

/**
 * Example 9: Quota-Aware Response Generation
 */
export async function exampleQuotaAwareResponse() {
  try {
    const stats = await elevenLabsClient.getUsageStats();
    
    let responseText: string;
    
    if (isQuotaExhausted(stats.percentageUsed)) {
      // Quota exhausted - use text only
      responseText = 'Your appointment is tomorrow at 3 PM.';
      console.log(`[Text Only] ${responseText}`);
      
    } else if (shouldWarnAboutQuota(stats.percentageUsed)) {
      // Approaching quota - use shorter response
      responseText = 'Appointment: tomorrow, 3 PM.';
      const audioBuffer = await elevenLabsClient.synthesize(responseText, {
        useCache: true
      });
      console.log('Shortened response to conserve quota');
      
    } else {
      // Normal quota - use full response
      responseText = 'Your appointment is scheduled for tomorrow at 3 PM. Would you like me to set a reminder?';
      const audioBuffer = await elevenLabsClient.synthesize(responseText);
      console.log('Full response generated');
    }
    
  } catch (error) {
    console.error('Quota-aware response error:', error);
  }
}

/**
 * Example 10: Cleanup on Component Unmount
 */
export function exampleCleanup() {
  // Stop wake word detector
  if (wakeWordDetector.isListening()) {
    wakeWordDetector.stopListening();
  }
  
  // Clear cache if needed
  // await responseCacheManager.clear();
  
  console.log('Voice services cleaned up');
}

// Export all examples for easy testing
export const examples = {
  basicTTS: exampleBasicTTS,
  customTTS: exampleCustomTTS,
  checkQuota: exampleCheckQuota,
  preloadResponses: examplePreloadResponses,
  cacheManagement: exampleCacheManagement,
  wakeWordSetup: exampleWakeWordSetup,
  completeFlow: exampleCompleteFlow,
  errorHandling: exampleErrorHandling,
  quotaAwareResponse: exampleQuotaAwareResponse,
  cleanup: exampleCleanup
};
