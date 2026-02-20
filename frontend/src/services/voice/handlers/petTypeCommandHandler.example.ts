/**
 * Pet Type Command Handler - Example Usage
 * Feature: jojo-voice-assistant-enhanced
 * 
 * Demonstrates how to use the PetTypeCommandHandler for pet-type-specific
 * activity logging and command validation.
 */

import { petTypeCommandHandler, PetType } from './petTypeCommandHandler';
import { ParsedIntent, CommandAction, ConversationContext, EntityType } from '../types';

// ============================================================================
// Example 1: Get Command Suggestions for Different Pet Types
// ============================================================================

export function exampleGetSuggestions() {
  console.log('=== Pet Type Command Suggestions ===\n');

  // Get suggestions for a dog
  const dogSuggestions = petTypeCommandHandler.getCommandSuggestionsForPetType(PetType.DOG);
  console.log('Dog commands:', dogSuggestions);
  // Output: ["Log walk", "Log training", "Log grooming"]

  // Get suggestions for a cat
  const catSuggestions = petTypeCommandHandler.getCommandSuggestionsForPetType(PetType.CAT);
  console.log('Cat commands:', catSuggestions);
  // Output: ["Log litter box", "Log grooming"]

  // Get suggestions for a bird
  const birdSuggestions = petTypeCommandHandler.getCommandSuggestionsForPetType(PetType.BIRD);
  console.log('Bird commands:', birdSuggestions);
  // Output: ["Log cage cleaning", "Log wing clipping"]

  // Get suggestions for a fish
  const fishSuggestions = petTypeCommandHandler.getCommandSuggestionsForPetType(PetType.FISH);
  console.log('Fish commands:', fishSuggestions);
  // Output: ["Log water change", "Log tank maintenance"]
}

// ============================================================================
// Example 2: Log a Walk for a Dog
// ============================================================================

export async function exampleLogDogWalk() {
  console.log('\n=== Log Dog Walk ===\n');

  const intent: ParsedIntent = {
    intentId: 'intent-1',
    action: CommandAction.LOG_DATA,
    target: 'walk',
    parameters: {
      petId: 'dog-123',
      petName: 'Max',
      duration: 30,
      notes: 'Morning walk in the park',
    },
    confidence: 0.95,
    requiresConfirmation: false,
    priority: 'normal',
    entities: [
      {
        type: EntityType.PET_NAME,
        value: 'Max',
        confidence: 0.95,
        resolvedValue: 'dog-123',
      },
      {
        type: EntityType.PET_TYPE,
        value: 'dog',
        confidence: 0.95,
        resolvedValue: PetType.DOG,
      },
      {
        type: EntityType.ACTIVITY_TYPE,
        value: 'walk',
        confidence: 0.95,
        resolvedValue: 'walk',
      },
    ],
    ambiguities: [],
  };

  const context: ConversationContext = {
    previousIntents: [],
    activePet: 'Max',
    currentPage: 'dashboard',
    recentEntities: [
      {
        type: EntityType.PET_TYPE,
        value: 'dog',
        confidence: 0.95,
        resolvedValue: PetType.DOG,
      },
    ],
  };

  const result = await petTypeCommandHandler.execute(intent, context);
  console.log('Result:', result);
  // Expected: Success with message "Logged walk for 30 minutes for your Dog"
}

// ============================================================================
// Example 3: Log Litter Box Change for a Cat
// ============================================================================

export async function exampleLogCatLitterBox() {
  console.log('\n=== Log Cat Litter Box Change ===\n');

  const intent: ParsedIntent = {
    intentId: 'intent-2',
    action: CommandAction.LOG_DATA,
    target: 'litter_box',
    parameters: {
      petId: 'cat-456',
      petName: 'Whiskers',
    },
    confidence: 0.92,
    requiresConfirmation: false,
    priority: 'normal',
    entities: [
      {
        type: EntityType.PET_NAME,
        value: 'Whiskers',
        confidence: 0.92,
        resolvedValue: 'cat-456',
      },
      {
        type: EntityType.PET_TYPE,
        value: 'cat',
        confidence: 0.92,
        resolvedValue: PetType.CAT,
      },
    ],
    ambiguities: [],
  };

  const context: ConversationContext = {
    previousIntents: [],
    activePet: 'Whiskers',
    currentPage: 'dashboard',
    recentEntities: [
      {
        type: EntityType.PET_TYPE,
        value: 'cat',
        confidence: 0.92,
        resolvedValue: PetType.CAT,
      },
    ],
  };

  const result = await petTypeCommandHandler.execute(intent, context);
  console.log('Result:', result);
  // Expected: Success with message "Logged litter box for your Cat"
}

// ============================================================================
// Example 4: Invalid Command - Try to Log Walk for a Fish
// ============================================================================

