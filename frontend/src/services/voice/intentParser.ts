/**
 * Intent Parser Service
 * Feature: jojo-voice-assistant-enhanced
 * 
 * Parses user voice commands into structured intents using Gemini API.
 * Extracts entities, detects priority, and validates commands.
 */

import { api } from '@/lib/api';
import {
  IntentParser,
  ParsedIntent,
  ConversationContext,
  ValidationResult,
  Entity,
  CommandAction,
  EntityType
} from './types';

/**
 * IntentParserService implementation
 * Uses Gemini API (via JoJo backend) for natural language understanding
 */
export class IntentParserService implements IntentParser {
  private urgentKeywords = [
    'emergency', 'urgent', 'help', 'now', 'immediately', 'asap',
    'critical', 'serious', 'bleeding', 'choking', 'poisoned'
  ];

  private highPriorityKeywords = [
    'pain', 'sick', 'vomiting', 'diarrhea', 'not eating',
    'lethargic', 'limping', 'coughing', 'sneezing'
  ];

  /**
   * Parse transcription into structured command intent
   */
  async parseIntent(
    transcription: string,
    context: ConversationContext
  ): Promise<ParsedIntent> {
    try {
      // Build context-aware prompt for Gemini
      const prompt = this.buildGeminiPrompt(transcription, context);
      
      // Call JoJo API (which uses Gemini) for intent extraction
      const response = await api.jojoChat(
        prompt,
        undefined, // conversation_id - let backend manage
        context.activePet || undefined
      );

      if (response.error || !response.data) {
        throw new Error(response.error || 'Failed to parse intent');
      }

      // Parse Gemini response into structured intent
      const intent = this.parseGeminiResponse(
        response.data,
        transcription,
        context
      );

      return intent;
    } catch (error) {
      console.error('Intent parsing error:', error);
      
      // Fallback: create basic intent from transcription
      return this.createFallbackIntent(transcription, context);
    }
  }

  /**
   * Validate if command is executable
   */
  validateIntent(intent: ParsedIntent): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Check if action is valid
    if (!Object.values(CommandAction).includes(intent.action)) {
      errors.push(`Invalid action: ${intent.action}`);
    }

    // Check required parameters based on action
    const requiredParams = this.getRequiredParameters(intent.action, intent.target);
    for (const param of requiredParams) {
      if (!intent.parameters[param]) {
        errors.push(`Missing required parameter: ${param}`);
      }
    }

    // Check confidence threshold
    if (intent.confidence < 0.5) {
      warnings.push('Low confidence in intent interpretation');
    }

