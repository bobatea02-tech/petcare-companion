/**
 * Error Recovery Manager Usage Examples
 * Feature: jojo-voice-assistant-enhanced
 */

import { ErrorRecoveryManager, getErrorRecoveryManager, ErrorType } from './errorRecoveryManager';
import { ResponseComposerService } from './responseComposer';
import { VoiceRecognitionEngine } from './voiceRecognitionEngine';
import { ConversationContext, ParsedIntent } from './types';

// ============================================================================
// Example 1: Basic Setup
// ============================================================================

function example1_BasicSetup() {
  console.log('=== Example 1: Basic Setup ===\n');
  
  // Initialize response composer
  const responseComposer = new ResponseComposerService();
  
  // Get error recovery manager instance (singleton)
  const errorRecovery = getErrorRecoveryManager(responseComposer);
  
  console.log('ErrorRecoveryManager initialized successfully');
}

// ============================================================================
// Example 2: Handle Recognition Failures
// ============================================================================

function example2_RecognitionFailures() {
  console.log('\n=== Example 2: Handle Recognition Failures ===\n');
  
  const responseComposer = new ResponseComposerService();
  const errorRecovery = getErrorRecoveryManager(responseComposer);
  
  const mockContext: ConversationContext = {
    previousIntents: [],
    activePet: null,
    currentPage: '/dashboard',
    recentEntities: []
  };
  
  // Scenario 1: Complete recognition failure (no audio captured)
  console.log('Scenario 1: No audio captured');
  const response1 = errorRecovery.handleRecognitionFailure(null, 0, mockContext);
  console.log('Response:', response1.text);
  console.log('Display:', response1.displayText);
  console.log('');
  
  // Scenario 2: Low confidence transcription
  console.log('Scenario 2: Low confidence (0.6)');
  const response2 = errorRecovery.handleRecognitionFailure(
    'show me the pets',
    0.6,
    mockContext
  );
  console.log('Response:', response2.text);
  console.log('Display:', response2.displayText);
  console.log('Visual Data:', response2.visualData);
  console.log('');
  
  // Scenario 3: Multiple failures (exceeds retry limit)
  console.log('Scenario 3: Multiple failures');
  for (let i = 0; i < 4; i++) {
    const response = errorRecovery.handleRecognitionFailure(null, 0, mockContext);
    console.log(`Attempt ${i + 1}:`, response.text);
  }
}

// ============================================================================
// Example 3: Handle Network Errors
// ============================================================================

function example3_NetworkErrors() {
  console.log('\n=== Example 3: Handle Network Errors ===\n');
  
  const responseComposer = new ResponseComposerService();
  const errorRecovery = getErrorRecoveryManager(responseComposer);
  
  const mockContext: ConversationContext = {
    previousIntents: [],
    activePet: null,
    currentPage: '/dashboard',
    recentEntities: []
  };
  
  // Scenario 1: Network error during intent parsing
  console.log('Scenario 1: Intent parsing network error');
  const response1 = errorRecovery.handleNetworkError('intent_parsing', mockContext);
  console.log('Response:', response1.text);
  console.log('Retryable:', response1.visualData.retryable);
  console.log('');
  
  // Scenario 2: Network error during TTS
  console.log('Scenario 2: TTS network error');
  const response2 = errorRecovery.handleNetworkError('tts_synthesis', mockContext);
  console.log('Response:', response2.text);
  console.log('');
  
  // Scenario 3: Multiple network failures
  console.log('Scenario 3: Multiple network failures');
  for (let i = 0; i < 4; i++) {
    const response = errorRecovery.handleNetworkError('api_call', mockContext);
    console.log(`Attempt ${i + 1}:`, response.text);
  }
}

// ============================================================================
// Example 4: Handle Invalid Commands
// ============================================================================

function example4_InvalidCommands() {
  console.log('\n=== Example 4: Handle Invalid Commands ===\n');
  
  const responseComposer = new ResponseComposerService();
  const errorRecovery = getErrorRecoveryManager(responseComposer);
  
  // Scenario 1: Navigation-related invalid command
  console.log('Scenario 1: Navigation-related input');
  const context1: ConversationContext = {
    previousIntents: [],
    activePet: null,
    currentPage: '/dashboard',
    recentEntities: []
  };
  const response1 = errorRecovery.handleInvalidCommand(
    'go to the thing',
    null,
    context1
  );
  console.log('Response:', response1.text);
  console.log('Suggestions:', response1.visualData.suggestions);
  console.log('');
  
  // Scenario 2: Data entry-related invalid command
  console.log('Scenario 2: Data entry-related input');
  const response2 = errorRecovery.handleInvalidCommand(
    'log something for my pet',
    null,
    context1
  );
  console.log('Response:', response2.text);
  console.log('Suggestions:', response2.visualData.suggestions);
  console.log('');
  
  // Scenario 3: Context-aware suggestions (appointments page)
  console.log('Scenario 3: Context-aware (appointments page)');
  const context3: ConversationContext = {
    previousIntents: [],
    activePet: null,
    currentPage: '/appointments',
    recentEntities: []
  };
  const response3 = errorRecovery.handleInvalidCommand(
    'do something',
    null,
    context3
  );
  console.log('Response:', response3.text);
  console.log('Suggestions:', response3.visualData.suggestions);
  console.log('');
  
  // Scenario 4: Completely unrecognizable input
  console.log('Scenario 4: Unrecognizable input');
  const response4 = errorRecovery.handleInvalidCommand(
    'asdfghjkl',
    null,
    context1
  );
  console.log('Response:', response4.text);
  console.log('Help Available:', response4.visualData.helpAvailable);
}

