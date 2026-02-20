/**
 * CommandRouter Service
 * Feature: jojo-voice-assistant-enhanced
 * 
 * Routes parsed voice intents to appropriate command handlers.
 * Implements command pattern with handler registry for different command types.
 * 
 * Requirements: 4.1, 4.5, 4.6, 5.1, 6.1, 11.1, 19.1
 */

import {
  CommandRouter as ICommandRouter,
  CommandHandler,
  CommandAction,
  ParsedIntent,
  CommandResult,
  ConversationContext,
  CommandInfo,
} from './types';

/**
 * CommandRouter implementation
 * Manages command handler registry and routes commands to appropriate handlers
 */
export class CommandRouter implements ICommandRouter {
  private handlers: Map<CommandAction, CommandHandler> = new Map();

  /**
   * Register a command handler for a specific action type
   * @param action - The command action type
   * @param handler - The handler implementation
   */
  registerHandler(action: CommandAction, handler: CommandHandler): void {
    if (this.handlers.has(action)) {
      console.warn(`Handler for action ${action} is being overwritten`);
    }
    this.handlers.set(action, handler);
  }

  /**
   * Execute a command by routing to the appropriate handler
   * @param intent - The parsed intent to execute
   * @returns Promise resolving to command result
   */
  async executeCommand(intent: ParsedIntent): Promise<CommandResult> {
    try {
      // Validate intent has required fields
      if (!intent.action) {
        return this.createErrorResult('Command action is missing');
      }

      // Get handler for this action
      const handler = this.handlers.get(intent.action);
      
      if (!handler) {
        return this.createErrorResult(
          `No handler registered for action: ${intent.action}`,
          intent
        );
      }

      // Validate handler can execute this command
      if (!handler.canExecute(intent)) {
        const requiredParams = handler.getRequiredParameters();
        const missingParams = requiredParams.filter(
          param => !(param in intent.parameters)
        );
        
        return this.createErrorResult(
          `Cannot execute command. Missing required parameters: ${missingParams.join(', ')}`,
          intent
        );
      }

      // Execute the command
      const result = await handler.execute(intent, this.getContextForHandler());
      
      return result;
    } catch (error) {
      console.error('Error executing command:', error);
      return this.createErrorResult(
        error instanceof Error ? error.message : 'Unknown error occurred',
        intent
      );
    }
  }

  /**
   * Get available commands for the current context
   * @param context - Current conversation context
   * @returns Array of available command information
   */
  getAvailableCommands(context: ConversationContext): CommandInfo[] {
    const commands: CommandInfo[] = [];

    // Navigation commands
    if (this.handlers.has(CommandAction.NAVIGATE)) {
      commands.push({
        action: CommandAction.NAVIGATE,
        description: 'Navigate to different sections of the dashboard',
        examples: [
          'Go to appointments',
          'Show me health records',
          'Open medication tracker',
          'Show all my pets',
        ],
      });
    }

    // Data entry commands
    if (this.handlers.has(CommandAction.LOG_DATA)) {
      commands.push({
        action: CommandAction.LOG_DATA,
        description: 'Log pet care activities',
        examples: [
          'Log feeding for Max',
          'Add medication reminder',
          'Record weight for Bella',
          'Log walk activity',
        ],
      });
    }

    // Query commands
    if (this.handlers.has(CommandAction.QUERY)) {
      commands.push({
        action: CommandAction.QUERY,
        description: 'Query pet information and records',
        examples: [
          "When is Max's next appointment?",
          'What medications does Bella need today?',
          "Show feeding history for Charlie",
          "What's Luna's health score?",
        ],
      });
    }

    // Scheduling commands
    if (this.handlers.has(CommandAction.SCHEDULE)) {
      commands.push({
        action: CommandAction.SCHEDULE,
        description: 'Schedule appointments and reminders',
        examples: [
          'Schedule a vet appointment for Max',
          'Book appointment for next Tuesday',
          'Set medication reminder',
        ],
      });
    }

    // Bulk action commands
    if (this.handlers.has(CommandAction.BULK_ACTION)) {
      commands.push({
        action: CommandAction.BULK_ACTION,
        description: 'Perform actions for multiple pets',
        examples: [
          'Log feeding for all pets',
          'Show health summary for all pets',
          'Log feeding for all dogs',
        ],
      });
    }

    // Help commands
    if (this.handlers.has(CommandAction.HELP)) {
      commands.push({
        action: CommandAction.HELP,
        description: 'Get help and command suggestions',
        examples: [
          'What can you do?',
          'Help',
          'Show me available commands',
        ],
      });
    }

    return commands;
  }

  /**
   * Create an error result
   * @param message - Error message
   * @param intent - Optional intent that caused the error
   * @returns CommandResult with error information
   */
  private createErrorResult(message: string, intent?: ParsedIntent): CommandResult {
    return {
      success: false,
      data: null,
      message,
      visualComponent: null,
      requiresFollowUp: false,
      followUpPrompt: null,
    };
  }

  /**
   * Get context for handler execution
   * This is a placeholder - in real implementation, this would get actual context
   * @returns Conversation context
   */
  private getContextForHandler(): ConversationContext {
    // TODO: Integrate with actual ContextManager
    return {
      previousIntents: [],
      activePet: null,
      currentPage: 'dashboard',
      recentEntities: [],
    };
  }

  /**
   * Unregister a handler (useful for testing or dynamic handler management)
   * @param action - The command action to unregister
   */
  unregisterHandler(action: CommandAction): void {
    this.handlers.delete(action);
  }

  /**
   * Check if a handler is registered for an action
   * @param action - The command action to check
   * @returns True if handler is registered
   */
  hasHandler(action: CommandAction): boolean {
    return this.handlers.has(action);
  }

  /**
   * Get all registered actions
   * @returns Array of registered command actions
   */
  getRegisteredActions(): CommandAction[] {
    return Array.from(this.handlers.keys());
  }
}

/**
 * Create a singleton instance of CommandRouter
 */
export const commandRouter = new CommandRouter();

// Factory function for creating command router instances
export function createCommandRouter(): CommandRouter {
  return new CommandRouter();
}