    // Check for ambiguities
    if (intent.ambiguities.length > 0) {
      warnings.push(`Ambiguous elements: ${intent.ambiguities.join(', ')}`);
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings
    };
  }

  /**
   * Extract entities from transcription
   */
  extractEntities(transcription: string): Entity[] {
    const entities: Entity[] = [];
    const lowerText = transcription.toLowerCase();

    // Extract dates (simple patterns)
    const datePatterns = [
      /today/gi,
      /tomorrow/gi,
      /yesterday/gi,
      /\d{1,2}\/\d{1,2}\/\d{2,4}/g,
      /\d{1,2}-\d{1,2}-\d{2,4}/g
    ];

    datePatterns.forEach(pattern => {
      const matches = transcription.match(pattern);
      if (matches) {
        matches.forEach(match => {
          entities.push({
            type: EntityType.DATE,
            value: match,
            confidence: 0.9,
            resolvedValue: this.parseDate(match)
          });
        });
      }
    });

    // Extract times
    const timePattern = /\d{1,2}:\d{2}\s*(am|pm)?/gi;
    const timeMatches = transcription.match(timePattern);
    if (timeMatches) {
      timeMatches.forEach(match => {
        entities.push({
          type: EntityType.TIME,
          value: match,
          confidence: 0.9,
          resolvedValue: match
        });
      });
    }

    // Extract amounts with units
    const amountPattern = /(\d+\.?\d*)\s*(kg|g|mg|ml|l|cups?|tablets?|pills?)/gi;
    const amountMatches = [...transcription.matchAll(new RegExp(amountPattern))];
    amountMatches.forEach(match => {
      entities.push({
        type: EntityType.AMOUNT,
        value: match[1],
        confidence: 0.95,
        resolvedValue: parseFloat(match[1])
      });
      entities.push({
        type: EntityType.UNIT,
        value: match[2],
        confidence: 0.95,
        resolvedValue: match[2].toLowerCase()
      });
    });

    // Extract activity types
    const activityKeywords = [
      'walk', 'run', 'play', 'training', 'grooming', 'bath',
      'litter box', 'cage cleaning', 'water change', 'feeding'
    ];
    activityKeywords.forEach(keyword => {
      if (lowerText.includes(keyword)) {
        entities.push({
          type: EntityType.ACTIVITY_TYPE,
          value: keyword,
          confidence: 0.85,
          resolvedValue: keyword
        });
      }
    });

    return entities;
  }

  /**
   * Build context-aware prompt for Gemini
   */
  private buildGeminiPrompt(
    transcription: string,
    context: ConversationContext
  ): string {
    const parts: string[] = [];

    // Add instruction
    parts.push('Parse this voice command into a structured intent:');
    parts.push(`Command: "${transcription}"`);
    parts.push('');

    // Add context
    if (context.activePet) {
      parts.push(`Active Pet: ${context.activePet}`);
    }
    if (context.currentPage) {
      parts.push(`Current Page: ${context.currentPage}`);
    }
    if (context.previousIntents.length > 0) {
      const lastIntent = context.previousIntents[context.previousIntents.length - 1];
      parts.push(`Previous Action: ${lastIntent.action} - ${lastIntent.target}`);
    }
    parts.push('');

    // Add available actions
    parts.push('Available Actions:');
    parts.push('- navigate: Go to a page (appointments, health, medications, pets, feeding)');
    parts.push('- log_data: Record information (feeding, medication, weight, activity)');
    parts.push('- query: Ask for information (appointments, medications, health score, history)');
    parts.push('- schedule: Book an appointment');
    parts.push('- cancel: Cancel an appointment');
    parts.push('- help: Get assistance');
    parts.push('');

    // Add format instruction
    parts.push('Respond with JSON format:');
    parts.push('{');
    parts.push('  "action": "navigate|log_data|query|schedule|cancel|help",');
    parts.push('  "target": "specific target (e.g., appointments, feeding, health)",');
    parts.push('  "parameters": {"key": "value"},');
    parts.push('  "confidence": 0.0-1.0,');
    parts.push('  "requiresConfirmation": true|false,');
    parts.push('  "ambiguities": ["list of unclear parts"]');
    parts.push('}');

    return parts.join('\n');
  }

  /**
   * Parse Gemini API response into structured intent
   */
  private parseGeminiResponse(
    jojoResponse: any,
    originalTranscription: string,
    context: ConversationContext
  ): ParsedIntent {
    // Try to extract JSON from response
    let intentData: any;
    
    try {
      // Look for JSON in the response
      const jsonMatch = jojoResponse.response.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        intentData = JSON.parse(jsonMatch[0]);
      } else {
        // Fallback: analyze response text
        intentData = this.analyzeResponseText(jojoResponse.response, originalTranscription);
      }
    } catch (error) {
      console.error('Failed to parse Gemini JSON:', error);
      intentData = this.analyzeResponseText(jojoResponse.response, originalTranscription);
    }

    // Detect priority from transcription
    const priority = this.detectPriority(originalTranscription);

    // Extract entities
    const entities = this.extractEntities(originalTranscription);

    // Generate unique intent ID
    const intentId = `intent_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    return {
      intentId,
      action: this.normalizeAction(intentData.action),
      target: intentData.target || '',
      parameters: intentData.parameters || {},
      confidence: intentData.confidence || 0.7,
      requiresConfirmation: intentData.requiresConfirmation || false,
      priority,
      entities,
      ambiguities: intentData.ambiguities || []
    };
  }

  /**
   * Analyze response text when JSON parsing fails
   */
  private analyzeResponseText(responseText: string, transcription: string): any {
    const lowerResponse = responseText.toLowerCase();
    const lowerTranscription = transcription.toLowerCase();

    // Detect action from keywords
    let action = CommandAction.HELP;
    let target = '';
    const parameters: Record<string, any> = {};

    // Check for help commands first
    if (lowerTranscription.includes('what can you do') || 
        lowerTranscription.includes('help') ||
        lowerTranscription.includes('available commands') ||
        lowerTranscription.includes('voice commands') ||
        lowerTranscription.includes('how do i') ||
        lowerTranscription.includes('how can i')) {
      action = CommandAction.HELP;
      target = 'general';
    } else if (lowerTranscription.includes('go to') || lowerTranscription.includes('show') || 
        lowerTranscription.includes('open') || lowerTranscription.includes('navigate')) {
      action = CommandAction.NAVIGATE;
      
      if (lowerTranscription.includes('appointment')) target = 'appointments';
      else if (lowerTranscription.includes('health')) target = 'health';
      else if (lowerTranscription.includes('medication')) target = 'medications';
      else if (lowerTranscription.includes('feeding')) target = 'feeding';
      else if (lowerTranscription.includes('pet')) target = 'pets';
    } else if (lowerTranscription.includes('log') || lowerTranscription.includes('record') ||
               lowerTranscription.includes('add')) {
      action = CommandAction.LOG_DATA;
      
      if (lowerTranscription.includes('feeding') || lowerTranscription.includes('fed')) {
        target = 'feeding';
      } else if (lowerTranscription.includes('medication') || lowerTranscription.includes('medicine')) {
        target = 'medication';
      } else if (lowerTranscription.includes('weight')) {
        target = 'weight';
      } else if (lowerTranscription.includes('walk') || lowerTranscription.includes('activity')) {
        target = 'activity';
      }
    } else if (lowerTranscription.includes('when') || lowerTranscription.includes('what') ||
               lowerTranscription.includes('how') || lowerTranscription.includes('show me')) {
      action = CommandAction.QUERY;
      
      if (lowerTranscription.includes('appointment')) target = 'appointments';
      else if (lowerTranscription.includes('medication')) target = 'medications';
      else if (lowerTranscription.includes('health')) target = 'health';
      else if (lowerTranscription.includes('feeding')) target = 'feeding';
    } else if (lowerTranscription.includes('schedule') || lowerTranscription.includes('book')) {
      action = CommandAction.SCHEDULE;
      target = 'appointment';
    } else if (lowerTranscription.includes('cancel')) {
      action = CommandAction.CANCEL;
      target = 'appointment';
    }

    return {
      action,
      target,
      parameters,
      confidence: 0.6,
      requiresConfirmation: action !== CommandAction.NAVIGATE && action !== CommandAction.QUERY && action !== CommandAction.HELP,
      ambiguities: []
    };
  }

  /**
   * Create fallback intent when API fails
   */
  private createFallbackIntent(
    transcription: string,
    context: ConversationContext
  ): ParsedIntent {
    const analyzed = this.analyzeResponseText('', transcription);
    const priority = this.detectPriority(transcription);
    const entities = this.extractEntities(transcription);

    return {
      intentId: `fallback_${Date.now()}`,
      action: analyzed.action,
      target: analyzed.target,
      parameters: analyzed.parameters,
      confidence: 0.5,
      requiresConfirmation: true,
      priority,
      entities,
      ambiguities: ['API unavailable - using fallback parsing']
    };
  }

  /**
   * Detect priority from transcription
   */
  private detectPriority(transcription: string): "low" | "normal" | "high" | "urgent" {
    const lowerText = transcription.toLowerCase();

    // Check for urgent keywords
    if (this.urgentKeywords.some(keyword => lowerText.includes(keyword))) {
      return 'urgent';
    }

    // Check for high priority keywords
    if (this.highPriorityKeywords.some(keyword => lowerText.includes(keyword))) {
      return 'high';
    }

    // Check speech characteristics (multiple exclamation marks, all caps)
    if (transcription.includes('!!!') || transcription === transcription.toUpperCase()) {
      return 'high';
    }

    return 'normal';
  }

  /**
   * Normalize action string to CommandAction enum
   */
  private normalizeAction(action: string): CommandAction {
    const normalized = action?.toLowerCase().replace(/[_-]/g, '_');
    
    switch (normalized) {
      case 'navigate':
      case 'go_to':
      case 'show':
        return CommandAction.NAVIGATE;
      case 'log_data':
      case 'log':
      case 'record':
      case 'add':
        return CommandAction.LOG_DATA;
      case 'query':
      case 'get':
      case 'show_me':
      case 'what':
        return CommandAction.QUERY;
      case 'schedule':
      case 'book':
        return CommandAction.SCHEDULE;
      case 'cancel':
      case 'delete':
        return CommandAction.CANCEL;
      case 'update':
      case 'edit':
      case 'modify':
        return CommandAction.UPDATE;
      case 'bulk_action':
      case 'bulk':
      case 'all':
        return CommandAction.BULK_ACTION;
      case 'help':
      default:
        return CommandAction.HELP;
    }
  }

  /**
   * Get required parameters for action/target combination
   */
  private getRequiredParameters(action: CommandAction, target: string): string[] {
    const requirements: Record<string, string[]> = {
      [`${CommandAction.LOG_DATA}_feeding`]: ['petId', 'amount', 'foodType'],
      [`${CommandAction.LOG_DATA}_medication`]: ['petId', 'medicationName', 'dosage'],
      [`${CommandAction.LOG_DATA}_weight`]: ['petId', 'weight', 'unit'],
      [`${CommandAction.LOG_DATA}_activity`]: ['petId', 'activityType'],
      [`${CommandAction.SCHEDULE}_appointment`]: ['petId', 'date', 'clinic'],
      [`${CommandAction.CANCEL}_appointment`]: ['appointmentId'],
      [`${CommandAction.QUERY}_appointments`]: ['petId'],
      [`${CommandAction.QUERY}_medications`]: ['petId'],
      [`${CommandAction.QUERY}_health`]: ['petId']
    };

    return requirements[`${action}_${target}`] || [];
  }

  /**
   * Parse date string into Date object
   */
  private parseDate(dateStr: string): Date {
    const lower = dateStr.toLowerCase();
    const now = new Date();

    if (lower === 'today') {
      return now;
    } else if (lower === 'tomorrow') {
      const tomorrow = new Date(now);
      tomorrow.setDate(tomorrow.getDate() + 1);
      return tomorrow;
    } else if (lower === 'yesterday') {
      const yesterday = new Date(now);
      yesterday.setDate(yesterday.getDate() - 1);
      return yesterday;
    }

    // Try to parse as date string
    const parsed = new Date(dateStr);
    return isNaN(parsed.getTime()) ? now : parsed;
  }
}

// Export singleton instance
export const intentParser = new IntentParserService();

// Factory function for creating intent parser instances
export function createIntentParser(): IntentParser {
  return new IntentParserService();
}
