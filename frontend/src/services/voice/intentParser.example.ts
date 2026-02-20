/**
 * Intent Parser Usage Examples
 * Feature: jojo-voice-assistant-enhanced
 */

import { intentParser } from './intentParser';
import { ConversationContext, CommandAction } from './types';

/**
 * Example 1: Parse a simple navigation command
 */
async function exampleNavigationCommand() {
  const context: ConversationContext = {
    previousIntents: [],
    activePet: null,
    currentPage: 'dashboard',
    recentEntities: []
  };

  const transcription = "Go to appointments";
  const intent = await intentParser.parseIntent(transcription, context);

  console.log('Navigation Intent:', intent);
  // Expected output:
  // {
  //   action: CommandAction.NAVIGATE,
  //   target: 'appointments',
  //   confidence: 0.9,
  //   requiresConfirmation: false,
  //   priority: 'normal'
  // }
}

/**
 * Example 2: Parse a data entry command with context
 */
async function exampleDataEntryWithContext() {
  const context: ConversationContext = {
    previousIntents: [],
    activePet: 'Max',
    currentPage: 'dashboard',
    recentEntities: []
  };

  const transcription = "Log feeding - 2 cups of kibble";
  const intent = await intentParser.parseIntent(transcription, context);

  console.log('Data Entry Intent:', intent);
  // Expected output:
  // {
  //   action: CommandAction.LOG_DATA,
  //   target: 'feeding',
  //   parameters: { amount: 2, unit: 'cups', foodType: 'kibble' },
  //   entities: [
  //     { type: 'AMOUNT', value: '2', confidence: 0.95 },
  //     { type: 'UNIT', value: 'cups', confidence: 0.95 }
  //   ],
  //   confidence: 0.85,
  //   requiresConfirmation: true,
  //   priority: 'normal'
  // }
}

/**
 * Example 3: Parse an urgent query
 */
async function exampleUrgentQuery() {
  const context: ConversationContext = {
    previousIntents: [],
    activePet: 'Bella',
    currentPage: 'health',
    recentEntities: []
  };

  const transcription = "Emergency! When is Bella's next vet appointment?";
  const intent = await intentParser.parseIntent(transcription, context);

  console.log('Urgent Query Intent:', intent);
  // Expected output:
  // {
  //   action: CommandAction.QUERY,
  //   target: 'appointments',
  //   parameters: { petName: 'Bella' },
  //   confidence: 0.9,
  //   requiresConfirmation: false,
  //   priority: 'urgent'  // Detected from 'Emergency!' keyword
  // }
}

/**
 * Example 4: Validate intent before execution
 */
async function exampleValidateIntent() {
  const context: ConversationContext = {
    previousIntents: [],
    activePet: 'Charlie',
    currentPage: 'dashboard',
    recentEntities: []
  };

  const transcription = "Schedule appointment for Charlie";
  const intent = await intentParser.parseIntent(transcription, context);

  // Validate the intent
  const validation = intentParser.validateIntent(intent);

  console.log('Validation Result:', validation);
  // Expected output:
  // {
  //   valid: false,
  //   errors: ['Missing required parameter: date', 'Missing required parameter: clinic'],
  //   warnings: []
  // }

  if (!validation.valid) {
    console.log('Intent is incomplete. Need to ask follow-up questions.');
  }
}

/**
 * Example 5: Extract entities from transcription
 */
function exampleEntityExtraction() {
  const transcription = "Log medication - 5mg of Rimadyl at 3:30 PM today";
  const entities = intentParser.extractEntities(transcription);

  console.log('Extracted Entities:', entities);
  // Expected output:
  // [
  //   { type: 'AMOUNT', value: '5', confidence: 0.95, resolvedValue: 5 },
  //   { type: 'UNIT', value: 'mg', confidence: 0.95, resolvedValue: 'mg' },
  //   { type: 'TIME', value: '3:30 PM', confidence: 0.9, resolvedValue: '3:30 PM' },
  //   { type: 'DATE', value: 'today', confidence: 0.9, resolvedValue: Date(...) }
  // ]
}

