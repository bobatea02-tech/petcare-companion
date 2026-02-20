# ResponseComposer Service

## Overview

The ResponseComposer service generates natural language responses for the JoJo Voice Assistant. It creates warm, friendly, and helpful responses while optimizing for TTS quota conservation and adapting tone based on urgency.

**Feature**: jojo-voice-assistant-enhanced  
**Requirements**: 3.5, 8.1, 15.3, 16.4, 16.5

## Key Features

### 1. Personality-Driven Responses
- **Warm & Friendly**: Uses conversational language with personality
- **Helpful Tone**: Provides clear, actionable information
- **Context-Aware**: References active pet and conversation history

### 2. Quota Conservation (Requirement 3.5, 15.3)
- Automatically activates conservation mode at 80% quota usage (8,000 chars)
- Shortens responses by removing pleasantries and filler words
- Prioritizes cached responses when in conservation mode
- Maintains clarity while reducing character count

### 3. Multi-Modal Response Generation (Requirement 8.1)
- Generates both voice text and display text
- Includes visual data references for UI display
- Coordinates voice output with visual elements

### 4. Priority-Based Tone Adaptation (Requirements 16.4, 16.5)
- **Urgent/High Priority**: Direct, action-oriented, brief responses
- **Normal Priority**: Detailed, conversational, friendly responses
- Detects urgency from command priority flags

## API Reference

### Main Methods

#### `composeResponse(result: CommandResult, context: ConversationContext): Response`
Composes a response from a command execution result.

**Parameters:**
- `result`: The result of command execution
- `context`: Current conversation context (active pet, history, etc.)

**Returns:** `Response` object with text, displayText, visualData, and priority

**Example:**
```typescript
const result = {
  success: true,
  data: { petName: "Buddy", amount: 2, unit: "cups", time: "6 PM" },
  message: "Feeding logged",
  visualComponent: "log_feeding",
  requiresFollowUp: false,
  followUpPrompt: null
};

const context = {
  activePet: "Buddy",
  previousIntents: [],
  currentPage: "/dashboard",
  recentEntities: []
};

const response = responseComposer.composeResponse(result, context);
// Normal mode: "Got it! I've logged Buddy's feeding."
// Conservation mode: "Logged feeding for Buddy."
```

#### `composeErrorResponse(error: Error, context: ConversationContext): Response`
Composes a user-friendly error response.

**Parameters:**
- `error`: The error that occurred
- `context`: Current conversation context

**Returns:** `Response` object with error message

**Example:**
```typescript
const error = new Error("Monthly character quota exceeded");
const response = responseComposer.composeErrorResponse(error, context);
// "I've reached my voice limit for this month. I'll show you the information instead."
```

#### `composeConfirmation(intent: ParsedIntent): Response`
Composes a confirmation request for low-confidence or destructive actions.

**Parameters:**
- `intent`: The parsed intent requiring confirmation

**Returns:** `Response` object with confirmation question

**Example:**
```typescript
const intent = {
  intentId: "123",
  action: CommandAction.CANCEL,
  target: "appointment",
  parameters: { appointmentId: "456" },
  confidence: 0.75,
  requiresConfirmation: true,
  priority: "high",
  entities: [],
  ambiguities: []
};

const response = responseComposer.composeConfirmation(intent);
// Normal mode: "This will cancel the item. Are you sure?"
// Conservation mode: "Cancel this?"
```

#### `composeClarification(ambiguousIntent: ParsedIntent): Response`
Composes a clarification question for ambiguous commands.

**Parameters:**
- `ambiguousIntent`: The intent with ambiguities

**Returns:** `Response` object with clarification question

**Example:**
```typescript
const ambiguousIntent = {
  intentId: "789",
  action: CommandAction.QUERY,
  target: "appointments",
  parameters: {},
  confidence: 0.6,
  requiresConfirmation: false,
  priority: "normal",
  entities: [],
  ambiguities: ["Buddy", "Max", "Luna"]
};

const response = responseComposer.composeClarification(ambiguousIntent);
// Normal mode: "I found multiple pets. Did you mean Buddy, Max, Luna?"
// Conservation mode: "Which pet: Buddy, Max, Luna?"
```

## Response Templates

### Success Response Templates

#### Navigation
- **Normal**: "Sure! I'm showing you {target}."
- **Urgent**: "Opening {target}."
- **Conservation**: "Showing {target}."

#### Data Entry (Feeding)
- **Normal**: "Got it! I've logged {petName}'s feeding."
- **Urgent**: "Logged feeding for {petName}."
- **Conservation**: "Logged feeding."

#### Data Entry (Medication)
- **Normal**: "Perfect! I've recorded {medicationName} for {petName}."
- **Urgent**: "Logged {medicationName} for {petName}."
- **Conservation**: "Logged medication."

#### Query (Appointments)
- **Normal**: "{petName}'s next appointment is {date} at {time} at {clinic}."
- **Urgent**: "Next appointment: {date} at {time}."
- **Conservation**: "{date} at {time}."

