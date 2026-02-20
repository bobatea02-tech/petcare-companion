# Intent Parser Service

## Overview

The Intent Parser Service is a core component of the JoJo Voice Assistant that converts natural language voice commands into structured, actionable intents. It uses the Gemini API (via the JoJo backend) for advanced natural language understanding, entity extraction, and priority detection.

## Features

- **Natural Language Understanding**: Parses free-form voice commands into structured intents
- **Entity Extraction**: Identifies and extracts key information (dates, times, amounts, pet names, etc.)
- **Context Awareness**: Uses conversation history and active pet context for better interpretation
- **Priority Detection**: Automatically detects urgent commands based on keywords and speech patterns
- **Confidence Scoring**: Provides confidence levels for parsed intents
- **Validation**: Validates intents before execution to ensure all required parameters are present
- **Fallback Parsing**: Provides basic intent parsing when API is unavailable

## Architecture

```
User Voice Command
       ↓
Voice Recognition Engine (Web Speech API)
       ↓
Intent Parser Service
       ↓
    ┌──────────────────────────────┐
    │  1. Build Context-Aware      │
    │     Gemini Prompt            │
    ├──────────────────────────────┤
    │  2. Call JoJo API            │
    │     (Gemini Backend)         │
    ├──────────────────────────────┤
    │  3. Parse Response           │
    │     Extract Intent           │
    ├──────────────────────────────┤
    │  4. Extract Entities         │
    │     (dates, times, amounts)  │
    ├──────────────────────────────┤
    │  5. Detect Priority          │
    │     (urgent keywords)        │
    ├──────────────────────────────┤
    │  6. Validate Intent          │
    │     Check required params    │
    └──────────────────────────────┘
       ↓
Structured ParsedIntent Object
       ↓
Command Router
```

## Usage

### Basic Usage

```typescript
import { intentParser } from '@/services/voice';
import { ConversationContext } from '@/services/voice/types';

// Create conversation context
const context: ConversationContext = {
  previousIntents: [],
  activePet: 'Max',
  currentPage: 'dashboard',
  recentEntities: []
};

// Parse voice command
const transcription = "Log feeding for Max - 2 cups of kibble";
const intent = await intentParser.parseIntent(transcription, context);

console.log(intent);
// {
//   intentId: "intent_1234567890_abc123",
//   action: "log_data",
//   target: "feeding",
//   parameters: { amount: 2, unit: "cups", foodType: "kibble" },
//   confidence: 0.85,
//   requiresConfirmation: true,
//   priority: "normal",
//   entities: [...],
//   ambiguities: []
// }
```

### Validate Intent

```typescript
// Validate intent before execution
const validation = intentParser.validateIntent(intent);

if (!validation.valid) {
  console.log('Errors:', validation.errors);
  console.log('Warnings:', validation.warnings);
  // Ask user for missing information
}
```

### Extract Entities

```typescript
// Extract entities from transcription
const transcription = "Give 5mg of Rimadyl at 3:30 PM today";
const entities = intentParser.extractEntities(transcription);

console.log(entities);
// [
//   { type: "AMOUNT", value: "5", confidence: 0.95, resolvedValue: 5 },
//   { type: "UNIT", value: "mg", confidence: 0.95, resolvedValue: "mg" },
//   { type: "TIME", value: "3:30 PM", confidence: 0.9, resolvedValue: "3:30 PM" },
//   { type: "DATE", value: "today", confidence: 0.9, resolvedValue: Date(...) }
// ]
```

## Supported Command Actions

The Intent Parser recognizes the following command actions:

### 1. NAVIGATE
Navigate to different pages in the dashboard.

**Examples:**
- "Go to appointments"
- "Show me the health records"
- "Open medication tracker"
- "Navigate to pets page"

**Targets:** appointments, health, medications, feeding, pets

### 2. LOG_DATA
Record information about pet care activities.

**Examples:**
- "Log feeding - 2 cups of kibble"
- "Record medication - 5mg Rimadyl"
- "Add weight - 25 kg"
- "Log walk - 30 minutes"

**Targets:** feeding, medication, weight, activity

### 3. QUERY
Ask for information about pets.

**Examples:**
- "When is Max's next appointment?"
- "What medications does Bella need today?"
- "Show feeding history for Charlie"
- "What's Luna's health score?"

**Targets:** appointments, medications, health, feeding

### 4. SCHEDULE
Book appointments.

**Examples:**
- "Schedule vet appointment for Max"
- "Book appointment tomorrow at 3 PM"

**Target:** appointment

### 5. CANCEL
Cancel appointments.

**Examples:**
- "Cancel appointment for Max on Friday"
- "Remove the 3 PM appointment"

**Target:** appointment

