/**
 * Error Recovery Manager for JoJo Voice Assistant
 * Handles recognition failures, network errors, invalid commands, and quota exhaustion
 * Feature: jojo-voice-assistant-enhanced
 * Requirements: 12.3, 12.4, 12.5, 12.6, 15.4
 */

import { ParsedIntent, ConversationContext, Response, CommandAction } from './types';
import { ResponseComposerService } from './responseComposer';

// ============================================================================
// Error Types
// ============================================================================

export enum ErrorType {
  RECOGNITION_FAILURE = 'recognition_failure',
  NETWORK_ERROR = 'network_error',
  INVALID_COMMAND = 'invalid_command',
  QUOTA_EXHAUSTED = 'quota_exhausted',
  TTS_API_FAILURE = 'tts_api_failure',
  MICROPHONE_ACCESS = 'microphone_access',
  UNKNOWN = 'unknown'
}

export interface RecoveryStrategy {
  type: ErrorType;
  message: string;
  suggestedAction: string;
  fallbackResponse: Response;
  retryable: boolean;
  maxRetries: number;
}

export interface ErrorContext {
  errorType: ErrorType;
  originalError: Error;
  attemptCount: number;
  userInput?: string;
  intent?: ParsedIntent;
  context: ConversationContext;
}

// ============================================================================
// Error Recovery Manager
// ============================================================================

export class ErrorRecoveryManager {
  private responseComposer: ResponseComposerService;
  private errorHistory: Map<ErrorType, number> = new Map();
  private retryAttempts: Map<string, number> = new Map();
  private readonly MAX_RETRY_ATTEMPTS = 3;
  private readonly ERROR_HISTORY_WINDOW = 5 * 60 * 1000; // 5 minutes

  constructor(responseComposer: ResponseComposerService) {
    this.responseComposer = responseComposer;
    this.initializeErrorTracking();
  }

  // ============================================================================
  // Public Methods
  // ============================================================================

  /**
   * Handle recognition failure and provide recovery strategy
   * Requirement 12.3: Recognition failure recovery
   */
  handleRecognitionFailure(
    userInput: string | null,
    confidence: number,
    context: ConversationContext
  ): Response {
    const errorType = ErrorType.RECOGNITION_FAILURE;
    this.trackError(errorType);

    // Determine if this is a repeated failure
    const attemptCount = this.getRetryCount('recognition');
    
    if (attemptCount >= this.MAX_RETRY_ATTEMPTS) {
      // Too many failures, suggest alternative input method
      return {
        text: "I'm having trouble understanding you. Would you like to try typing your request instead?",
        displayText: "Speech recognition failed after multiple attempts. Please try typing or check your microphone.",
        visualData: {
          errorType: 'recognition_failure',
          suggestion: 'Use text input or check microphone settings'
        },
        audioUrl: null,
        priority: 'high'
      };
    }

    // First or second attempt - ask user to repeat
    if (confidence < 0.5 || !userInput) {
      this.incrementRetryCount('recognition');
      return {
        text: "Sorry, I didn't catch that. Could you please repeat?",
        displayText: "Speech not recognized. Please try again.",
        visualData: {
          errorType: 'recognition_failure',
          confidence,
          attemptCount: attemptCount + 1
        },
        audioUrl: null,
        priority: 'normal'
      };
    }

    // Low confidence - repeat what was heard and ask for confirmation
    this.incrementRetryCount('recognition');
    return {
      text: `I heard "${userInput}", but I'm not sure. Is that correct?`,
      displayText: `Low confidence (${Math.round(confidence * 100)}%): "${userInput}"`,
      visualData: {
        errorType: 'recognition_failure',
        confidence,
        userInput,
        requiresConfirmation: true
      },
      audioUrl: null,
      priority: 'normal'
    };
  }

