/**
 * DialogManager Service
 * Feature: jojo-voice-assistant-enhanced
 * 
 * Manages multi-turn conversation flows for complex voice interactions.
 * Handles missing parameter collection, confirmation dialogs, clarification requests,
 * and cancellation handling.
 * 
 * Requirements: 5.1, 5.6, 11.2, 12.2
 */

import { ParsedIntent, CommandAction, ConversationContext, Entity, EntityType } from './types';

// ============================================================================
// Types
// ============================================================================

export interface DialogState {
  dialogId: string;
  type: DialogType;
  intent: ParsedIntent;
  requiredParameters: ParameterDefinition[];
  collectedParameters: Record<string, any>;
  currentParameter: string | null;
  turnCount: number;
  maxTurns: number;
  isComplete: boolean;
  isCancelled: boolean;
  confirmationRequired: boolean;
  confirmationReceived: boolean;
}

export enum DialogType {
  DATA_ENTRY = "data_entry",
  APPOINTMENT_BOOKING = "appointment_booking",
  CONFIRMATION = "confirmation",
  CLARIFICATION = "clarification",
  PARAMETER_COLLECTION = "parameter_collection"
}

export interface ParameterDefinition {
  name: string;
  type: EntityType | "string" | "number" | "boolean" | "date";
  required: boolean;
  prompt: string;
  validationFn?: (value: any) => boolean;
  validationError?: string;
  examples?: string[];
}

export interface DialogPrompt {
  text: string;
  type: "question" | "confirmation" | "clarification" | "error";
  parameter?: string;
  suggestions?: string[];
}

export interface DialogResult {
  success: boolean;
  intent: ParsedIntent;
  collectedParameters: Record<string, any>;
  cancelled: boolean;
  error?: string;
}

// ============================================================================
// DialogManager Class
// ============================================================================

export class DialogManager {
  private activeDialogs: Map<string, DialogState> = new Map();
  private dialogHistory: DialogState[] = [];
  private maxDialogHistory = 50;

  /**
   * Start a new multi-turn dialog
   */
  startDialog(
    intent: ParsedIntent,
    requiredParameters: ParameterDefinition[],
    type: DialogType = DialogType.PARAMETER_COLLECTION
  ): DialogState {
    const dialogId = this.generateDialogId();
    
    const dialogState: DialogState = {
      dialogId,
      type,
      intent,
      requiredParameters,
      collectedParameters: { ...intent.parameters },
      currentParameter: null,
      turnCount: 0,
      maxTurns: 10, // Prevent infinite loops
      isComplete: false,
      isCancelled: false,
      confirmationRequired: intent.requiresConfirmation,
      confirmationReceived: false
    };

    this.activeDialogs.set(dialogId, dialogState);
    return dialogState;
  }

  /**
   * Process user input for an active dialog
   */
  processDialogTurn(
    dialogId: string,
    userInput: string,
    extractedEntities: Entity[]
  ): DialogPrompt | null {
    const dialog = this.activeDialogs.get(dialogId);
    if (!dialog) {
      return null;
    }

    dialog.turnCount++;

    // Check for cancellation keywords
    if (this.isCancellationIntent(userInput)) {
      return this.handleCancellation(dialog);
    }

    // Check for max turns exceeded
    if (dialog.turnCount >= dialog.maxTurns) {
      return this.handleMaxTurnsExceeded(dialog);
    }

    // Handle confirmation dialog
    if (dialog.confirmationRequired && !dialog.confirmationReceived) {
      return this.handleConfirmation(dialog, userInput);
    }

    // Collect missing parameters
    const missingParams = this.getMissingParameters(dialog);
    if (missingParams.length > 0) {
      return this.collectParameter(dialog, userInput, extractedEntities, missingParams);
    }

    // All parameters collected
    dialog.isComplete = true;
    return null;
  }

  /**
   * Get the next prompt for the dialog
   */
  getNextPrompt(dialogId: string): DialogPrompt | null {
    const dialog = this.activeDialogs.get(dialogId);
    if (!dialog) {
      return null;
    }

    // Check if confirmation is needed
    if (dialog.confirmationRequired && !dialog.confirmationReceived) {
      return this.generateConfirmationPrompt(dialog);
    }

    // Check for missing parameters
    const missingParams = this.getMissingParameters(dialog);
    if (missingParams.length > 0) {
      const nextParam = missingParams[0];
      dialog.currentParameter = nextParam.name;
      return {
        text: nextParam.prompt,
        type: "question",
        parameter: nextParam.name,
        suggestions: nextParam.examples
      };
    }

    return null;
  }