// ============================================================================
// Example 5: Handle Quota Exhaustion
// ============================================================================

function example5_QuotaExhaustion() {
  console.log('\n=== Example 5: Handle Quota Exhaustion ===\n');
  
  const responseComposer = new ResponseComposerService();
  const errorRecovery = getErrorRecoveryManager(responseComposer);
  
  const mockContext: ConversationContext = {
    previousIntents: [],
    activePet: null,
    currentPage: '/dashboard',
    recentEntities: []
  };
  
  const responseText = "Your appointment has been scheduled for tomorrow at 3 PM.";
  
  const response = errorRecovery.handleQuotaExhaustion(responseText, mockContext);
  
  console.log('Audio URL:', response.audioUrl); // null
  console.log('Display Text:', response.displayText);
  console.log('Text Only Mode:', response.visualData.textOnly);
  console.log('Message:', response.visualData.message);
}

// ============================================================================
// Example 6: Handle TTS API Failures
// ============================================================================

function example6_TTSFailures() {
  console.log('\n=== Example 6: Handle TTS API Failures ===\n');
  
  const responseComposer = new ResponseComposerService();
  const errorRecovery = getErrorRecoveryManager(responseComposer);
  
  const mockContext: ConversationContext = {
    previousIntents: [],
    activePet: null,
    currentPage: '/dashboard',
    recentEntities: []
  };
  
  const responseText = "I found 3 upcoming appointments for Max.";
  const error = new Error('ElevenLabs API timeout');
  
  const response = errorRecovery.handleTTSFailure(responseText, error, mockContext);
  
  console.log('Audio URL:', response.audioUrl); // null
  console.log('Display Text:', response.displayText);
  console.log('Error Type:', response.visualData.errorType);
  console.log('Error Message:', response.visualData.error);
}

// ============================================================================
// Example 7: Handle Microphone Errors
// ============================================================================

function example7_MicrophoneErrors() {
  console.log('\n=== Example 7: Handle Microphone Errors ===\n');
  
  const responseComposer = new ResponseComposerService();
  const errorRecovery = getErrorRecoveryManager(responseComposer);
  
  const error = new Error('NotAllowedError: Permission denied');
  
  const response = errorRecovery.handleMicrophoneError(error);
  
  console.log('Response:', response.text);
  console.log('Display:', response.displayText);
  console.log('Instructions:', response.visualData.instructions);
  console.log('Priority:', response.priority);
}

// ============================================================================
// Example 8: Retry Logic
// ============================================================================

function example8_RetryLogic() {
  console.log('\n=== Example 8: Retry Logic ===\n');
  
  const responseComposer = new ResponseComposerService();
  const errorRecovery = getErrorRecoveryManager(responseComposer);
  
  const mockContext: ConversationContext = {
    previousIntents: [],
    activePet: null,
    currentPage: '/dashboard',
    recentEntities: []
  };
  
  // Check if error is retryable
  console.log('Recognition failure retryable:', 
    errorRecovery.isRetryable(ErrorType.RECOGNITION_FAILURE));
  console.log('Network error retryable:', 
    errorRecovery.isRetryable(ErrorType.NETWORK_ERROR));
  console.log('Quota exhaustion retryable:', 
    errorRecovery.isRetryable(ErrorType.QUOTA_EXHAUSTED));
  console.log('');
  
  // Simulate retry attempts
  console.log('Simulating retry attempts:');
  for (let i = 0; i < 3; i++) {
    const response = errorRecovery.handleRecognitionFailure(null, 0, mockContext);
    console.log(`Attempt ${i + 1}:`, response.visualData.attemptCount);
  }
  
  // Reset retry counter after success
  console.log('\nResetting retry counter...');
  errorRecovery.resetRetryCount('recognition');
  
  const response = errorRecovery.handleRecognitionFailure(null, 0, mockContext);
  console.log('After reset, attempt count:', response.visualData.attemptCount);
}

// ============================================================================
// Example 9: Error Statistics
// ============================================================================

