/**
 * DialogManager Usage Examples
 * Feature: jojo-voice-assistant-enhanced
 * 
 * This file demonstrates how to use the DialogManager service
 * for multi-turn conversation flows.
 */

import { dialogManager, DialogType, ParameterDefinition } from './dialogManager';
import { ParsedIntent, CommandAction, EntityType, Entity } from './types';

// ============================================================================
// Example 1: Simple Feeding Log Dialog
// ============================================================================

export function example1_SimpleFeedingLog() {
  console.log('=== Example 1: Simple Feeding Log ===\n');

  // User says: "Log feeding"
  const intent: ParsedIntent = {
    intentId: 'intent_001',
    action: CommandAction.LOG_DATA,
    target: 'feeding',
    parameters: {}, // No parameters yet
    confidence: 0.9,
    requiresConfirmation: true,
    priority: 'normal',
    entities: [],
    ambiguities: []
  };

  // Define required parameters
  const parameters: ParameterDefinition[] = [
    {
      name: 'petName',
      type: EntityType.PET_NAME,
      required: true,
      prompt: 'Which pet did you feed?',
      examples: ['Buddy', 'Max', 'Luna']
    },
    {
      name: 'amount',
      type: 'number',
      required: true,
      prompt: 'How much food did they eat?',
      validationFn: (value) => value > 0,
      validationError: 'Amount must be greater than zero',
      examples: ['2 cups', '1.5 cups', '3 cups']
    },
    {
      name: 'foodType',
      type: 'string',
      required: true,
      prompt: 'What type of food?',
      examples: ['dry food', 'wet food', 'treats']
    }
  ];

  // Start dialog
  const dialog = dialogManager.startDialog(intent, parameters, DialogType.DATA_ENTRY);
  console.log('Dialog started:', dialog.dialogId);

  // Turn 1: Ask for pet name
  let prompt = dialogManager.getNextPrompt(dialog.dialogId);
  console.log('JoJo:', prompt?.text); // "Which pet did you feed?"

  // User responds: "Buddy"
  const entities1: Entity[] = [
    {
      type: EntityType.PET_NAME,
      value: 'Buddy',
      confidence: 0.95,
      resolvedValue: 'Buddy'
    }
  ];
  prompt = dialogManager.processDialogTurn(dialog.dialogId, 'Buddy', entities1);
  console.log('JoJo:', prompt?.text); // "How much food did they eat?"

  // Turn 2: User responds: "2 cups"
  const entities2: Entity[] = [
    {
      type: EntityType.AMOUNT,
      value: '2',
      confidence: 0.9,
      resolvedValue: 2
    }
  ];
  prompt = dialogManager.processDialogTurn(dialog.dialogId, '2 cups', entities2);
  console.log('JoJo:', prompt?.text); // "What type of food?"

  // Turn 3: User responds: "dry food"
  prompt = dialogManager.processDialogTurn(dialog.dialogId, 'dry food', []);
  console.log('JoJo:', prompt?.text); // Confirmation prompt

  // Turn 4: User confirms: "Yes, that's correct"
  prompt = dialogManager.processDialogTurn(dialog.dialogId, "Yes, that's correct", []);
  console.log('Dialog complete:', prompt === null);

  // Complete dialog
  const result = dialogManager.completeDialog(dialog.dialogId);
  console.log('Result:', result);
  console.log('Collected parameters:', result.collectedParameters);
  console.log('\n');
}

// ============================================================================
// Example 2: Appointment Booking Dialog
// ============================================================================

export function example2_AppointmentBooking() {
  console.log('=== Example 2: Appointment Booking ===\n');

  const intent: ParsedIntent = {
    intentId: 'intent_002',
    action: CommandAction.SCHEDULE,
    target: 'appointment',
    parameters: {
      petName: 'Max' // User already mentioned the pet
    },
    confidence: 0.85,
    requiresConfirmation: true,
    priority: 'normal',
    entities: [],
    ambiguities: []
  };

  const parameters: ParameterDefinition[] = [
    {
      name: 'petName',
      type: EntityType.PET_NAME,
      required: true,
      prompt: 'Which pet is this appointment for?'
    },
    {
      name: 'date',
      type: EntityType.DATE,
      required: true,
      prompt: 'What date would you like?',
      examples: ['tomorrow', 'next Monday', 'March 15']
    },
    {
      name: 'time',
      type: EntityType.TIME,
      required: true,
      prompt: 'What time works for you?',
      examples: ['2 PM', '10:30 AM', '3 o\'clock']
    },
    {
      name: 'clinic',
      type: 'string',
      required: true,
      prompt: 'Which vet clinic?',
      examples: ['City Vet', 'Pet Care Plus', 'Animal Hospital']
    },
    {
      name: 'reason',
      type: 'string',
      required: true,
      prompt: 'What\'s the reason for the visit?',
      examples: ['checkup', 'vaccination', 'sick visit']
    }
  ];

  const dialog = dialogManager.startDialog(intent, parameters, DialogType.APPOINTMENT_BOOKING);
  console.log('Dialog started for pet:', intent.parameters.petName);

  // Pet name already provided, so skip to date
  let prompt = dialogManager.getNextPrompt(dialog.dialogId);
  console.log('JoJo:', prompt?.text); // "What date would you like?"

  // Continue with remaining parameters...
  console.log('(Dialog continues with date, time, clinic, reason collection)');
  console.log('\n');
}

