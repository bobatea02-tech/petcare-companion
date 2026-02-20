/**
 * CommandRouter Usage Examples
 * Feature: jojo-voice-assistant-enhanced
 * 
 * Demonstrates how to use the CommandRouter service
 */

import { commandRouter, CommandAction, ParsedIntent } from './index';
import {
  NavigationHandler,
  DataEntryHandler,
  QueryHandler,
  SchedulingHandler,
  BulkActionHandler,
} from './handlers';
import { dialogManager } from './dialogManager';
import { dashboardActions } from './dashboardActions';

/**
 * Example 1: Initialize CommandRouter with all handlers
 */
export function initializeCommandRouter() {
  // Register all command handlers
  commandRouter.registerHandler(CommandAction.NAVIGATE, new NavigationHandler());
  commandRouter.registerHandler(CommandAction.LOG_DATA, new DataEntryHandler());
  commandRouter.registerHandler(CommandAction.QUERY, new QueryHandler());
  commandRouter.registerHandler(CommandAction.SCHEDULE, new SchedulingHandler(dialogManager, dashboardActions));
  commandRouter.registerHandler(CommandAction.BULK_ACTION, new BulkActionHandler());

  console.log('CommandRouter initialized with handlers:', commandRouter.getRegisteredActions());
}

/**
 * Example 2: Execute a navigation command
 */
export async function exampleNavigationCommand() {
  const intent: ParsedIntent = {
    intentId: 'nav-001',
    action: CommandAction.NAVIGATE,
    target: 'appointments',
    parameters: {},
    confidence: 0.95,
    requiresConfirmation: false,
    priority: 'normal',
    entities: [],
    ambiguities: [],
  };

  const result = await commandRouter.executeCommand(intent);
  
  if (result.success) {
    console.log('✓ Navigation successful:', result.message);
  } else {
    console.error('✗ Navigation failed:', result.message);
  }
}

/**
 * Example 3: Execute a data entry command with missing parameters
 */
export async function exampleDataEntryWithMissingParams() {
  const intent: ParsedIntent = {
    intentId: 'data-001',
    action: CommandAction.LOG_DATA,
    target: 'feeding',
    parameters: {
      petName: 'Max',
      // Missing: amount, foodType
    },
    confidence: 0.90,
    requiresConfirmation: false,
    priority: 'normal',
    entities: [],
    ambiguities: [],
  };

  const result = await commandRouter.executeCommand(intent);
  
  if (result.requiresFollowUp) {
    console.log('ℹ Follow-up needed:', result.followUpPrompt);
    // Voice assistant would ask: "What amount should I use?"
  }
}

/**
 * Example 4: Execute a query command
 */
export async function exampleQueryCommand() {
  const intent: ParsedIntent = {
    intentId: 'query-001',
    action: CommandAction.QUERY,
    target: 'appointments',
    parameters: {
      petName: 'Bella',
    },
    confidence: 0.92,
    requiresConfirmation: false,
    priority: 'normal',
    entities: [
      {
        type: 'pet_name' as any,
        value: 'Bella',
        confidence: 0.95,
        resolvedValue: 'bella-123',
      },
    ],
    ambiguities: [],
  };

  const result = await commandRouter.executeCommand(intent);
  
  if (result.success) {
    console.log('✓ Query result:', result.message);
    console.log('  Data:', result.data);
    if (result.visualComponent) {
      console.log('  Display component:', result.visualComponent);
    }
  }
}

/**
 * Example 5: Execute a scheduling command
 */
export async function exampleSchedulingCommand() {
  const intent: ParsedIntent = {
    intentId: 'schedule-001',
    action: CommandAction.SCHEDULE,
    target: 'appointment',
    parameters: {
      petName: 'Max',
      date: '2026-02-25',
      time: '10:00 AM',
      clinic: 'Mumbai Pet Clinic',
      reason: 'Annual checkup',
    },
    confidence: 0.88,
    requiresConfirmation: true,
    priority: 'normal',
    entities: [],
    ambiguities: [],
  };

  const result = await commandRouter.executeCommand(intent);
  
  if (result.success) {
    console.log('✓ Appointment scheduled:', result.message);
  }
}

/**
 * Example 6: Execute a bulk action command
 */
