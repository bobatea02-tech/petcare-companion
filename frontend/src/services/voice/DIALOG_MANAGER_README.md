# DialogManager Service

## Overview

The DialogManager service manages multi-turn conversation flows for complex voice interactions in the JoJo Voice Assistant. It handles missing parameter collection, confirmation dialogs, clarification requests, and cancellation handling.

**Feature**: jojo-voice-assistant-enhanced  
**Requirements**: 5.1, 5.6, 11.2, 12.2

## Purpose

When users issue voice commands that require multiple pieces of information (e.g., "Log feeding for Buddy"), the DialogManager orchestrates the conversation to collect all necessary parameters through a natural back-and-forth dialog.

## Key Features

- **Multi-turn Conversations**: Manage dialogs that span multiple user inputs
- **Parameter Collection**: Automatically prompt for missing required parameters
- **Confirmation Handling**: Request user confirmation before executing actions
- **Clarification Support**: Ask clarifying questions when input is ambiguous
- **Cancellation Handling**: Gracefully handle user cancellation at any point
- **Validation**: Validate collected parameters before proceeding
- **Turn Limits**: Prevent infinite loops with maximum turn counts

## Architecture

```
User Input → DialogManager → Parameter Collection → Validation → Confirmation → Complete
                ↓                                                      ↓
           Cancellation Check                              Generate Prompts
```

## Usage

### Starting a Dialog

```typescript
import { dialogManager } from './dialogManager';
import { ParsedIntent, EntityType } from './types';

// Define required parameters
const requiredParameters = [
  {
    name: 'petName',
    type: EntityType.PET_NAME,
    required: true,
    prompt: 'Which pet is this for?',
    examples: ['Buddy', 'Max', 'Luna']
  },
  {
    name: 'amount',
    type: 'number',
    required: true,
    prompt: 'How much did they eat?',
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

// Start the dialog
const intent: ParsedIntent = {
  intentId: 'intent_123',
  action: CommandAction.LOG_DATA,
  target: 'feeding',
  parameters: {}, // Empty initially
  confidence: 0.9,
  requiresConfirmation: true,
  priority: 'normal',
  entities: [],
  ambiguities: []
};

const dialog = dialogManager.startDialog(
  intent,
  requiredParameters,
  DialogType.DATA_ENTRY
);

// Get the first prompt
const firstPrompt = dialogManager.getNextPrompt(dialog.dialogId);
console.log(firstPrompt.text); // "Which pet is this for?"
```

### Processing User Responses

```typescript
// User says: "Buddy"
const entities = [
  {
    type: EntityType.PET_NAME,
    value: 'Buddy',
    confidence: 0.95,
    resolvedValue: 'Buddy'
  }
];

const nextPrompt = dialogManager.processDialogTurn(
  dialog.dialogId,
  'Buddy',
  entities
);

console.log(nextPrompt?.text); // "How much did they eat?"

// User says: "2 cups"
const amountEntities = [
  {
    type: EntityType.AMOUNT,
    value: '2',
    confidence: 0.9,
    resolvedValue: 2
  },
  {
    type: EntityType.UNIT,
    value: 'cups',
    confidence: 0.9,
    resolvedValue: 'cups'
  }
];

const thirdPrompt = dialogManager.processDialogTurn(
  dialog.dialogId,
  '2 cups',
  amountEntities
);

console.log(thirdPrompt?.text); // "What type of food?"
```

### Handling Confirmation

```typescript
// After all parameters collected, confirmation is requested
const confirmPrompt = dialogManager.getNextPrompt(dialog.dialogId);
console.log(confirmPrompt?.text); 
// "Let me confirm: for Buddy, 2 cups of dry food at 6:00 PM. Is this correct?"

// User says: "Yes, that's correct"
const finalPrompt = dialogManager.processDialogTurn(
  dialog.dialogId,
  "Yes, that's correct",
  []
);

// Dialog is complete
const result = dialogManager.completeDialog(dialog.dialogId);
console.log(result.success); // true
console.log(result.collectedParameters);
// { petName: 'Buddy', amount: 2, unit: 'cups', foodType: 'dry food', time: ... }
```

