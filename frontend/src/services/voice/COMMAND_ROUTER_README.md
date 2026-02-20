# CommandRouter Service

## Overview

The CommandRouter service is responsible for routing parsed voice intents to appropriate command handlers. It implements the Command Pattern with a handler registry for different command types (navigation, data entry, queries, scheduling, and bulk actions).

## Features

- **Handler Registry**: Register and manage command handlers for different action types
- **Command Validation**: Validate commands before execution with parameter checking
- **Error Handling**: Graceful error handling with user-friendly error messages
- **Multi-turn Dialog Support**: Support for commands requiring follow-up questions
- **Context-Aware Commands**: Get available commands based on current context

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                      CommandRouter                           │
│  ┌────────────────────────────────────────────────────────┐ │
│  │              Handler Registry                          │ │
│  │  - NavigationHandler                                   │ │
│  │  - DataEntryHandler                                    │ │
│  │  - QueryHandler                                        │ │
│  │  - SchedulingHandler                                   │ │
│  │  - BulkActionHandler                                   │ │
│  └────────────────────────────────────────────────────────┘ │
│                                                              │
│  executeCommand(intent) → handler.execute() → CommandResult │
└─────────────────────────────────────────────────────────────┘
```

## Usage

### Basic Setup

```typescript
import { commandRouter, CommandAction } from '@/services/voice';
import {
  NavigationHandler,
  DataEntryHandler,
  QueryHandler,
  SchedulingHandler,
  BulkActionHandler,
} from '@/services/voice/handlers';

// Register handlers
commandRouter.registerHandler(CommandAction.NAVIGATE, new NavigationHandler());
commandRouter.registerHandler(CommandAction.LOG_DATA, new DataEntryHandler());
commandRouter.registerHandler(CommandAction.QUERY, new QueryHandler());
commandRouter.registerHandler(CommandAction.SCHEDULE, new SchedulingHandler());
commandRouter.registerHandler(CommandAction.BULK_ACTION, new BulkActionHandler());
```

### Execute a Command

```typescript
// Parse intent from voice input
const intent: ParsedIntent = {
  intentId: '123',
  action: CommandAction.NAVIGATE,
  target: 'appointments',
  parameters: {},
  confidence: 0.95,
  requiresConfirmation: false,
  priority: 'normal',
  entities: [],
  ambiguities: [],
};

// Execute the command
const result = await commandRouter.executeCommand(intent);

if (result.success) {
  console.log('Command executed:', result.message);
  // Display visual component if provided
  if (result.visualComponent) {
    // Render result.visualComponent with result.data
  }
} else {
  console.error('Command failed:', result.message);
}
```

### Get Available Commands

```typescript
const context: ConversationContext = {
  previousIntents: [],
  activePet: 'Max',
  currentPage: 'dashboard',
  recentEntities: [],
};

const availableCommands = commandRouter.getAvailableCommands(context);

