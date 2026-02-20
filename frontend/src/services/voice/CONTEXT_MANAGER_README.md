# Context Manager Service

## Overview

The Context Manager service maintains conversation state and context across voice interactions in the JoJo Voice Assistant. It enables natural, context-aware conversations by tracking conversation history, active pets, and entities mentioned during the session.

**Feature:** jojo-voice-assistant-enhanced  
**Requirements:** 9.1, 9.2, 9.3, 9.4, 9.5

## Key Features

### 1. Conversation History (10-turn window)
- Maintains last 10 conversation turns
- Automatically removes oldest turns when limit exceeded
- Enables context-aware follow-up questions

### 2. Active Pet Tracking
- Tracks currently active pet for pronoun resolution
- Auto-updates when pet name entities are detected
- Supports "his", "her", "its" pronoun resolution

### 3. Entity Memory (20 entities)
- Stores last 20 entities mentioned in conversation
- Supports entity lookup by type or value
- Case-insensitive entity search

### 4. Session Management
- Tracks session active/inactive state
- Automatic context cleanup on session end
- Support for starting new sessions

## Usage

### Basic Setup

```typescript
import { createContextManager } from '@/services/voice';

// Create context manager with initial page
const contextManager = createContextManager('/dashboard');
```

### Updating Context with Intents

```typescript
import { ParsedIntent, CommandAction, EntityType } from '@/services/voice';

// After parsing user speech into intent
const intent: ParsedIntent = {
  intentId: 'turn-1',
  action: CommandAction.QUERY,
  target: 'health_records',
  parameters: { petName: 'Buddy' },
  confidence: 0.95,
  requiresConfirmation: false,
  priority: 'normal',
  entities: [
    {
      type: EntityType.PET_NAME,
      value: 'Buddy',
      confidence: 0.95,
      resolvedValue: 'Buddy'
    }
  ],
  ambiguities: []
};

// Update context with new intent
contextManager.updateContext(intent);

// Active pet is automatically set from entity
console.log(contextManager.getActivePet()); // "Buddy"
```

### Pronoun Resolution

```typescript
// User says: "Show me Luna's health records"
contextManager.setActivePet('Luna');

// User says: "What about her medications?"
// Resolve "her" to active pet
const petName = contextManager.getActivePet(); // "Luna"

// Use resolved pet name in query
const medications = await getMedications(petName);
```

### Entity Memory

```typescript
// Add entities from conversation
const entity = {
  type: EntityType.MEDICATION_NAME,
  value: 'Heartgard',
  confidence: 0.9,
  resolvedValue: 'Heartgard'
};
contextManager.addEntity(entity);

// Retrieve entities by type
const medicationEntities = contextManager.getRecentEntitiesByType(
  EntityType.MEDICATION_NAME
);

// Find specific entity
const heartgard = contextManager.findEntityByValue('Heartgard');
```

### Context-Aware Follow-ups

```typescript
// Turn 1: "Show me Buddy's health records"
const intent1 = {
  intentId: 'turn-1',
  action: CommandAction.QUERY,
  target: 'health_records',
  parameters: { petName: 'Buddy' },
  // ... other fields
};
contextManager.updateContext(intent1);

// Turn 2: "What about his medications?"
// Use context to resolve "his" to "Buddy"
const activePet = contextManager.getActivePet(); // "Buddy"

// Get previous intents for additional context
const lastIntents = contextManager.getLastIntents(3);
```

### Session Management

```typescript
// Check if session is active
if (contextManager.isSessionActive()) {
  // Process voice command
}

// End session (user leaves or timeout)
contextManager.clearContext();

// Start new session
contextManager.startNewSession();
```

### Page Tracking

```typescript
// Update current page for context-aware suggestions
contextManager.updateCurrentPage('/appointments');

// Get current page
const context = contextManager.getContext();
console.log(context.currentPage); // "/appointments"
```

## API Reference

### Core Methods

#### `updateContext(intent: ParsedIntent): void`
Update context with new intent from conversation turn. Maintains 10-turn window and extracts entities.

#### `getContext(): ConversationContext`
Get current conversation context. Returns immutable copy.

#### `setActivePet(petName: string): void`
Set active pet for subsequent commands and pronoun resolution.

#### `getActivePet(): string | null`
Get currently active pet name, or null if none set.

#### `addEntity(entity: Entity): void`
Add entity to recent entities memory. Maintains 20-entity limit.

#### `clearContext(): void`
Clear all conversation history and context. Marks session as inactive.

#### `getTurnCount(): number`
Get current conversation turn count (max 10).

### Helper Methods

#### `updateCurrentPage(page: string): void`
Update current page context for context-aware suggestions.

#### `getRecentEntitiesByType(entityType: string): Entity[]`
Get recent entities of specific type.

#### `findEntityByValue(value: string): Entity | null`
Find entity by value (case-insensitive).

#### `isSessionActive(): boolean`
Check if session is currently active.

#### `startNewSession(): void`
Clear context and start new session.

#### `getLastIntents(count: number): ParsedIntent[]`
Get last N intents from conversation history.

#### `getContextSummary(): string`
Get human-readable context summary for debugging.

## Data Structures

### ConversationContext

```typescript
interface ConversationContext {
  previousIntents: ParsedIntent[];  // Last 10 intents
  activePet: string | null;         // Currently active pet
  currentPage: string;              // Current page path
  recentEntities: Entity[];         // Last 20 entities
}
```

### ParsedIntent

```typescript
interface ParsedIntent {
  intentId: string;
  action: CommandAction;
  target: string;
  parameters: Record<string, any>;
  confidence: number;
  requiresConfirmation: boolean;
  priority: "low" | "normal" | "high" | "urgent";
  entities: Entity[];
  ambiguities: string[];
}
```

### Entity

```typescript
interface Entity {
  type: EntityType;
  value: string;
  confidence: number;
  resolvedValue: any;
}
```

## Examples

See `contextManager.example.ts` for comprehensive usage examples including:
- Basic context management
- Pronoun resolution
- Entity memory
- Conversation window management
- Session management
- Context-aware follow-ups
- Context summary for debugging

## Testing

Run tests with:

```bash
npm test -- contextManager.test.ts
```

Test coverage includes:
- Conversation context storage (10-turn window)
- Active pet tracking and auto-update
- Entity memory (20 entities)
- Context cleanup on session end
- Pronoun resolution
- Context-aware follow-ups
- Session management
- Page tracking

## Integration

The Context Manager integrates with:
- **Intent Parser**: Receives parsed intents with entities
- **Command Router**: Provides context for command execution
- **Response Composer**: Uses context for natural responses
- **Dialog Manager**: Tracks multi-turn conversations

## Best Practices

1. **Update context after each turn**: Call `updateContext()` after parsing each user command
2. **Use pronoun resolution**: Check `getActivePet()` when user uses pronouns
3. **Leverage entity memory**: Use `getRecentEntitiesByType()` for disambiguation
4. **Clean up on session end**: Call `clearContext()` when user leaves or after timeout
5. **Track page changes**: Update `currentPage` for context-aware suggestions
6. **Check session state**: Verify `isSessionActive()` before processing commands

## Performance Considerations

- Context operations are O(1) for most operations
- Entity search is O(n) where n ≤ 20
- Intent history is O(n) where n ≤ 10
- Memory footprint is bounded by limits (10 turns, 20 entities)

## Future Enhancements

- Persistent context across sessions (localStorage)
- Configurable window sizes
- Context compression for long conversations
- Multi-user context isolation
- Context analytics and insights
