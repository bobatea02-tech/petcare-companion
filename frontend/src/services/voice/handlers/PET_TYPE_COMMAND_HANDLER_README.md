# Pet Type Command Handler

## Overview

The `PetTypeCommandHandler` is a specialized command handler that manages pet-type-specific activity logging and command validation for the JoJo Voice Assistant. It ensures that voice commands are appropriate for the type of pet (dog, cat, bird, or fish) and provides contextual suggestions based on the active pet.

## Features

### 1. Pet-Type-Specific Activity Logging

The handler supports different activities for each pet type:

**Dogs:**
- Walk (suggested duration: 30 minutes)
- Training (suggested duration: 20 minutes, requires notes)
- Grooming (suggested duration: 45 minutes)

**Cats:**
- Litter box change
- Grooming (suggested duration: 30 minutes)

**Birds:**
- Cage cleaning
- Wing clipping (requires notes)

**Fish:**
- Water change
- Tank maintenance (requires notes)

### 2. Command Validation

The handler validates that commands are appropriate for the pet type. If a user tries to log an inappropriate activity (e.g., "log walk for my fish"), the handler will:
- Politely indicate the mismatch
- Suggest appropriate activities for that pet type
- Prevent execution of the inappropriate command

### 3. Pet-Type-Aware Suggestions

The handler provides contextual command suggestions based on the active pet's type, helping users discover relevant voice commands.

## Usage

### Basic Activity Logging

```typescript
import { petTypeCommandHandler, PetType } from './handlers/petTypeCommandHandler';

// Get suggestions for a dog
const dogSuggestions = petTypeCommandHandler.getCommandSuggestionsForPetType(PetType.DOG);
// Returns: ["Log walk", "Log training", "Log grooming"]

// Get contextual suggestions based on active pet
const suggestions = await petTypeCommandHandler.getContextualSuggestions(context);
```

### Voice Command Examples

**Valid Commands:**
- "Log walk for Max" (if Max is a dog)
- "Log litter box change for Whiskers" (if Whiskers is a cat)
- "Log cage cleaning for Tweety" (if Tweety is a bird)
- "Log water change for Nemo" (if Nemo is a fish)

**Invalid Commands (will be rejected):**
- "Log walk for my fish" → Suggests: water change, tank maintenance
- "Log litter box for my dog" → Suggests: walk, training, grooming

## Integration

### With CommandRouter

The handler integrates with the CommandRouter for LOG_DATA actions:

```typescript
import { commandRouter } from './commandRouter';
import { petTypeCommandHandler } from './handlers/petTypeCommandHandler';
import { CommandAction } from './types';

// Register the handler
commandRouter.registerHandler(CommandAction.LOG_DATA, petTypeCommandHandler);
```

### With Voice Command Suggestions

The handler can be used to provide pet-type-aware suggestions in the UI:

```typescript
import { petTypeCommandHandler } from './handlers/petTypeCommandHandler';

// In a React component
const VoiceCommandSuggestions = ({ activePet, context }) => {
  const [suggestions, setSuggestions] = useState<string[]>([]);
  
  useEffect(() => {
    const loadSuggestions = async () => {
      const contextualSuggestions = await petTypeCommandHandler.getContextualSuggestions(context);
      setSuggestions(contextualSuggestions);
    };
    
    loadSuggestions();
  }, [activePet, context]);
  
  return (
    <div>
      {suggestions.map(suggestion => (
        <div key={suggestion}>{suggestion}</div>
      ))}
    </div>
  );
};
```

## API Integration

The handler integrates with the pet data API to fetch pet type information:

```typescript
// Fetches pet data from /v1/pets/{petId}
const petType = await getPetType(petId, context);
```

The API response should include a `species` field with one of: `dog`, `cat`, `bird`, `fish`.

## Requirements Validation

This handler validates the following requirements:

- **Requirement 17.1**: Dogs support walks, training, and grooming
- **Requirement 17.2**: Cats support litter box changes and grooming
- **Requirement 17.3**: Birds support cage cleaning and wing clipping
- **Requirement 17.4**: Fish support water changes and tank maintenance
- **Requirement 17.5**: Pet type recognition and relevant command suggestions
- **Requirement 17.6**: Polite mismatch indication for inappropriate commands

## Testing

Property-based tests should validate:

- **Property 53**: Pet-type-specific command support for all pet types
- **Property 54**: Pet-type-aware suggestions for active pet context
- **Property 55**: Pet-type command validation and mismatch indication

## Error Handling

The handler gracefully handles:
- Missing pet type information (requests clarification)
- API failures (returns error with helpful message)
- Invalid activity types (suggests valid alternatives)
- Missing required fields (prompts for additional information)

## Future Enhancements

Potential improvements:
- Support for additional pet types (rabbits, hamsters, etc.)
- Customizable activity types per pet
- Activity history tracking and suggestions
- Integration with pet health tracking
