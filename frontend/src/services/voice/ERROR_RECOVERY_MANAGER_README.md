# Error Recovery Manager

## Overview

The ErrorRecoveryManager provides comprehensive error handling and recovery strategies for the JoJo Voice Assistant. It handles recognition failures, network errors, invalid commands, quota exhaustion, and TTS API failures with graceful fallbacks and user-friendly messaging.

## Features

- **Recognition Failure Recovery** (Requirement 12.3)
- **Network Connectivity Error Handling** (Requirement 12.5)
- **Invalid Command Suggestions** (Requirement 12.6)
- **Quota Exhaustion Fallback** (Requirement 15.4)
- **TTS API Failure Fallback** (Requirement 12.4)
- **Retry Logic with Limits**
- **Error Statistics Tracking**

## Error Types

```typescript
enum ErrorType {
  RECOGNITION_FAILURE = 'recognition_failure',
  NETWORK_ERROR = 'network_error',
  INVALID_COMMAND = 'invalid_command',
  QUOTA_EXHAUSTED = 'quota_exhausted',
  TTS_API_FAILURE = 'tts_api_failure',
  MICROPHONE_ACCESS = 'microphone_access',
  UNKNOWN = 'unknown'
}
```

## Usage

### Basic Setup

```typescript
import { ErrorRecoveryManager, getErrorRecoveryManager } from './errorRecoveryManager';
import { ResponseComposerService } from './responseComposer';

// Initialize with response composer
const responseComposer = new ResponseComposerService();
const errorRecovery = getErrorRecoveryManager(responseComposer);
```

### Handle Recognition Failures

```typescript
// When speech recognition fails or has low confidence
const response = errorRecovery.handleRecognitionFailure(
  userInput,      // The transcribed text (or null if failed)
  confidence,     // Confidence score (0-1)
  context         // Current conversation context
);

// Response will ask user to repeat or confirm
console.log(response.text); // "Sorry, I didn't catch that. Could you please repeat?"
```

### Handle Network Errors

```typescript
// When API calls fail due to network issues
const response = errorRecovery.handleNetworkError(
  'intent_parsing',  // Operation that failed
  context            // Current conversation context
);

// Response will inform user and suggest retry
console.log(response.text); // "Connection issue. Let me try that again."
```

### Handle Invalid Commands

```typescript
// When user says something JoJo doesn't understand
const response = errorRecovery.handleInvalidCommand(
  userInput,  // What the user said
  intent,     // Parsed intent (or null if unparseable)
  context     // Current conversation context
);

// Response will suggest valid alternatives
console.log(response.text); 
// "I'm not sure about that. Did you mean 'Go to appointments', or 'Show all pets'?"
```

### Handle Quota Exhaustion

```typescript
// When ElevenLabs quota is exhausted
const response = errorRecovery.handleQuotaExhaustion(
  responseText,  // Text that should be displayed
  context        // Current conversation context
);

// Response will show text only (no audio)
console.log(response.displayText); // Shows text without voice
console.log(response.audioUrl);    // null
```

### Handle TTS API Failures

```typescript
// When ElevenLabs API fails
const response = errorRecovery.handleTTSFailure(
  responseText,  // Text that should be displayed
  error,         // The error that occurred
  context        // Current conversation context
);

// Response will fallback to text display
console.log(response.displayText); // Shows text without voice
```

### Handle Microphone Errors

```typescript
// When microphone access is denied
const response = errorRecovery.handleMicrophoneError(error);

// Response will guide user to enable permissions
console.log(response.text);
// "I need access to your microphone to hear you. Please check your browser permissions."
```

## Retry Logic

The ErrorRecoveryManager implements intelligent retry logic:

- **Max Retry Attempts**: 3 attempts per operation
- **Retry Window**: 5 minutes
- **Retryable Errors**: Recognition failures, network errors
- **Non-Retryable Errors**: Quota exhaustion, microphone access denied

```typescript
// Check if error is retryable
if (errorRecovery.isRetryable(ErrorType.RECOGNITION_FAILURE)) {
  // Attempt retry
}

// Reset retry counter after success
errorRecovery.resetRetryCount('recognition');
```

## Error Statistics

Track error occurrences for monitoring and debugging:

```typescript
// Get error statistics
const stats = errorRecovery.getErrorStats();
console.log(stats.get(ErrorType.RECOGNITION_FAILURE)); // Number of recognition failures

// Clear error history
errorRecovery.clearErrorHistory();
```

## Integration Example

### Complete Voice Recognition Flow with Error Handling