// ============================================================================
// Example 3: Handling Cancellation
// ============================================================================

export function example3_Cancellation() {
  console.log('=== Example 3: Handling Cancellation ===\n');

  const intent: ParsedIntent = {
    intentId: 'intent_003',
    action: CommandAction.LOG_DATA,
    target: 'medication',
    parameters: {},
    confidence: 0.9,
    requiresConfirmation: false,
    priority: 'normal',
    entities: [],
    ambiguities: []
  };

  const parameters: ParameterDefinition[] = [
    {
      name: 'petName',
      type: EntityType.PET_NAME,
      required: true,
      prompt: 'Which pet needs medication?'
    },
    {
      name: 'medicationName',
      type: EntityType.MEDICATION_NAME,
      required: true,
      prompt: 'What medication?'
    }
  ];

  const dialog = dialogManager.startDialog(intent, parameters, DialogType.DATA_ENTRY);

  // Turn 1
  let prompt = dialogManager.getNextPrompt(dialog.dialogId);
  console.log('JoJo:', prompt?.text); // "Which pet needs medication?"

  // User changes mind: "Cancel"
  prompt = dialogManager.processDialogTurn(dialog.dialogId, 'cancel', []);
  console.log('JoJo:', prompt?.text); // "Okay, I've cancelled that..."

  // Complete dialog
  const result = dialogManager.completeDialog(dialog.dialogId);
  console.log('Cancelled:', result.cancelled);
  console.log('Success:', result.success);
  console.log('\n');
}

// ============================================================================
// Example 4: Validation Error Handling
// ============================================================================

export function example4_ValidationError() {
  console.log('=== Example 4: Validation Error ===\n');

  const intent: ParsedIntent = {
    intentId: 'intent_004',
    action: CommandAction.LOG_DATA,
    target: 'weight',
    parameters: { petName: 'Luna' },
    confidence: 0.9,
    requiresConfirmation: false,
    priority: 'normal',
    entities: [],
    ambiguities: []
  };

  const parameters: ParameterDefinition[] = [
    {
      name: 'petName',
      type: EntityType.PET_NAME,
      required: true,
      prompt: 'Which pet?'
    },
    {
      name: 'weight',
      type: 'number',
      required: true,
      prompt: 'What is the weight in kg?',
      validationFn: (value) => value > 0 && value < 200,
      validationError: 'Weight must be between 0 and 200 kg',
      examples: ['5 kg', '10 kg', '15 kg']
    }
  ];

  const dialog = dialogManager.startDialog(intent, parameters, DialogType.DATA_ENTRY);

  // Pet name already provided, ask for weight
  let prompt = dialogManager.getNextPrompt(dialog.dialogId);
  console.log('JoJo:', prompt?.text); // "What is the weight in kg?"

  // User provides invalid weight: "-5"
  const invalidEntities: Entity[] = [
    {
      type: EntityType.AMOUNT,
      value: '-5',
      confidence: 0.9,
      resolvedValue: -5
    }
  ];
  prompt = dialogManager.processDialogTurn(dialog.dialogId, '-5', invalidEntities);
  console.log('JoJo:', prompt?.text); // "Weight must be between 0 and 200 kg"

  // User provides valid weight: "12"
  const validEntities: Entity[] = [
    {
      type: EntityType.AMOUNT,
      value: '12',
      confidence: 0.9,
      resolvedValue: 12
    }
  ];
  prompt = dialogManager.processDialogTurn(dialog.dialogId, '12', validEntities);
  console.log('Dialog complete:', prompt === null);

  const result = dialogManager.completeDialog(dialog.dialogId);
  console.log('Weight logged:', result.collectedParameters.weight);
  console.log('\n');
}

// ============================================================================
// Example 5: Confirmation Dialog
// ============================================================================

