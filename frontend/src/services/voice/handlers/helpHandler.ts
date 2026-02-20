/**
 * Help Command Handler
 * 
 * Handles HELP action commands ("What can you do?", "Help", etc.)
 * Returns context-relevant command lists based on current page.
 * 
 * Requirement: 14.3
 * Feature: jojo-voice-assistant-enhanced
 */

import type { CommandHandler, ParsedIntent, CommandResult, ConversationContext } from '../types';
import { handleHelpCommand } from '../helpCommandHandler';

/**
 * HelpHandler implementation
 * Processes help requests and returns available voice commands
 */
export class HelpHandler implements CommandHandler {
  /**
   * Execute help command
   * @param intent - The parsed help intent
   * @param context - Current conversation context
   * @returns Command result with help information
   */
  async execute(intent: ParsedIntent, context: ConversationContext): Promise<CommandResult> {
    try {
      // Use the help command handler to generate response
      const result = handleHelpCommand(context);
      
      return result;
    } catch (error) {
      console.error('Error executing help command:', error);
      return {
        success: false,
        data: null,
        message: 'Sorry, I encountered an error while trying to show help information.',
        visualComponent: null,
        requiresFollowUp: false,
        followUpPrompt: null
      };
    }
  }

  /**
   * Check if help command can be executed
   * Help commands can always be executed
   * @param intent - The parsed intent
   * @returns Always true for help commands
   */
  canExecute(intent: ParsedIntent): boolean {
    return true;
  }

  /**
   * Get required parameters for help command
   * Help commands don't require any parameters
   * @returns Empty array
   */
  getRequiredParameters(): string[] {
    return [];
  }
}

/**
 * Create a singleton instance of HelpHandler
 */
export const helpHandler = new HelpHandler();