  /**
   * Complete a dialog and return the result
   */
  completeDialog(dialogId: string): DialogResult {
    const dialog = this.activeDialogs.get(dialogId);
    if (!dialog) {
      return {
        success: false,
        intent: {} as ParsedIntent,
        collectedParameters: {},
        cancelled: false,
        error: "Dialog not found"
      };
    }

    // Update intent with collected parameters
    const updatedIntent: ParsedIntent = {
      ...dialog.intent,
      parameters: {
        ...dialog.intent.parameters,
        ...dialog.collectedParameters
      }
    };

    const result: DialogResult = {
      success: dialog.isComplete && !dialog.isCancelled,
      intent: updatedIntent,
      collectedParameters: dialog.collectedParameters,
      cancelled: dialog.isCancelled,
      error: dialog.isCancelled ? "Dialog cancelled by user" : undefined
    };

    // Move to history and remove from active
    this.dialogHistory.push(dialog);
    if (this.dialogHistory.length > this.maxDialogHistory) {
      this.dialogHistory.shift();
    }
    this.activeDialogs.delete(dialogId);

    return result;
  }

  /**
   * Cancel an active dialog
   */
  cancelDialog(dialogId: string): void {
    const dialog = this.activeDialogs.get(dialogId);
    if (dialog) {
      dialog.isCancelled = true;
      dialog.isComplete = false;
    }
  }

  /**
   * Check if a dialog is active
   */
  hasActiveDialog(dialogId: string): boolean {
    return this.activeDialogs.has(dialogId);
  }

  /**
   * Get active dialog state
   */
  getDialogState(dialogId: string): DialogState | undefined {
    return this.activeDialogs.get(dialogId);
  }

  /**
   * Get all active dialogs
   */
  getActiveDialogs(): DialogState[] {
    return Array.from(this.activeDialogs.values());
  }

  /**
   * Clear all active dialogs
   */
  clearAllDialogs(): void {
    this.activeDialogs.clear();
  }

  // ============================================================================
  // Private Helper Methods
  // ============================================================================