export function example5_ConfirmationDialog() {
  console.log('=== Example 5: Confirmation Dialog ===\n');

  // Low confidence command needs confirmation
  const intent: ParsedIntent = {
    intentId: 'intent_005',
    action: CommandAction.NAVIGATE,
    target: 'appointments',
    parameters: {},
    confidence: 0.65, // Low confidence
    requiresConfirmation: true,
    priority: 'normal',
    entities: [],
    ambiguities: []
  };

  const dialog = dialogManager.startDialog(intent, [], DialogType.CONFIRMATION);

  // Get confirmation prompt
  let prompt = dialogManager.getNextPrompt(dialog.dialogId);
  console.log('JoJo:', prompt?.text); // Confirmation request

  // User confirms: "Yes"
  prompt = dialogManager.processDialogTurn(dialog.dialogId, 'Yes', []);
  console.log('Confirmed:', prompt === null);

  const result = dialogManager.completeDialog(dialog.dialogId);
  console.log('Can proceed:', result.success);
  console.log('\n');
}

// ============================================================================
// Example 6: Clarification Dialog
// ============================================================================

export function example6_ClarificationDialog() {
  console.log('=== Example 6: Clarification Dialog ===\n');

  // Ambiguous command
  const intent: ParsedIntent = {
    intentId: 'intent_006',
    action: CommandAction.LOG_DATA,
    target: 'feeding',
    parameters: {},
    confidence: 0.7,
    requiresConfirmation: false,
    priority: 'normal',
    entities: [],
    ambiguities: ['Multiple pets named "Max"']
  };

  const parameters: ParameterDefinition[] = [
    {
      name: 'petId',
      type: 'string',
      required: true,
      prompt: 'I found multiple pets named Max. Did you mean Max the dog or Max the cat?',
      examples: ['Max the dog', 'Max the cat']
    }
  ];

  const dialog = dialogManager.startDialog(intent, parameters, DialogType.CLARIFICATION);

  let prompt = dialogManager.getNextPrompt(dialog.dialogId);
  console.log('JoJo:', prompt?.text);

  // User clarifies: "Max the dog"
  prompt = dialogManager.processDialogTurn(dialog.dialogId, 'Max the dog', []);
  console.log('Clarified:', prompt === null);

  const result = dialogManager.completeDialog(dialog.dialogId);
  console.log('Selected pet:', result.collectedParameters.petId);
  console.log('\n');
}

// ============================================================================
// Example 7: Optional Parameters
// ============================================================================

export function example7_OptionalParameters() {
  console.log('=== Example 7: Optional Parameters ===\n');

  const intent: ParsedIntent = {
    intentId: 'intent_007',
    action: CommandAction.LOG_DATA,
    target: 'activity',
    parameters: { petName: 'Buddy' },
    confidence: 0.9,
    requiresConfirmation: false,
    priority: 'normal',
    entities: [],
    ambiguities: []
  };

  const parameters: ParameterDefinition[] = [
    {
      name: 'petName',
      type: EntityType.PET_NAME,
      required: true,
      prompt: 'Which pet?'
    },
    {
      name: 'activityType',
      type: EntityType.ACTIVITY_TYPE,
      required: true,
      prompt: 'What activity?',
      examples: ['walk', 'play', 'training']
    },
    {
      name: 'duration',
      type: 'number',
      required: false, // Optional
      prompt: 'How long in minutes? (optional)',
      examples: ['30 minutes', '1 hour', 'skip']
    },
    {
      name: 'notes',
      type: 'string',
      required: false, // Optional
      prompt: 'Any notes? (optional)',
      examples: ['No notes', 'None', 'Skip']
    }
  ];

  const dialog = dialogManager.startDialog(intent, parameters, DialogType.DATA_ENTRY);

  // Only required parameters will be prompted
  let prompt = dialogManager.getNextPrompt(dialog.dialogId);
  console.log('JoJo:', prompt?.text); // "What activity?"

  // User provides activity
  const entities: Entity[] = [
    {
      type: EntityType.ACTIVITY_TYPE,
      value: 'walk',
      confidence: 0.9,
      resolvedValue: 'walk'
    }
  ];
  prompt = dialogManager.processDialogTurn(dialog.dialogId, 'walk', entities);
  console.log('Dialog complete (optional params skipped):', prompt === null);

  const result = dialogManager.completeDialog(dialog.dialogId);
  console.log('Activity logged:', result.collectedParameters);
  console.log('\n');
}

// ============================================================================
// Run All Examples
// ============================================================================

export function runAllExamples() {
  example1_SimpleFeedingLog();
  example2_AppointmentBooking();
  example3_Cancellation();
  example4_ValidationError();
  example5_ConfirmationDialog();
  example6_ClarificationDialog();
  example7_OptionalParameters();
}

// Uncomment to run examples
// runAllExamples();