```typescript
import { VoiceRecognitionEngine } from './voiceRecognitionEngine';
import { ErrorRecoveryManager, getErrorRecoveryManager } from './errorRecoveryManager';
import { ResponseComposerService } from './responseComposer';

class VoiceAssistant {
  private recognitionEngine: VoiceRecognitionEngine;
  private errorRecovery: ErrorRecoveryManager;
  
  constructor() {
    this.recognitionEngine = new VoiceRecognitionEngine();
    const responseComposer = new ResponseComposerService();
    this.errorRecovery = getErrorRecoveryManager(responseComposer);
    
    this.setupErrorHandling();
  }
  
  private setupErrorHandling() {
    // Handle recognition errors
    this.recognitionEngine.onError((error) => {
      const response = this.errorRecovery.handleRecognitionFailure(
        null,
        0,
        this.getContext()
      );
      this.displayResponse(response);
    });
    
    // Handle low confidence results
    this.recognitionEngine.onFinalResult((text, confidence) => {
      if (confidence < 0.8) {
        const response = this.errorRecovery.handleRecognitionFailure(
          text,
          confidence,
          this.getContext()
        );
        this.displayResponse(response);
      } else {
        this.processCommand(text);
      }
    });
  }
  
  private async processCommand(text: string) {
    try {
      // Parse intent
      const intent = await this.parseIntent(text);
      
      if (!intent) {
        // Invalid command
        const response = this.errorRecovery.handleInvalidCommand(
          text,
          null,
          this.getContext()
        );
        this.displayResponse(response);
        return;
      }
      
      // Execute command
      const result = await this.executeCommand(intent);
      
      // Success - reset retry counter
      this.errorRecovery.resetRetryCount('recognition');
      
    } catch (error) {
      // Network error
      if (error.message.includes('network')) {
        const response = this.errorRecovery.handleNetworkError(
          'command_execution',
          this.getContext()
        );
        this.displayResponse(response);
      }
    }
  }
  
  private async speakResponse(text: string) {
    try {
      // Try TTS
      await this.ttsEngine.synthesize(text);
    } catch (error) {
      if (error.message.includes('quota')) {
        // Quota exhausted
        const response = this.errorRecovery.handleQuotaExhaustion(
          text,
          this.getContext()
        );
        this.displayResponse(response);
      } else {
        // TTS API failure
        const response = this.errorRecovery.handleTTSFailure(
          text,
          error,
          this.getContext()
        );
        this.displayResponse(response);
      }
    }
  }
}
```

## Response Structure

All error recovery methods return a `Response` object:

```typescript
interface Response {
  text: string;           // Text to be spoken (empty if no audio)
  displayText: string;    // Text to display to user
  visualData: any;        // Additional data for UI display
  audioUrl: string | null; // Audio URL (null for errors)
  priority: "low" | "normal" | "high";
}
```

## Context-Aware Suggestions

The ErrorRecoveryManager generates context-aware command suggestions based on:

1. **User Input Keywords**: Analyzes words like "go", "show", "log", "add"
2. **Current Page**: Provides relevant suggestions for the active page
3. **Conversation Context**: Uses recent intents and entities
4. **Common Commands**: Falls back to general help commands

Example suggestions by context:

- **Appointments Page**: "Schedule a vet appointment", "Cancel appointment"
- **Health Page**: "Show [pet name]'s health records", "What's [pet name]'s health score?"
- **General**: "Help", "What can you do?", "Show all pets"

## Best Practices

1. **Always Reset Retry Counters on Success**
   ```typescript
   errorRecovery.resetRetryCount('recognition');
   ```

2. **Check Retryability Before Retrying**
   ```typescript
   if (errorRecovery.isRetryable(errorType)) {
     // Retry logic
   }
   ```

3. **Monitor Error Statistics**
   ```typescript
   const stats = errorRecovery.getErrorStats();
   // Log or display for debugging
   ```

4. **Provide Visual Feedback**
   ```typescript
   const response = errorRecovery.handleNetworkError('api_call', context);
   // Display response.visualData in UI
   ```

5. **Handle Microphone Permissions Early**
   ```typescript
   try {
     await navigator.mediaDevices.getUserMedia({ audio: true });
   } catch (error) {
     const response = errorRecovery.handleMicrophoneError(error);
     displayResponse(response);
   }
   ```

## Error Recovery Strategies

| Error Type | Strategy | Max Retries | Fallback |
|------------|----------|-------------|----------|
| Recognition Failure | Ask to repeat, confirm low confidence | 3 | Suggest text input |
| Network Error | Auto-retry with backoff | 3 | Show offline message |
| Invalid Command | Suggest alternatives | N/A | Show help |
| Quota Exhausted | Text-only mode | N/A | Display text |
| TTS API Failure | Text-only mode | N/A | Display text |
| Microphone Access | Guide to permissions | N/A | Suggest text input |

## Testing

```typescript
import { ErrorRecoveryManager } from './errorRecoveryManager';
import { ResponseComposerService } from './responseComposer';

describe('ErrorRecoveryManager', () => {
  let errorRecovery: ErrorRecoveryManager;
  
  beforeEach(() => {
    const responseComposer = new ResponseComposerService();
    errorRecovery = new ErrorRecoveryManager(responseComposer);
  });
  
  it('should handle recognition failure', () => {
    const response = errorRecovery.handleRecognitionFailure(
      null,
      0,
      mockContext
    );
    expect(response.text).toContain('repeat');
  });
  
  it('should suggest alternatives for invalid commands', () => {
    const response = errorRecovery.handleInvalidCommand(
      'show me stuff',
      null,
      mockContext
    );
    expect(response.visualData.suggestions).toBeDefined();
  });
  
  it('should track error statistics', () => {
    errorRecovery.handleRecognitionFailure(null, 0, mockContext);
    const stats = errorRecovery.getErrorStats();
    expect(stats.get(ErrorType.RECOGNITION_FAILURE)).toBe(1);
  });
});
```

## Related Components

- **ResponseComposer**: Generates user-friendly error messages
- **VoiceRecognitionEngine**: Triggers recognition failure events
- **TTSEngine**: Triggers TTS failure events
- **IntentParser**: Triggers invalid command events
- **NetworkService**: Triggers network error events