### Handling Cancellation

```typescript
// User says: "Cancel" or "Never mind"
const cancelPrompt = dialogManager.processDialogTurn(
  dialog.dialogId,
  'cancel',
  []
);

console.log(cancelPrompt?.text); 
// "Okay, I've cancelled that. What would you like to do instead?"

const result = dialogManager.completeDialog(dialog.dialogId);
console.log(result.cancelled); // true
```

## Dialog Types

### DATA_ENTRY
For logging pet care activities (feeding, medication, weight, etc.)

```typescript
const dialog = dialogManager.startDialog(
  intent,
  [
    { name: 'petName', type: EntityType.PET_NAME, required: true, prompt: 'Which pet?' },
    { name: 'amount', type: 'number', required: true, prompt: 'How much?' },
    { name: 'time', type: EntityType.TIME, required: false, prompt: 'What time?' }
  ],
  DialogType.DATA_ENTRY
);
```

### APPOINTMENT_BOOKING
For scheduling vet appointments

```typescript
const dialog = dialogManager.startDialog(
  intent,
  [
    { name: 'petName', type: EntityType.PET_NAME, required: true, prompt: 'Which pet?' },
    { name: 'date', type: EntityType.DATE, required: true, prompt: 'What date?' },
    { name: 'time', type: EntityType.TIME, required: true, prompt: 'What time?' },
    { name: 'clinic', type: 'string', required: true, prompt: 'Which clinic?' },
    { name: 'reason', type: 'string', required: true, prompt: 'What\'s the reason?' }
  ],
  DialogType.APPOINTMENT_BOOKING
);
```

### CONFIRMATION
For confirming low-confidence commands

```typescript
const dialog = dialogManager.startDialog(
  intent,
  [],
  DialogType.CONFIRMATION
);
```

### CLARIFICATION
For resolving ambiguous commands

```typescript
const dialog = dialogManager.startDialog(
  intent,
  [
    { name: 'clarification', type: 'string', required: true, prompt: 'Did you mean X or Y?' }
  ],
  DialogType.CLARIFICATION
);
```

## Parameter Validation

Add custom validation to parameters:

```typescript
const parameters = [
  {
    name: 'weight',
    type: 'number',
    required: true,
    prompt: 'What is the weight?',
    validationFn: (value) => value > 0 && value < 200,
    validationError: 'Weight must be between 0 and 200 kg',
    examples: ['5 kg', '10 kg', '15 kg']
  },
  {
    name: 'date',
    type: EntityType.DATE,
    required: true,
    prompt: 'What date?',
    validationFn: (value) => {
      const date = new Date(value);
      return date >= new Date(); // Must be today or future
    },
    validationError: 'Date must be today or in the future',
    examples: ['tomorrow', 'next Monday', 'March 15']
  }
];
```

## Cancellation Keywords

The DialogManager recognizes these cancellation keywords:
- cancel
- stop
- nevermind / never mind
- forget it
- no thanks
- that's wrong / thats wrong
- incorrect
- abort
- quit
- exit

## Confirmation Keywords

**Affirmative**:
- yes, yeah, yep
- correct, right, that's right
- affirmative, confirm
- ok, okay, sure
- proceed, go ahead, continue

**Negative**:
- no, nope, nah
- incorrect, wrong, not right
- that's wrong, thats wrong
- negative, deny, cancel

## Best Practices

### 1. Define Clear Prompts
```typescript
// Good
prompt: 'Which pet would you like to log feeding for?'

// Bad
prompt: 'Pet?'
```

### 2. Provide Examples
```typescript
{
  name: 'foodType',
  type: 'string',
  required: true,
  prompt: 'What type of food did they eat?',
  examples: ['dry food', 'wet food', 'treats', 'raw food']
}
```