export async function exampleBulkActionCommand() {
  const intent: ParsedIntent = {
    intentId: 'bulk-001',
    action: CommandAction.BULK_ACTION,
    target: 'feeding',
    parameters: {
      petFilter: 'all',
      amount: 2,
      unit: 'cups',
      foodType: 'dry food',
    },
    confidence: 0.85,
    requiresConfirmation: true,
    priority: 'normal',
    entities: [],
    ambiguities: [],
  };

  const result = await commandRouter.executeCommand(intent);
  
  if (result.success) {
    console.log('✓ Bulk action completed:', result.message);
    console.log('  Affected pets:', result.data.affectedPets);
  }
}

/**
 * Example 7: Get available commands for context
 */
export function exampleGetAvailableCommands() {
  const context = {
    previousIntents: [],
    activePet: 'Max',
    currentPage: 'dashboard',
    recentEntities: [],
  };

  const commands = commandRouter.getAvailableCommands(context);
  
  console.log('Available commands:');
  commands.forEach(cmd => {
    console.log(`\n${cmd.description}:`);
    cmd.examples.forEach(example => {
      console.log(`  - "${example}"`);
    });
  });
}

/**
 * Example 8: Handle command execution errors
 */
export async function exampleErrorHandling() {
  const intent: ParsedIntent = {
    intentId: 'error-001',
    action: 'INVALID_ACTION' as any,
    target: 'unknown',
    parameters: {},
    confidence: 0.50,
    requiresConfirmation: false,
    priority: 'normal',
    entities: [],
    ambiguities: [],
  };

  const result = await commandRouter.executeCommand(intent);
  
  if (!result.success) {
    console.error('✗ Command failed:', result.message);
    // Voice assistant would say: "No handler registered for action: INVALID_ACTION"
  }
}

/**
 * Example 9: Pet-specific navigation
 */
export async function examplePetSpecificNavigation() {
  const intent: ParsedIntent = {
    intentId: 'nav-002',
    action: CommandAction.NAVIGATE,
    target: 'health_records',
    parameters: {
      petName: 'Charlie',
    },
    confidence: 0.93,
    requiresConfirmation: false,
    priority: 'normal',
    entities: [],
    ambiguities: [],
  };

  const result = await commandRouter.executeCommand(intent);
  
  if (result.success) {
    console.log('✓ Navigated to health records for Charlie');
  }
}

/**
 * Example 10: Complete voice command flow
 */
export async function exampleCompleteFlow() {
  console.log('=== Complete Voice Command Flow ===\n');

  // Step 1: User says "Log feeding for Max"
  console.log('User: "Log feeding for Max"');
  
  // Step 2: Intent Parser creates intent (simplified)
  const intent: ParsedIntent = {
    intentId: 'flow-001',
    action: CommandAction.LOG_DATA,
    target: 'feeding',
    parameters: {
      petName: 'Max',
    },
    confidence: 0.91,
    requiresConfirmation: false,
    priority: 'normal',
    entities: [],
    ambiguities: [],
  };

  // Step 3: CommandRouter executes command
  const result = await commandRouter.executeCommand(intent);
  
  // Step 4: Handle result
  if (result.requiresFollowUp) {
    console.log(`JoJo: "${result.followUpPrompt}"`);
    
    // User provides missing info
    console.log('User: "2 cups of dry food"');
    
    // Update intent with new parameters
    intent.parameters.amount = 2;
    intent.parameters.unit = 'cups';
    intent.parameters.foodType = 'dry food';
    
    // Execute again
    const finalResult = await commandRouter.executeCommand(intent);
    
    if (finalResult.success) {
      console.log(`JoJo: "${finalResult.message}"`);
    }
  }
}

/**
 * Run all examples
 */
export async function runAllExamples() {
  console.log('=== CommandRouter Examples ===\n');
  
  // Initialize
  initializeCommandRouter();
  
  // Run examples
  await exampleNavigationCommand();
  await exampleDataEntryWithMissingParams();
  await exampleQueryCommand();
  await exampleSchedulingCommand();
  await exampleBulkActionCommand();
  exampleGetAvailableCommands();
  await exampleErrorHandling();
  await examplePetSpecificNavigation();
  await exampleCompleteFlow();
  
  console.log('\n=== Examples Complete ===');
}

// Uncomment to run examples
// runAllExamples();