#### Query (Medications)
- **Normal**: "{petName} has {count} medication(s) scheduled today."
- **Urgent**: "{count} medication(s) today."
- **Conservation**: "{count} meds today."

#### Query (Health Score)
- **Normal**: "{petName}'s health score is {score}. Looking good!"
- **Urgent**: "Health score: {score}."
- **Conservation**: "Score: {score}."

### Error Response Templates

#### Recognition Failure
- **Normal**: "Sorry, I didn't catch that. Could you repeat?"
- **Conservation**: "Didn't catch that. Repeat?"

#### API Failure
- **Normal**: "I'm having trouble right now. Please try again."
- **Conservation**: "Trouble. Try again."

#### Invalid Command
- **Normal**: "I'm not sure how to help with that. Try asking about your pets' health, appointments, or feeding."
- **Conservation**: "Not sure. Try health, appointments, or feeding."

#### Quota Exceeded
- **Always**: "I've reached my voice limit for this month. I'll show you the information instead."

#### Network Error
- **Always**: "I need an internet connection to work. Please check your connection."

### Confirmation Templates

#### Data Entry Confirmation
- **Normal**: "I'll log {action} for {petName}. Is that correct?"
- **Conservation**: "Log {action} for {petName}?"

#### Scheduling Confirmation
- **Normal**: "I'll schedule an appointment for {petName}. Should I continue?"
- **Conservation**: "Schedule appointment for {petName}?"

#### Cancellation Confirmation
- **Normal**: "This will cancel the item. Are you sure?"
- **Conservation**: "Cancel this?"

#### Bulk Action Confirmation
- **Normal**: "This will affect {count} pets. Should I proceed?"
- **Conservation**: "Apply to {count} pets?"

### Clarification Templates

#### Multiple Pets
- **Normal**: "I found multiple pets. Did you mean {pets}?"
- **Conservation**: "Which pet: {pets}?"

#### Missing Parameter
- **Normal**: "I need to know the {parameter}. Can you tell me?"
- **Conservation**: "What {parameter}?"

#### Ambiguous Action
- **Normal**: "Did you want to {actions}?"
- **Conservation**: "{actions}?"

#### Unclear Intent
- **Normal**: "I'm not quite sure what you mean. Could you rephrase that?"
- **Conservation**: "Can you clarify?"

## Conservation Mode

### Activation
Conservation mode automatically activates when:
- Monthly character usage exceeds 8,000 characters (80% of 10,000 limit)
- Checked before each response composition

### Shortening Strategy
1. **Remove pleasantries**: "Sure!", "Great!", "Perfect!", "All set!", "Got it!"
2. **Remove filler phrases**: "I've", "I'm", "Looking good!", "All done!"
3. **Simplify structure**: Direct statements instead of full sentences
4. **Truncate if needed**: Maximum 80 characters for conservation responses

### Example Transformations
```typescript
// Normal mode (45 chars)
"Got it! I've logged Buddy's feeding."

// Conservation mode (27 chars)
"Logged feeding for Buddy."

// Normal mode (67 chars)
"Buddy's next appointment is tomorrow at 3 PM at Mumbai Vet Clinic."

// Conservation mode (32 chars)
"Next appointment: tomorrow 3 PM."
```

## Priority-Based Adaptation

### Urgent/High Priority (Requirements 16.4)
- **Characteristics**: Direct, action-oriented, minimal words
- **Use case**: Emergency situations, time-sensitive actions
- **Example**: "Logged medication." vs "Perfect! I've recorded the medication."

### Normal Priority (Requirements 16.5)
- **Characteristics**: Detailed, conversational, friendly
- **Use case**: Routine interactions, calm user speech
- **Example**: "Got it! I've logged Buddy's feeding at 6 PM."

### Detection
Priority is determined by:
1. Command result priority flag (`result.data.priority`)
2. Intent priority level (`intent.priority`)
3. Command action type (CANCEL actions are high priority)

## Multi-Modal Response Structure

Each response includes:

```typescript
interface Response {
  text: string;           // Text to be spoken by TTS
  displayText: string;    // Text to display (may differ from spoken)
  visualData: any;        // Data for visual display components
  audioUrl: string | null; // Cached audio URL (populated by TTS)
  priority: "low" | "normal" | "high"; // Response priority
}
```

### Visual Data Examples

#### Appointment Query
```typescript
{
  text: "Buddy's next appointment is tomorrow at 3 PM.",
  displayText: "Showing 2 appointment(s)",
  visualData: {
    appointments: [
      { date: "2024-01-15", time: "3 PM", clinic: "Mumbai Vet" },
      { date: "2024-01-22", time: "10 AM", clinic: "Pet Care Center" }
    ]
  },
  audioUrl: null,
  priority: "normal"
}
```

#### Health Score Query
```typescript
{
  text: "Buddy's health score is 85. Looking good!",
  displayText: "Health Score: 85/100",
  visualData: {
    healthScore: 85,
    lastCheckup: "2024-01-10",
    trends: { /* chart data */ }
  },
  audioUrl: null,
  priority: "normal"
}
```

## Usage Examples

