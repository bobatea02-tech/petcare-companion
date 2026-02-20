/**
 * Context Manager Usage Examples
 * Feature: jojo-voice-assistant-enhanced
 * 
 * Demonstrates how to use the ContextManager service for
 * conversation context tracking, active pet management,
 * and entity memory.
 */

import { createContextManager } from './contextManager';
import { ParsedIntent, Entity, CommandAction, EntityType } from './types';

// ============================================================================
// Example 1: Basic Context Management
// ============================================================================

function example1_BasicUsage() {
  console.log('=== Example 1: Basic Context Management ===\n');

  // Create context manager with initial page
  const contextManager = createContextManager('/dashboard');

  // Simulate first turn: "Show me Buddy's health records"
  const intent1: ParsedIntent = {
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

  contextManager.updateContext(intent1);
  console.log('Turn 1: "Show me Buddy\'s health records"');
  console.log('Active Pet:', contextManager.getActivePet());
  console.log('Turn Count:', contextManager.getTurnCount());
  console.log();

  // Simulate second turn: "What about his medications?"
  const intent2: ParsedIntent = {
    intentId: 'turn-2',
    action: CommandAction.QUERY,
    target: 'medications',
    parameters: {},
    confidence: 0.9,
    requiresConfirmation: false,
    priority: 'normal',
    entities: [],
    ambiguities: []
  };

  contextManager.updateContext(intent2);
  console.log('Turn 2: "What about his medications?"');
  console.log('Active Pet (resolved from "his"):', contextManager.getActivePet());
  console.log('Turn Count:', contextManager.getTurnCount());
  console.log();
}

// ============================================================================
// Example 2: Pronoun Resolution
// ============================================================================

function example2_PronounResolution() {
  console.log('=== Example 2: Pronoun Resolution ===\n');

  const contextManager = createContextManager();

  // User says: "Log feeding for Luna"
  contextManager.setActivePet('Luna');
  console.log('User: "Log feeding for Luna"');
  console.log('Active Pet set to:', contextManager.getActivePet());
  console.log();

  // User says: "Give her 2 cups of food"
  // "her" should resolve to "Luna"
  const activePet = contextManager.getActivePet();
  console.log('User: "Give her 2 cups of food"');
  console.log('Resolved "her" to:', activePet);
  console.log();

  // User says: "What's her weight?"
  console.log('User: "What\'s her weight?"');
  console.log('Resolved "her" to:', contextManager.getActivePet());
  console.log();
}

// ============================================================================
// Example 3: Entity Memory
// ============================================================================

function example3_EntityMemory() {
  console.log('=== Example 3: Entity Memory ===\n');

  const contextManager = createContextManager();

  // Add various entities from conversation
  const entities: Entity[] = [
    {
      type: EntityType.PET_NAME,
      value: 'Max',
      confidence: 0.95,
      resolvedValue: 'Max'
    },
    {
      type: EntityType.MEDICATION_NAME,
      value: 'Heartgard',
      confidence: 0.9,
      resolvedValue: 'Heartgard'
    },
    {
      type: EntityType.AMOUNT,
      value: '2',
      confidence: 0.95,
      resolvedValue: 2
    },
    {
      type: EntityType.UNIT,
      value: 'cups',
      confidence: 0.9,
      resolvedValue: 'cups'
    },
    {
      type: EntityType.DATE,
      value: 'tomorrow',
      confidence: 0.85,
      resolvedValue: new Date(Date.now() + 86400000)
    }
  ];

  entities.forEach(entity => {
    contextManager.addEntity(entity);
    console.log(`Added entity: ${entity.type} = ${entity.value}`);
  });
  console.log();

  // Retrieve entities by type
  const petEntities = contextManager.getRecentEntitiesByType(EntityType.PET_NAME);
  console.log('Pet name entities:', petEntities.map(e => e.value));

  const medicationEntities = contextManager.getRecentEntitiesByType(EntityType.MEDICATION_NAME);
  console.log('Medication entities:', medicationEntities.map(e => e.value));
  console.log();

  // Find specific entity
  const heartgard = contextManager.findEntityByValue('Heartgard');
  console.log('Found Heartgard:', heartgard?.type, heartgard?.value);
  console.log();
}

// ============================================================================
// Example 4: Conversation Window Management
// ============================================================================

function example4_ConversationWindow() {
  console.log('=== Example 4: Conversation Window (10 turns) ===\n');

  const contextManager = createContextManager();

  // Add 15 conversation turns
  console.log('Adding 15 conversation turns...');
  for (let i = 1; i <= 15; i++) {
    const intent: ParsedIntent = {
      intentId: `turn-${i}`,
      action: CommandAction.QUERY,
      target: 'health',
      parameters: {},
      confidence: 0.9,
      requiresConfirmation: false,
      priority: 'normal',
      entities: [],
      ambiguities: []
    };
    contextManager.updateContext(intent);
  }

  console.log('Total turns added: 15');
  console.log('Turns in context (max 10):', contextManager.getTurnCount());
  console.log();

  // Get context to see which turns are kept
  const context = contextManager.getContext();
  console.log('Oldest turn kept:', context.previousIntents[0].intentId);
  console.log('Newest turn kept:', context.previousIntents[9].intentId);
  console.log();

  // Get last 3 turns
  const last3 = contextManager.getLastIntents(3);
  console.log('Last 3 turns:', last3.map(i => i.intentId));
  console.log();
}

// ============================================================================
// Example 5: Session Management
// ============================================================================

function example5_SessionManagement() {
  console.log('=== Example 5: Session Management ===\n');

  const contextManager = createContextManager();

  // Start conversation
  console.log('Session active:', contextManager.isSessionActive());
  
  contextManager.setActivePet('Charlie');
  const entity: Entity = {
    type: EntityType.PET_NAME,
    value: 'Charlie',
    confidence: 0.95,
    resolvedValue: 'Charlie'
  };
  contextManager.addEntity(entity);

  console.log('Active pet:', contextManager.getActivePet());
  console.log('Entities:', contextManager.getContext().recentEntities.length);
  console.log();

  // End session (user leaves or 30 min timeout)
  console.log('Ending session...');
  contextManager.clearContext();
  console.log('Session active:', contextManager.isSessionActive());
  console.log('Active pet:', contextManager.getActivePet());
  console.log('Entities:', contextManager.getContext().recentEntities.length);
  console.log();

  // Start new session
  console.log('Starting new session...');
  contextManager.startNewSession();
  console.log('Session active:', contextManager.isSessionActive());
  console.log('Turn count:', contextManager.getTurnCount());
  console.log();
}

// ============================================================================
// Example 6: Context-Aware Follow-ups
// ============================================================================

function example6_ContextAwareFollowups() {
  console.log('=== Example 6: Context-Aware Follow-ups ===\n');

  const contextManager = createContextManager('/dashboard');

  // Turn 1: "Show me all my pets"
  const intent1: ParsedIntent = {
    intentId: 'turn-1',
    action: CommandAction.NAVIGATE,
    target: 'pets',
    parameters: {},
    confidence: 0.95,
    requiresConfirmation: false,
    priority: 'normal',
    entities: [],
    ambiguities: []
  };
  contextManager.updateContext(intent1);
  console.log('Turn 1: "Show me all my pets"');
  console.log('Action:', intent1.action, '| Target:', intent1.target);
  console.log();

  // Turn 2: "Go to Max's profile"
  const intent2: ParsedIntent = {
    intentId: 'turn-2',
    action: CommandAction.NAVIGATE,
    target: 'pet_profile',
    parameters: { petName: 'Max' },
    confidence: 0.92,
    requiresConfirmation: false,
    priority: 'normal',
    entities: [
      {
        type: EntityType.PET_NAME,
        value: 'Max',
        confidence: 0.95,
        resolvedValue: 'Max'
      }
    ],
    ambiguities: []
  };
  contextManager.updateContext(intent2);
  console.log('Turn 2: "Go to Max\'s profile"');
  console.log('Active Pet:', contextManager.getActivePet());
  console.log();

  // Turn 3: "Show his health records" (follow-up using pronoun)
  const intent3: ParsedIntent = {
    intentId: 'turn-3',
    action: CommandAction.QUERY,
    target: 'health_records',
    parameters: {},
    confidence: 0.88,
    requiresConfirmation: false,
    priority: 'normal',
    entities: [],
    ambiguities: []
  };
  contextManager.updateContext(intent3);
  console.log('Turn 3: "Show his health records"');
  console.log('Resolved "his" to:', contextManager.getActivePet());
  console.log();

  // Turn 4: "What medications does he need?" (another follow-up)
  const intent4: ParsedIntent = {
    intentId: 'turn-4',
    action: CommandAction.QUERY,
    target: 'medications',
    parameters: {},
    confidence: 0.9,
    requiresConfirmation: false,
    priority: 'normal',
    entities: [],
    ambiguities: []
  };
  contextManager.updateContext(intent4);
  console.log('Turn 4: "What medications does he need?"');
  console.log('Resolved "he" to:', contextManager.getActivePet());
  console.log('Turn count:', contextManager.getTurnCount());
  console.log();
}

// ============================================================================
// Example 7: Context Summary for Debugging
// ============================================================================

function example7_ContextSummary() {
  console.log('=== Example 7: Context Summary ===\n');

  const contextManager = createContextManager('/pets');

  // Add some context
  contextManager.setActivePet('Bella');
  contextManager.updateCurrentPage('/health');

  const entities: Entity[] = [
    { type: EntityType.PET_NAME, value: 'Bella', confidence: 0.95, resolvedValue: 'Bella' },
    { type: EntityType.DATE, value: 'today', confidence: 0.9, resolvedValue: new Date() },
    { type: EntityType.AMOUNT, value: '3', confidence: 0.95, resolvedValue: 3 }
  ];
  entities.forEach(e => contextManager.addEntity(e));

  const intent: ParsedIntent = {
    intentId: 'test-intent',
    action: CommandAction.LOG_DATA,
    target: 'feeding',
    parameters: {},
    confidence: 0.9,
    requiresConfirmation: false,
    priority: 'normal',
    entities: [],
    ambiguities: []
  };
  contextManager.updateContext(intent);

  // Print summary
  console.log(contextManager.getContextSummary());
  console.log();
}

// ============================================================================
// Run All Examples
// ============================================================================

export function runAllExamples() {
  example1_BasicUsage();
  example2_PronounResolution();
  example3_EntityMemory();
  example4_ConversationWindow();
  example5_SessionManagement();
  example6_ContextAwareFollowups();
  example7_ContextSummary();
}

// Uncomment to run examples
// runAllExamples();