// Display command suggestions to user
availableCommands.forEach(cmd => {
  console.log(`${cmd.description}:`);
  cmd.examples.forEach(example => console.log(`  - "${example}"`));
});
```

## Command Handlers

### NavigationHandler

Handles navigation commands for moving between dashboard sections.

**Supported Commands:**
- "Go to appointments"
- "Show health records"
- "Open medication tracker"
- "Show all my pets"
- "Go back"

**Requirements:** 4.1, 4.5, 4.6

### DataEntryHandler

Handles logging pet care activities.

**Supported Commands:**
- "Log feeding for Max"
- "Add medication reminder"
- "Record weight for Bella"
- "Log walk activity"

**Requirements:** 5.1, 5.2, 5.4, 5.5

### QueryHandler

Handles queries for pet information.

**Supported Commands:**
- "When is Max's next appointment?"
- "What medications does Bella need today?"
- "Show feeding history for Charlie"
- "What's Luna's health score?"

**Requirements:** 6.1, 6.2, 6.3, 6.4

### SchedulingHandler

Handles appointment scheduling.

**Supported Commands:**
- "Schedule a vet appointment for Max"
- "Book appointment for next Tuesday"
- "Cancel appointment for Bella"

**Requirements:** 11.1, 11.2, 11.3, 11.4

### BulkActionHandler

Handles operations on multiple pets.

**Supported Commands:**
- "Log feeding for all pets"
- "Show health summary for all pets"
- "Log feeding for all dogs"

**Requirements:** 19.1, 19.2, 19.3, 19.4

## Command Result Structure

```typescript
interface CommandResult {
  success: boolean;           // Whether command executed successfully
  data: any;                  // Result data (varies by command)
  message: string;            // User-friendly message to speak/display
  visualComponent: string | null;  // Component name to render (optional)
  requiresFollowUp: boolean;  // Whether follow-up question is needed
  followUpPrompt: string | null;   // Follow-up question to ask user
}
```

## Multi-turn Dialog Support

Handlers can request additional information by returning a result with `requiresFollowUp: true`:

```typescript
// Handler detects missing information
return {
  success: false,
  data: { missingFields: ['pet name', 'amount'] },
  message: 'I need more information to log feeding',
  visualComponent: null,
  requiresFollowUp: true,
  followUpPrompt: 'What pet name should I use?',
};
```

The voice assistant will then ask the follow-up question and collect the missing information.

## Error Handling

The CommandRouter provides comprehensive error handling:

1. **Missing Handler**: Returns error if no handler registered for action
2. **Validation Failure**: Returns error if required parameters are missing
3. **Execution Error**: Catches and returns handler execution errors
4. **User-Friendly Messages**: All errors include helpful messages for users

## Creating Custom Handlers

To create a custom handler, implement the `CommandHandler` interface:

```typescript
import { CommandHandler, ParsedIntent, ConversationContext, CommandResult } from '@/services/voice';

export class MyCustomHandler implements CommandHandler {
  async execute(
    intent: ParsedIntent,
    context: ConversationContext
  ): Promise<CommandResult> {
    // Your implementation here
    return {
      success: true,
      data: {},
      message: 'Command executed successfully',
      visualComponent: null,
      requiresFollowUp: false,
      followUpPrompt: null,
    };
  }

  canExecute(intent: ParsedIntent): boolean {
    // Validate if command can be executed
    return true;
  }

  getRequiredParameters(): string[] {
    // Return list of required parameter names
    return ['param1', 'param2'];
  }
}

// Register your handler
commandRouter.registerHandler(CommandAction.CUSTOM, new MyCustomHandler());
```

## Testing

The CommandRouter can be tested by registering mock handlers:

```typescript
import { commandRouter, CommandAction } from '@/services/voice';

// Create mock handler
const mockHandler = {
  execute: jest.fn().mockResolvedValue({
    success: true,
    data: {},
    message: 'Test success',
    visualComponent: null,
    requiresFollowUp: false,
    followUpPrompt: null,
  }),
  canExecute: jest.fn().mockReturnValue(true),
  getRequiredParameters: jest.fn().mockReturnValue([]),
};

// Register mock handler
commandRouter.registerHandler(CommandAction.NAVIGATE, mockHandler);

// Test command execution
const result = await commandRouter.executeCommand(testIntent);
expect(result.success).toBe(true);
expect(mockHandler.execute).toHaveBeenCalled();
```

## Integration with Voice Pipeline

The CommandRouter fits into the voice pipeline as follows:

```
User Speech
    ↓
Voice Recognition Engine (speech → text)
    ↓
Intent Parser (text → ParsedIntent)
    ↓
CommandRouter (ParsedIntent → CommandResult)
    ↓
Response Composer (CommandResult → Response)
    ↓
TTS Engine (Response → Audio)
```

## Requirements Mapping

- **Requirement 4.1**: Pet-specific navigation via NavigationHandler
- **Requirement 4.5**: Navigation history via NavigationHandler
- **Requirement 4.6**: Full dashboard navigation via NavigationHandler
- **Requirement 5.1**: Multi-turn data entry via DataEntryHandler
- **Requirement 6.1**: Pet-specific queries via QueryHandler
- **Requirement 11.1**: Appointment scheduling via SchedulingHandler
- **Requirement 19.1**: Bulk actions via BulkActionHandler

## Future Enhancements

- [ ] Add handler priority system for overlapping commands
- [ ] Implement handler middleware for cross-cutting concerns
- [ ] Add command history and undo functionality
- [ ] Support for command chaining (execute multiple commands in sequence)
- [ ] Add analytics for command usage tracking