### Basic Usage
```typescript
import { responseComposer } from './services/voice';

// Compose success response
const result = {
  success: true,
  data: { petName: "Buddy", healthScore: 85 },
  message: "Health score retrieved",
  visualComponent: "query_health",
  requiresFollowUp: false,
  followUpPrompt: null
};

const context = {
  activePet: "Buddy",
  previousIntents: [],
  currentPage: "/health",
  recentEntities: []
};

const response = responseComposer.composeResponse(result, context);
console.log(response.text); // "Buddy's health score is 85. Looking good!"
```

### Error Handling
```typescript
try {
  // Some operation that might fail
  await someOperation();
} catch (error) {
  const errorResponse = responseComposer.composeErrorResponse(
    error as Error,
    context
  );
  console.log(errorResponse.text); // User-friendly error message
}
```

### Confirmation Flow
```typescript
const intent = {
  intentId: "123",
  action: CommandAction.LOG_DATA,
  target: "feeding",
  parameters: { petName: "Buddy", amount: 2, unit: "cups" },
  confidence: 0.75,
  requiresConfirmation: true,
  priority: "normal",
  entities: [],
  ambiguities: []
};

const confirmation = responseComposer.composeConfirmation(intent);
console.log(confirmation.text); // "I'll log feeding for Buddy. Is that correct?"
```

### Clarification Flow
```typescript
const ambiguousIntent = {
  intentId: "456",
  action: CommandAction.QUERY,
  target: "appointments",
  parameters: {},
  confidence: 0.6,
  requiresConfirmation: false,
  priority: "normal",
  entities: [],
  ambiguities: ["Buddy", "Max"]
};

const clarification = responseComposer.composeClarification(ambiguousIntent);
console.log(clarification.text); // "I found multiple pets. Did you mean Buddy, Max?"
```

## Integration with Other Services

### TTS Engine Integration
```typescript
import { responseComposer, elevenLabsClient } from './services/voice';

// Compose response
const response = responseComposer.composeResponse(result, context);

// Generate audio
const audioBuffer = await elevenLabsClient.synthesize(response.text, {
  useCache: true
});

// Update response with audio URL
response.audioUrl = URL.createObjectURL(new Blob([audioBuffer]));
```

### Context Manager Integration
```typescript
import { responseComposer, contextManager } from './services/voice';

// Get current context
const context = contextManager.getContext();

// Compose response with context
const response = responseComposer.composeResponse(result, context);

// Response will reference active pet from context
console.log(response.text); // Uses context.activePet
```

## Testing

### Unit Tests
Test individual response templates:
```typescript
describe('ResponseComposer', () => {
  it('should compose success response for feeding log', () => {
    const result = {
      success: true,
      data: { petName: "Buddy", amount: 2, unit: "cups" },
      message: "Feeding logged",
      visualComponent: "log_feeding",
      requiresFollowUp: false,
      followUpPrompt: null
    };
    
    const response = responseComposer.composeResponse(result, context);
    expect(response.text).toContain("Buddy");
    expect(response.text).toContain("feeding");
  });
});
```

### Property-Based Tests
Test quota conservation behavior:
```typescript
// Property 11: Quota conservation behavior
test('should shorten responses when quota exceeds 8000 chars', async () => {
  // Set usage to 8500 characters
  await setMockUsage(8500);
  
  const response = responseComposer.composeResponse(result, context);
  
  // Response should be shortened
  expect(response.text.length).toBeLessThan(80);
  expect(response.text).not.toContain("Got it!");
  expect(response.text).not.toContain("Looking good!");
});
```

## Best Practices

1. **Always provide context**: Pass the current conversation context for personalized responses
2. **Check conservation mode**: Be aware that responses may be shortened automatically
3. **Use appropriate priority**: Set priority flags to get the right tone
4. **Include visual data**: Provide data for multi-modal display
5. **Handle errors gracefully**: Use composeErrorResponse for user-friendly error messages
6. **Test both modes**: Test responses in both normal and conservation modes

## Troubleshooting

### Response too long in conservation mode
- Check if conservation mode is actually active
- Verify usage stats are being tracked correctly
- Ensure shortening logic is applied

### Wrong tone for urgency
- Check priority flags in command result
- Verify intent priority is set correctly
- Review priority detection logic

### Missing visual data
- Ensure command result includes data field
- Check visualComponent field is set
- Verify data structure matches expected format

### Context not applied
- Verify context is passed to composeResponse
- Check activePet is set in context
- Ensure context manager is updated

## Related Services

- **ElevenLabsClient**: TTS engine for audio generation
- **ContextManager**: Conversation context tracking
- **CommandRouter**: Command execution and result generation
- **ResponseCacheManager**: Audio response caching

## Requirements Validation

- ✅ **Requirement 3.5**: Prioritize cached responses and shorten at 80% quota
- ✅ **Requirement 8.1**: Multi-modal response with visual data
- ✅ **Requirement 15.3**: Shorten responses when usage exceeds 8,000 chars
- ✅ **Requirement 16.4**: Direct, action-oriented tone for urgent requests
- ✅ **Requirement 16.5**: Detailed, conversational responses for calm speech