export async function exampleInvalidCommand() {
  console.log('\n=== Invalid Command: Log Walk for Fish ===\n');

  const intent: ParsedIntent = {
    intentId: 'intent-3',
    action: CommandAction.LOG_DATA,
    target: 'walk',
    parameters: {
      petId: 'fish-789',
      petName: 'Nemo',
    },
    confidence: 0.88,
    requiresConfirmation: false,
    priority: 'normal',
    entities: [
      {
        type: EntityType.PET_NAME,
        value: 'Nemo',
        confidence: 0.88,
        resolvedValue: 'fish-789',
      },
      {
        type: EntityType.PET_TYPE,
        value: 'fish',
        confidence: 0.88,
        resolvedValue: PetType.FISH,
      },
    ],
    ambiguities: [],
  };

  const context: ConversationContext = {
    previousIntents: [],
    activePet: 'Nemo',
    currentPage: 'dashboard',
    recentEntities: [
      {
        type: EntityType.PET_TYPE,
        value: 'fish',
        confidence: 0.88,
        resolvedValue: PetType.FISH,
      },
    ],
  };

  const result = await petTypeCommandHandler.execute(intent, context);
  console.log('Result:', result);
  // Expected: Failure with message suggesting valid fish activities
  // "I can't log "walk" for Fishs. For Fishs, I can log: water_change, tank_maintenance."
}

// ============================================================================
// Example 5: Get Contextual Suggestions Based on Active Pet
// ============================================================================

export async function exampleContextualSuggestions() {
  console.log('\n=== Contextual Suggestions ===\n');

  // Context with a dog as active pet
  const dogContext: ConversationContext = {
    previousIntents: [],
    activePet: 'Max',
    currentPage: 'dashboard',
    recentEntities: [
      {
        type: EntityType.PET_TYPE,
        value: 'dog',
        confidence: 0.95,
        resolvedValue: PetType.DOG,
      },
    ],
  };

  const dogSuggestions = await petTypeCommandHandler.getContextualSuggestions(dogContext);
  console.log('Suggestions for dog (Max):', dogSuggestions);
  // Expected: ["Log walk", "Log training", "Log grooming"]

  // Context with a bird as active pet
  const birdContext: ConversationContext = {
    previousIntents: [],
    activePet: 'Tweety',
    currentPage: 'dashboard',
    recentEntities: [
      {
        type: EntityType.PET_TYPE,
        value: 'bird',
        confidence: 0.93,
        resolvedValue: PetType.BIRD,
      },
    ],
  };

  const birdSuggestions = await petTypeCommandHandler.getContextualSuggestions(birdContext);
  console.log('Suggestions for bird (Tweety):', birdSuggestions);
  // Expected: ["Log cage cleaning", "Log wing clipping"]
}

// ============================================================================
// Example 6: Get Supported Activities for a Pet Type
// ============================================================================

export function exampleGetSupportedActivities() {
  console.log('\n=== Supported Activities ===\n');

  // Get all supported activities for dogs
  const dogActivities = petTypeCommandHandler.getSupportedActivities(PetType.DOG);
  console.log('Dog activities:', dogActivities);
  // Expected: Array of ActivityMetadata objects with walk, training, grooming

  // Get all supported activities for fish
  const fishActivities = petTypeCommandHandler.getSupportedActivities(PetType.FISH);
  console.log('Fish activities:', fishActivities);
  // Expected: Array of ActivityMetadata objects with water_change, tank_maintenance
}

// ============================================================================
// Example 7: Log Activity with Missing Required Notes
// ============================================================================

export async function exampleMissingRequiredNotes() {
  console.log('\n=== Missing Required Notes ===\n');

  const intent: ParsedIntent = {
    intentId: 'intent-4',
    action: CommandAction.LOG_DATA,
    target: 'training',
    parameters: {
      petId: 'dog-123',
      petName: 'Max',
      duration: 20,
      // Missing notes (required for training)
    },
    confidence: 0.90,
    requiresConfirmation: false,
    priority: 'normal',
    entities: [
      {
        type: EntityType.PET_NAME,
        value: 'Max',
        confidence: 0.90,
        resolvedValue: 'dog-123',
      },
      {
        type: EntityType.PET_TYPE,
        value: 'dog',
        confidence: 0.90,
        resolvedValue: PetType.DOG,
      },
    ],
    ambiguities: [],
  };

  const context: ConversationContext = {
    previousIntents: [],
    activePet: 'Max',
    currentPage: 'dashboard',
    recentEntities: [
      {
        type: EntityType.PET_TYPE,
        value: 'dog',
        confidence: 0.90,
        resolvedValue: PetType.DOG,
      },
    ],
  };

  const result = await petTypeCommandHandler.execute(intent, context);
  console.log('Result:', result);
  // Expected: Failure with requiresFollowUp=true
  // Message: "I need some notes about the training"
  // FollowUpPrompt: "What would you like to note about this training?"
}

// ============================================================================
// Run All Examples
// ============================================================================

export async function runAllExamples() {
  exampleGetSuggestions();
  await exampleLogDogWalk();
  await exampleLogCatLitterBox();
  await exampleInvalidCommand();
  await exampleContextualSuggestions();
  exampleGetSupportedActivities();
  await exampleMissingRequiredNotes();
}

// Uncomment to run examples
// runAllExamples();