  /**
   * Handle network connectivity errors
   * Requirement 12.5: Network connectivity error handling
   */
  handleNetworkError(
    operation: string,
    context: ConversationContext
  ): Response {
    const errorType = ErrorType.NETWORK_ERROR;
    this.trackError(errorType);

    const isOnline = navigator.onLine;
    
    if (!isOnline) {
      return {
        text: "It looks like you're offline. Voice features require an internet connection.",
        displayText: "No internet connection. Please check your network and try again.",
        visualData: {
          errorType: 'network_error',
          isOnline: false,
          operation
        },
        audioUrl: null,
        priority: 'high'
      };
    }

    // Network is available but request failed
    const attemptCount = this.getRetryCount(`network_${operation}`);
    
    if (attemptCount >= this.MAX_RETRY_ATTEMPTS) {
      return {
        text: "I'm having trouble connecting to the server. Please try again later.",
        displayText: "Network error: Unable to reach server after multiple attempts.",
        visualData: {
          errorType: 'network_error',
          operation,
          attemptCount
        },
        audioUrl: null,
        priority: 'high'
      };
    }

    this.incrementRetryCount(`network_${operation}`);
    return {
      text: "Connection issue. Let me try that again.",
      displayText: `Network error during ${operation}. Retrying...`,
      visualData: {
        errorType: 'network_error',
        operation,
        attemptCount: attemptCount + 1,
        retryable: true
      },
      audioUrl: null,
      priority: 'normal'
    };
  }

  /**
   * Handle invalid commands and suggest alternatives
   * Requirement 12.6: Invalid command suggestions
   */
  handleInvalidCommand(
    userInput: string,
    intent: ParsedIntent | null,
    context: ConversationContext
  ): Response {
    const errorType = ErrorType.INVALID_COMMAND;
    this.trackError(errorType);

    // Generate suggestions based on context and input
    const suggestions = this.generateCommandSuggestions(userInput, context);
    
    if (suggestions.length === 0) {
      return {
        text: "I'm not sure what you want me to do. Try saying 'help' to see what I can do.",
        displayText: `Invalid command: "${userInput}". Say "help" for available commands.`,
        visualData: {
          errorType: 'invalid_command',
          userInput,
          helpAvailable: true
        },
        audioUrl: null,
        priority: 'normal'
      };
    }

    // Provide specific suggestions
    const suggestionText = suggestions.slice(0, 3).map(s => `"${s}"`).join(', or ');
    return {
      text: `I'm not sure about that. Did you mean ${suggestionText}?`,
      displayText: `Invalid command. Suggestions: ${suggestions.join(', ')}`,
      visualData: {
        errorType: 'invalid_command',
        userInput,
        suggestions
      },
      audioUrl: null,
      priority: 'normal'
    };
  }

  /**
   * Handle TTS quota exhaustion
   * Requirement 15.4: Quota exhaustion fallback
   */
  handleQuotaExhaustion(
    text: string,
    context: ConversationContext
  ): Response {
    const errorType = ErrorType.QUOTA_EXHAUSTED;
    this.trackError(errorType);

    return {
      text: '', // No audio
      displayText: text,
      visualData: {
        errorType: 'quota_exhausted',
        message: 'Voice quota exhausted. Showing text response only.',
        textOnly: true
      },
      audioUrl: null,
      priority: 'low'
    };
  }

  /**
   * Handle TTS API failures
   * Requirement 12.4: TTS API failure fallback
   */
  handleTTSFailure(
    text: string,
    error: Error,
    context: ConversationContext
  ): Response {
    const errorType = ErrorType.TTS_API_FAILURE;
    this.trackError(errorType);

    return {
      text: '', // No audio
      displayText: text,
      visualData: {
        errorType: 'tts_api_failure',
        message: 'Voice synthesis unavailable. Showing text response.',
        error: error.message
      },
      audioUrl: null,
      priority: 'normal'
    };
  }

  /**
   * Handle microphone access errors
   */
  handleMicrophoneError(error: Error): Response {
    const errorType = ErrorType.MICROPHONE_ACCESS;
    this.trackError(errorType);

    return {
      text: "I need access to your microphone to hear you. Please check your browser permissions.",
      displayText: "Microphone access denied. Please enable microphone permissions in your browser settings.",
      visualData: {
        errorType: 'microphone_access',
        error: error.message,
        instructions: 'Click the microphone icon in your browser address bar to enable access'
      },
      audioUrl: null,
      priority: 'high'
    };
  }