/**
 * Example 6: Context-aware follow-up command
 */
async function exampleContextAwareFollowUp() {
  // First command establishes context
  const context1: ConversationContext = {
    previousIntents: [],
    activePet: null,
    currentPage: 'dashboard',
    recentEntities: []
  };

  const transcription1 = "Show me Max's health records";
  const intent1 = await intentParser.parseIntent(transcription1, context1);

  // Update context with first intent
  const context2: ConversationContext = {
    previousIntents: [intent1],
    activePet: 'Max',
    currentPage: 'health',
    recentEntities: intent1.entities
  };

  // Follow-up command uses context
  const transcription2 = "What about his medications?";
  const intent2 = await intentParser.parseIntent(transcription2, context2);

  console.log('Follow-up Intent:', intent2);
  // Expected output:
  // {
  //   action: CommandAction.QUERY,
  //   target: 'medications',
  //   parameters: { petName: 'Max' },  // Resolved from context
  //   confidence: 0.85,
  //   priority: 'normal'
  // }
}

/**
 * Example 7: Bulk action command
 */
async function exampleBulkAction() {
  const context: ConversationContext = {
    previousIntents: [],
    activePet: null,
    currentPage: 'dashboard',
    recentEntities: []
  };

  const transcription = "Log feeding for all pets - 1 cup each";
  const intent = await intentParser.parseIntent(transcription, context);

  console.log('Bulk Action Intent:', intent);
  // Expected output:
  // {
  //   action: CommandAction.BULK_ACTION,
  //   target: 'feeding',
  //   parameters: { amount: 1, unit: 'cup', applyToAll: true },
  //   confidence: 0.8,
  //   requiresConfirmation: true,
  //   priority: 'normal'
  // }
}

/**
 * Example 8: Priority detection from speech characteristics
 */
async function examplePriorityDetection() {
  const context: ConversationContext = {
    previousIntents: [],
    activePet: 'Luna',
    currentPage: 'dashboard',
    recentEntities: []
  };

  // High priority due to health keywords
  const transcription1 = "Luna is vomiting and not eating";
  const intent1 = await intentParser.parseIntent(transcription1, context);
  console.log('Priority:', intent1.priority); // 'high'

  // Urgent priority due to emergency keyword
  const transcription2 = "URGENT - Luna is bleeding!";
  const intent2 = await intentParser.parseIntent(transcription2, context);
  console.log('Priority:', intent2.priority); // 'urgent'

  // Normal priority
  const transcription3 = "Show Luna's feeding history";
  const intent3 = await intentParser.parseIntent(transcription3, context);
  console.log('Priority:', intent3.priority); // 'normal'
}

// Run examples
async function runExamples() {
  console.log('=== Intent Parser Examples ===\n');

  console.log('Example 1: Navigation Command');
  await exampleNavigationCommand();
  console.log('\n');

  console.log('Example 2: Data Entry with Context');
  await exampleDataEntryWithContext();
  console.log('\n');

  console.log('Example 3: Urgent Query');
  await exampleUrgentQuery();
  console.log('\n');

  console.log('Example 4: Validate Intent');
  await exampleValidateIntent();
  console.log('\n');

  console.log('Example 5: Entity Extraction');
  exampleEntityExtraction();
  console.log('\n');

  console.log('Example 6: Context-Aware Follow-up');
  await exampleContextAwareFollowUp();
  console.log('\n');

  console.log('Example 7: Bulk Action');
  await exampleBulkAction();
  console.log('\n');

  console.log('Example 8: Priority Detection');
  await examplePriorityDetection();
}

// Export for testing
export {
  exampleNavigationCommand,
  exampleDataEntryWithContext,
  exampleUrgentQuery,
  exampleValidateIntent,
  exampleEntityExtraction,
  exampleContextAwareFollowUp,
  exampleBulkAction,
  examplePriorityDetection,
  runExamples
};