### 6. BULK_ACTION
Perform actions for multiple pets.

**Examples:**
- "Log feeding for all pets"
- "Show health summary for all dogs"

**Targets:** feeding, health, medications

### 7. HELP
Get assistance.

**Examples:**
- "What can you do?"
- "Help me"
- "Show available commands"

## Priority Detection

The Intent Parser automatically detects command priority based on keywords and speech patterns:

### Urgent Priority
Triggered by keywords: emergency, urgent, help, now, immediately, asap, critical, serious, bleeding, choking, poisoned

**Example:** "Emergency! Max is bleeding!"

### High Priority
Triggered by keywords: pain, sick, vomiting, diarrhea, not eating, lethargic, limping, coughing, sneezing

**Example:** "Max is vomiting and not eating"

### Normal Priority
Default priority for routine commands.

**Example:** "Show Max's feeding history"

### Low Priority
Reserved for future use.

## Entity Extraction

The Intent Parser extracts the following entity types:

### PET_NAME
Pet names mentioned in the command.

### DATE
Date references (today, tomorrow, yesterday, specific dates).

**Patterns:**
- "today", "tomorrow", "yesterday"
- "12/25/2024"
- "2024-12-25"

### TIME
Time references.

**Patterns:**
- "3:30 PM"
- "15:30"
- "3 PM"

### AMOUNT
Numeric amounts.

**Examples:** "2", "5.5", "10"

### UNIT
Measurement units.

**Examples:** kg, g, mg, ml, l, cups, tablets, pills

### MEDICATION_NAME
Medication names extracted from context.

### ACTIVITY_TYPE
Activity types (walk, run, play, training, grooming, etc.).

### LOCATION
Location references (for future use).

## Context Management

The Intent Parser uses conversation context to improve accuracy:

### Active Pet
When a pet is mentioned, it becomes the active pet for subsequent commands.

```typescript
// First command
"Show me Max's health records"
// Sets activePet = "Max"

// Follow-up command
"What about his medications?"
// Resolves "his" to "Max" using context
```

### Previous Intents
Recent commands help interpret follow-up questions.

```typescript
// First command
"Go to appointments"

// Follow-up command
"Show me next week's schedule"
// Understands this is about appointments
```

### Recent Entities
Recently mentioned entities are tracked for reference resolution.

## Validation

The Intent Parser validates intents to ensure they can be executed:

### Required Parameters

Different actions require different parameters:

**LOG_DATA + feeding:**
- petId
- amount
- foodType

**LOG_DATA + medication:**
- petId
- medicationName
- dosage

**SCHEDULE + appointment:**
- petId
- date
- clinic

### Validation Result

```typescript
interface ValidationResult {
  valid: boolean;
  errors: string[];    // Missing required parameters
  warnings: string[];  // Low confidence, ambiguities
}
```

## Error Handling

The Intent Parser includes robust error handling:

### API Failure
If the Gemini API fails, the parser falls back to rule-based parsing.

### Low Confidence
When confidence is below 0.5, a warning is added to the validation result.

### Ambiguities
Unclear parts of the command are tracked in the `ambiguities` array.

## Configuration

Intent Parser behavior can be customized through the voice configuration:

```typescript
// In config.ts
export const VOICE_CONFIG = {
  context: {
    maxTurns: 10,        // Conversation turns to remember
    maxEntities: 20,     // Recent entities to track
    inactivityTimeout: 30 * 60 * 1000  // 30 minutes
  }
};
```

## Performance

- **Intent Parsing Latency:** < 1 second (target)
- **Entity Extraction:** < 100ms (synchronous)
- **Validation:** < 10ms (synchronous)

## Testing

See `intentParser.example.ts` for comprehensive usage examples.

## Integration with Other Services

The Intent Parser integrates with:

1. **Voice Recognition Engine**: Receives transcribed text
2. **Context Manager**: Maintains conversation state
3. **Command Router**: Receives parsed intents for execution
4. **JoJo API**: Uses Gemini for natural language understanding

## Future Enhancements

- Multi-language support
- Custom entity types
- Learning from user corrections
- Sentiment analysis
- Voice tone analysis for priority detection
- Offline fallback mode improvements

## Requirements Validation

This implementation validates the following requirements:

- **Requirement 2.2**: Intent parsing within 1 second ✓
- **Requirement 2.3**: Ambiguous command clarification ✓
- **Requirement 16.1**: Urgent keyword detection ✓
- **Requirement 16.3**: Priority escalation ✓

## Related Documentation

- [Voice Recognition Engine README](./VOICE_RECOGNITION_ENGINE_README.md)
- [Context Manager Documentation](./CONTEXT_MANAGER_README.md)
- [Command Router Documentation](./COMMAND_ROUTER_README.md)