### 3. Add Validation
```typescript
{
  name: 'dosage',
  type: 'string',
  required: true,
  prompt: 'What is the medication dosage?',
  validationFn: (value) => /^\d+\s*(mg|ml|g)$/.test(value),
  validationError: 'Please provide dosage with unit (e.g., "10 mg", "5 ml")',
  examples: ['10 mg', '5 ml', '2 tablets']
}
```

### 4. Handle Optional Parameters
```typescript
{
  name: 'notes',
  type: 'string',
  required: false, // Optional
  prompt: 'Any additional notes? (optional)',
  examples: ['No notes', 'Skip', 'None']
}
```

### 5. Set Appropriate Max Turns
```typescript
const dialog = dialogManager.startDialog(intent, parameters);
// Default maxTurns is 10, adjust if needed
dialog.maxTurns = 5; // For simpler dialogs
```

## Integration with Voice Assistant

```typescript
import { dialogManager, DialogType } from './dialogManager';
import { intentParser } from './intentParser';
import { contextManager } from './contextManager';

async function handleVoiceCommand(transcription: string) {
  const context = contextManager.getContext();
  const intent = await intentParser.parseIntent(transcription, context);
  
  // Check if this command needs a dialog
  const requiredParams = getRequiredParameters(intent);
  const missingParams = requiredParams.filter(p => 
    p.required && !intent.parameters[p.name]
  );
  
  if (missingParams.length > 0 || intent.requiresConfirmation) {
    // Start a dialog
    const dialog = dialogManager.startDialog(
      intent,
      requiredParams,
      getDialogType(intent)
    );
    
    // Get first prompt
    const prompt = dialogManager.getNextPrompt(dialog.dialogId);
    return prompt;
  } else {
    // Execute command directly
    return executeCommand(intent);
  }
}

async function handleDialogResponse(dialogId: string, transcription: string) {
  const entities = await intentParser.extractEntities(transcription);
  const prompt = dialogManager.processDialogTurn(dialogId, transcription, entities);
  
  if (!prompt) {
    // Dialog complete
    const result = dialogManager.completeDialog(dialogId);
    if (result.success) {
      return executeCommand(result.intent);
    } else {
      return { error: result.error };
    }
  }
  
  return prompt;
}
```

## Testing

```typescript
import { dialogManager, DialogType } from './dialogManager';
import { CommandAction, EntityType } from './types';

describe('DialogManager', () => {
  it('should collect missing parameters', () => {
    const intent = {
      intentId: 'test',
      action: CommandAction.LOG_DATA,
      target: 'feeding',
      parameters: {},
      confidence: 0.9,
      requiresConfirmation: false,
      priority: 'normal',
      entities: [],
      ambiguities: []
    };
    
    const params = [
      { name: 'petName', type: EntityType.PET_NAME, required: true, prompt: 'Which pet?' }
    ];
    
    const dialog = dialogManager.startDialog(intent, params);
    const prompt = dialogManager.getNextPrompt(dialog.dialogId);
    
    expect(prompt?.text).toBe('Which pet?');
  });
  
  it('should handle cancellation', () => {
    const dialog = dialogManager.startDialog(intent, params);
    const prompt = dialogManager.processDialogTurn(dialog.dialogId, 'cancel', []);
    
    expect(prompt?.text).toContain('cancelled');
    
    const result = dialogManager.completeDialog(dialog.dialogId);
    expect(result.cancelled).toBe(true);
  });
});
```

## Error Handling

The DialogManager handles several error conditions:

1. **Max Turns Exceeded**: Prevents infinite loops
2. **Invalid Parameters**: Validates input and requests correction
3. **Missing Dialog**: Returns null for non-existent dialogs
4. **Cancellation**: Gracefully handles user cancellation

## Performance Considerations

- Dialogs are stored in memory (Map)
- History is limited to 50 dialogs
- Completed dialogs are automatically cleaned up
- Use `clearAllDialogs()` to reset state if needed

## Related Services

- **IntentParser**: Extracts entities from user input
- **ContextManager**: Provides conversation context
- **CommandRouter**: Executes completed commands
- **ResponseComposer**: Generates voice responses for prompts