function example9_ErrorStatistics() {
  console.log('\n=== Example 9: Error Statistics ===\n');
  
  const responseComposer = new ResponseComposerService();
  const errorRecovery = getErrorRecoveryManager(responseComposer);
  
  const mockContext: ConversationContext = {
    previousIntents: [],
    activePet: null,
    currentPage: '/dashboard',
    recentEntities: []
  };
  
  // Generate some errors
  errorRecovery.handleRecognitionFailure(null, 0, mockContext);
  errorRecovery.handleRecognitionFailure(null, 0, mockContext);
  errorRecovery.handleNetworkError('api_call', mockContext);
  errorRecovery.handleInvalidCommand('test', null, mockContext);
  
  // Get statistics
  const stats = errorRecovery.getErrorStats();
  
  console.log('Error Statistics:');
  stats.forEach((count, errorType) => {
    if (count > 0) {
      console.log(`  ${errorType}: ${count}`);
    }
  });
  
  // Clear history
  console.log('\nClearing error history...');
  errorRecovery.clearErrorHistory();
  
  const newStats = errorRecovery.getErrorStats();
  console.log('After clearing:');
  newStats.forEach((count, errorType) => {
    console.log(`  ${errorType}: ${count}`);
  });
}

// ============================================================================
// Example 10: Integration with Voice Recognition
// ============================================================================

async function example10_VoiceRecognitionIntegration() {
  console.log('\n=== Example 10: Voice Recognition Integration ===\n');
  
  const responseComposer = new ResponseComposerService();
  const errorRecovery = getErrorRecoveryManager(responseComposer);
  const recognitionEngine = new VoiceRecognitionEngine();
  
  const mockContext: ConversationContext = {
    previousIntents: [],
    activePet: null,
    currentPage: '/dashboard',
    recentEntities: []
  };
  
  // Set up error handling
  recognitionEngine.onError((error) => {
    console.log('Recognition error occurred:', error.message);
    const response = errorRecovery.handleRecognitionFailure(null, 0, mockContext);
    console.log('Recovery response:', response.text);
  });
  
  // Set up low confidence handling
  recognitionEngine.onFinalResult((text, confidence) => {
    console.log(`Transcription: "${text}" (confidence: ${confidence})`);
    
    if (confidence < 0.8) {
      const response = errorRecovery.handleRecognitionFailure(text, confidence, mockContext);
      console.log('Low confidence response:', response.text);
    } else {
      console.log('Processing command...');
      errorRecovery.resetRetryCount('recognition');
    }
  });
  
  console.log('Voice recognition with error handling configured');
}

// ============================================================================
// Example 11: Complete Error Handling Flow
// ============================================================================

async function example11_CompleteFlow() {
  console.log('\n=== Example 11: Complete Error Handling Flow ===\n');
  
  const responseComposer = new ResponseComposerService();
  const errorRecovery = getErrorRecoveryManager(responseComposer);
  
  const mockContext: ConversationContext = {
    previousIntents: [],
    activePet: 'Max',
    currentPage: '/dashboard',
    recentEntities: []
  };
  
  // Simulate a complete voice interaction with errors
  
  // Step 1: User tries to speak but microphone is blocked
  console.log('Step 1: Microphone access denied');
  try {
    // Simulate microphone error
    throw new Error('NotAllowedError: Permission denied');
  } catch (error) {
    const response = errorRecovery.handleMicrophoneError(error as Error);
    console.log('Response:', response.text);
  }
  console.log('');
  
  // Step 2: User enables microphone, but speech is unclear
  console.log('Step 2: Unclear speech (low confidence)');
  const response2 = errorRecovery.handleRecognitionFailure(
    'show me the stuff',
    0.5,
    mockContext
  );
  console.log('Response:', response2.text);
  console.log('');
  
  // Step 3: User repeats, but command is invalid
  console.log('Step 3: Invalid command');
  const response3 = errorRecovery.handleInvalidCommand(
    'show me the stuff',
    null,
    mockContext
  );
  console.log('Response:', response3.text);
  console.log('Suggestions:', response3.visualData.suggestions.slice(0, 2));
  console.log('');
  
  // Step 4: User says valid command, but network fails
  console.log('Step 4: Network error during processing');
  const response4 = errorRecovery.handleNetworkError('intent_parsing', mockContext);
  console.log('Response:', response4.text);
  console.log('');
  
  // Step 5: Network recovers, command succeeds, but TTS quota exhausted
  console.log('Step 5: Command succeeds but TTS quota exhausted');
  const response5 = errorRecovery.handleQuotaExhaustion(
    "I found 5 health records for Max.",
    mockContext
  );
  console.log('Display Text:', response5.displayText);
  console.log('Audio Available:', response5.audioUrl !== null);
  console.log('');
  
  // Step 6: Check error statistics
  console.log('Step 6: Error statistics');
  const stats = errorRecovery.getErrorStats();
  console.log('Total errors tracked:');
  stats.forEach((count, errorType) => {
    if (count > 0) {
      console.log(`  ${errorType}: ${count}`);
    }
  });
}

// ============================================================================
// Run All Examples
// ============================================================================

export async function runAllExamples() {
  example1_BasicSetup();
  example2_RecognitionFailures();
  example3_NetworkErrors();
  example4_InvalidCommands();
  example5_QuotaExhaustion();
  example6_TTSFailures();
  example7_MicrophoneErrors();
  example8_RetryLogic();
  example9_ErrorStatistics();
  await example10_VoiceRecognitionIntegration();
  await example11_CompleteFlow();
  
  console.log('\n=== All Examples Complete ===');
}

// Run examples if this file is executed directly
if (require.main === module) {
  runAllExamples().catch(console.error);
}