  private generateDialogId(): string {
    return `dialog_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private getMissingParameters(dialog: DialogState): ParameterDefinition[] {
    return dialog.requiredParameters.filter(param => {
      if (!param.required) return false;
      const value = dialog.collectedParameters[param.name];
      return value === undefined || value === null || value === '';
    });
  }

  private isCancellationIntent(userInput: string): boolean {
    const cancellationKeywords = [
      'cancel',
      'stop',
      'nevermind',
      'never mind',
      'forget it',
      'no thanks',
      "that's wrong",
      'thats wrong',
      'incorrect',
      'abort',
      'quit',
      'exit'
    ];

    const normalizedInput = userInput.toLowerCase().trim();
    return cancellationKeywords.some(keyword => normalizedInput.includes(keyword));
  }

  private handleCancellation(dialog: DialogState): DialogPrompt {
    dialog.isCancelled = true;
    dialog.isComplete = false;

    return {
      text: "Okay, I've cancelled that. What would you like to do instead?",
      type: "confirmation",
      suggestions: ["Start over", "Try something else", "Go back"]
    };
  }

  private handleMaxTurnsExceeded(dialog: DialogState): DialogPrompt {
    dialog.isCancelled = true;
    dialog.isComplete = false;

    return {
      text: "I'm having trouble understanding. Let's start over. What would you like to do?",
      type: "error",
      suggestions: ["Try again", "Get help", "Cancel"]
    };
  }

  private handleConfirmation(dialog: DialogState, userInput: string): DialogPrompt | null {
    const isConfirmed = this.isConfirmationResponse(userInput);
    const isDenied = this.isDenialResponse(userInput);

    if (isConfirmed) {
      dialog.confirmationReceived = true;
      // Continue to parameter collection if needed
      const missingParams = this.getMissingParameters(dialog);
      if (missingParams.length === 0) {
        dialog.isComplete = true;
        return null;
      }
      return this.getNextPrompt(dialog.dialogId);
    } else if (isDenied) {
      return this.handleCancellation(dialog);
    } else {
      // Unclear response, ask again
      return this.generateConfirmationPrompt(dialog);
    }
  }

  private isConfirmationResponse(userInput: string): boolean {
    const confirmationKeywords = [
      'yes',
      'yeah',
      'yep',
      'correct',
      'right',
      'that\'s right',
      'thats right',
      'affirmative',
      'confirm',
      'ok',
      'okay',
      'sure',
      'proceed',
      'go ahead',
      'continue'
    ];

    const normalizedInput = userInput.toLowerCase().trim();
    return confirmationKeywords.some(keyword => normalizedInput.includes(keyword));
  }

  private isDenialResponse(userInput: string): boolean {
    const denialKeywords = [
      'no',
      'nope',
      'nah',
      'incorrect',
      'wrong',
      'not right',
      'that\'s wrong',
      'thats wrong',
      'negative',
      'deny',
      'cancel'
    ];

    const normalizedInput = userInput.toLowerCase().trim();
    return denialKeywords.some(keyword => normalizedInput.includes(keyword));
  }

  private generateConfirmationPrompt(dialog: DialogState): DialogPrompt {
    const summary = this.generateParameterSummary(dialog);
    
    return {
      text: `Let me confirm: ${summary}. Is this correct?`,
      type: "confirmation",
      suggestions: ["Yes, that's correct", "No, that's wrong", "Cancel"]
    };
  }

  private generateParameterSummary(dialog: DialogState): string {
    const params = dialog.collectedParameters;
    const parts: string[] = [];

    // Generate human-readable summary based on dialog type
    switch (dialog.type) {
      case DialogType.DATA_ENTRY:
        if (params.petName) parts.push(`for ${params.petName}`);
        if (params.amount) parts.push(`${params.amount} ${params.unit || ''}`);
        if (params.foodType) parts.push(`of ${params.foodType}`);
        if (params.time) parts.push(`at ${this.formatTime(params.time)}`);
        break;

      case DialogType.APPOINTMENT_BOOKING:
        if (params.petName) parts.push(`for ${params.petName}`);
        if (params.date) parts.push(`on ${this.formatDate(params.date)}`);
        if (params.time) parts.push(`at ${params.time}`);
        if (params.clinic) parts.push(`at ${params.clinic}`);
        if (params.reason) parts.push(`for ${params.reason}`);
        break;

      default:
        // Generic summary
        Object.entries(params).forEach(([key, value]) => {
          if (value) parts.push(`${key}: ${value}`);
        });
    }

    return parts.join(', ') || 'the information you provided';
  }

  private collectParameter(
    dialog: DialogState,
    userInput: string,
    extractedEntities: Entity[],
    missingParams: ParameterDefinition[]
  ): DialogPrompt | null {
    const currentParam = missingParams[0];
    
    // Try to extract the parameter from user input
    const extractedValue = this.extractParameterValue(
      currentParam,
      userInput,
      extractedEntities
    );

    if (extractedValue !== null) {
      // Validate the extracted value
      if (currentParam.validationFn && !currentParam.validationFn(extractedValue)) {
        return {
          text: currentParam.validationError || `That doesn't seem right. ${currentParam.prompt}`,
          type: "error",
          parameter: currentParam.name,
          suggestions: currentParam.examples
        };
      }

      // Store the parameter
      dialog.collectedParameters[currentParam.name] = extractedValue;
      dialog.currentParameter = null;

      // Check if there are more parameters needed
      const stillMissing = this.getMissingParameters(dialog);
      if (stillMissing.length > 0) {
        const nextParam = stillMissing[0];
        dialog.currentParameter = nextParam.name;
        return {
          text: nextParam.prompt,
          type: "question",
          parameter: nextParam.name,
          suggestions: nextParam.examples
        };
      }

      // All parameters collected, check if confirmation needed
      if (dialog.confirmationRequired && !dialog.confirmationReceived) {
        return this.generateConfirmationPrompt(dialog);
      }

      // Dialog complete
      dialog.isComplete = true;
      return null;
    } else {
      // Could not extract parameter, ask again with clarification
      return {
        text: `I didn't catch that. ${currentParam.prompt}`,
        type: "clarification",
        parameter: currentParam.name,
        suggestions: currentParam.examples
      };
    }
  }

  private extractParameterValue(
    param: ParameterDefinition,
    userInput: string,
    entities: Entity[]
  ): any {
    // Try to find matching entity
    const matchingEntity = entities.find(e => {
      if (typeof param.type === 'string') {
        // Custom type matching
        return e.type.toString().toLowerCase() === param.type.toLowerCase();
      } else {
        // EntityType enum matching
        return e.type === param.type;
      }
    });

    if (matchingEntity) {
      return matchingEntity.resolvedValue || matchingEntity.value;
    }

    // Fallback: try to extract from raw input based on parameter type
    return this.extractFromRawInput(param, userInput);
  }

  private extractFromRawInput(param: ParameterDefinition, userInput: string): any {
    const normalizedInput = userInput.trim();

    switch (param.type) {
      case 'number':
        const numberMatch = normalizedInput.match(/\d+(\.\d+)?/);
        return numberMatch ? parseFloat(numberMatch[0]) : null;

      case 'boolean':
        if (this.isConfirmationResponse(normalizedInput)) return true;
        if (this.isDenialResponse(normalizedInput)) return false;
        return null;

      case 'date':
        // Simple date extraction (could be enhanced with a date parsing library)
        const dateMatch = normalizedInput.match(/\d{1,2}[/-]\d{1,2}[/-]\d{2,4}/);
        return dateMatch ? new Date(dateMatch[0]) : null;

      case 'string':
      default:
        // Return the input as-is if it's not empty
        return normalizedInput.length > 0 ? normalizedInput : null;
    }
  }

  private formatTime(time: any): string {
    if (time instanceof Date) {
      return time.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
    }
    return String(time);
  }

  private formatDate(date: any): string {
    if (date instanceof Date) {
      return date.toLocaleDateString('en-US', { 
        weekday: 'long', 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      });
    }
    return String(date);
  }
}

// ============================================================================
// Singleton Instance
// ============================================================================

export const dialogManager = new DialogManager();