  /**
   * Determine if an error is retryable
   */
  isRetryable(errorType: ErrorType): boolean {
    const retryableErrors = [
      ErrorType.RECOGNITION_FAILURE,
      ErrorType.NETWORK_ERROR
    ];
    return retryableErrors.includes(errorType);
  }

  /**
   * Reset retry counter for a specific operation
   */
  resetRetryCount(operation: string): void {
    this.retryAttempts.delete(operation);
  }

  /**
   * Get error statistics for monitoring
   */
  getErrorStats(): Map<ErrorType, number> {
    return new Map(this.errorHistory);
  }

  /**
   * Clear error history
   */
  clearErrorHistory(): void {
    this.errorHistory.clear();
    this.retryAttempts.clear();
  }

  // ============================================================================
  // Private Methods
  // ============================================================================

  private initializeErrorTracking(): void {
    // Initialize error counters
    Object.values(ErrorType).forEach(type => {
      this.errorHistory.set(type as ErrorType, 0);
    });

    // Periodically clean up old retry attempts
    setInterval(() => {
      this.cleanupRetryAttempts();
    }, this.ERROR_HISTORY_WINDOW);
  }

  private trackError(errorType: ErrorType): void {
    const currentCount = this.errorHistory.get(errorType) || 0;
    this.errorHistory.set(errorType, currentCount + 1);
  }

  private getRetryCount(operation: string): number {
    return this.retryAttempts.get(operation) || 0;
  }

  private incrementRetryCount(operation: string): void {
    const currentCount = this.getRetryCount(operation);
    this.retryAttempts.set(operation, currentCount + 1);
  }

  private cleanupRetryAttempts(): void {
    // Reset all retry attempts after the error history window
    this.retryAttempts.clear();
  }

  private generateCommandSuggestions(
    userInput: string,
    context: ConversationContext
  ): string[] {
    const suggestions: string[] = [];
    const lowerInput = userInput.toLowerCase();

    // Navigation suggestions
    if (lowerInput.includes('go') || lowerInput.includes('show') || lowerInput.includes('open')) {
      suggestions.push('Go to appointments');
      suggestions.push('Show all pets');
      suggestions.push('Open medication tracker');
    }

    // Data entry suggestions
    if (lowerInput.includes('log') || lowerInput.includes('add') || lowerInput.includes('record')) {
      suggestions.push('Log feeding for [pet name]');
      suggestions.push('Add medication reminder');
      suggestions.push('Record weight for [pet name]');
    }

    // Query suggestions
    if (lowerInput.includes('when') || lowerInput.includes('what') || lowerInput.includes('how')) {
      suggestions.push("When is [pet name]'s next appointment?");
      suggestions.push("What medications does [pet name] need?");
      suggestions.push("Show feeding history for [pet name]");
    }

    // Context-aware suggestions based on current page
    if (context.currentPage.includes('appointment')) {
      suggestions.push('Schedule a vet appointment');
      suggestions.push('Cancel appointment');
    } else if (context.currentPage.includes('health')) {
      suggestions.push("Show [pet name]'s health records");
      suggestions.push("What's [pet name]'s health score?");
    }

    // If no specific suggestions, provide general help
    if (suggestions.length === 0) {
      suggestions.push('Help');
      suggestions.push('What can you do?');
      suggestions.push('Show all pets');
    }

    return suggestions;
  }
}

// ============================================================================
// Singleton Instance
// ============================================================================

let errorRecoveryManagerInstance: ErrorRecoveryManager | null = null;

export function getErrorRecoveryManager(
  responseComposer: ResponseComposerService
): ErrorRecoveryManager {
  if (!errorRecoveryManagerInstance) {
    errorRecoveryManagerInstance = new ErrorRecoveryManager(responseComposer);
  }
  return errorRecoveryManagerInstance;
}

export function resetErrorRecoveryManager(): void {
  errorRecoveryManagerInstance = null;
}
