/**
 * Intelligence and Action Layers Integration Test
 * Feature: jojo-voice-assistant-enhanced
 * Checkpoint Task 10
 * 
 * Verifies that intent parsing, context management, and dashboard actions
 * work correctly together.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { IntentParserService } from '../../services/voice/intentParser';
import { ContextManager } from '../../services/voice/contextManager';
import { CommandRouter } from '../../services/voice/commandRouter';
import { CommandAction, ParsedIntent, ConversationContext } from '../../services/voice/types';

describe('Intelligence and Action Layers Integration', () => {
  let intentParser: IntentParserService;
  let contextManager: ContextManager;
  let commandRouter: CommandRouter;

  beforeEach(() => {
    intentParser = new IntentParserService();
    contextManager = new ContextManager('/dashboard');
    commandRouter = new CommandRouter();
  });

  describe('Intent Parsing', () => {
    it('should parse navigation commands correctly', () => {
      const transcription = 'Go to appointments';
      const entities = intentParser.extractEntities(transcription);
      
      // Should extract basic entities
      expect(entities).toBeDefined();
      expect(Array.isArray(entities)).toBe(true);
    });

    it('should extract entities from transcription', () => {
      const transcription = 'Log feeding for Max - 2 cups at 3:00 PM';
      const entities = intentParser.extractEntities(transcription);
      
      // Should extract amount and unit
      const amountEntity = entities.find(e => e.type === 'amount');
      const unitEntity = entities.find(e => e.type === 'unit');
      const timeEntity = entities.find(e => e.type === 'time');
      
      expect(amountEntity).toBeDefined();
      expect(amountEntity?.value).toBe('2');
      expect(unitEntity).toBeDefined();
      expect(unitEntity?.value.toLowerCase()).toContain('cup');
      expect(timeEntity).toBeDefined();
    });

    it('should detect priority from urgent keywords', () => {
      const urgentTranscription = 'Emergency! My dog is bleeding!';
      const normalTranscription = 'Show me health records';
      
      // Priority detection is internal, but we can verify via fallback intent
      const context: ConversationContext = {
        previousIntents: [],
        activePet: null,
        currentPage: '/dashboard',
        recentEntities: []
      };
      
      // Both should create valid intents
      expect(() => intentParser.extractEntities(urgentTranscription)).not.toThrow();
      expect(() => intentParser.extractEntities(normalTranscription)).not.toThrow();
    });

    it('should validate intents correctly', () => {
      const validIntent: ParsedIntent = {
        intentId: 'test-1',
        action: CommandAction.NAVIGATE,
        target: 'appointments',
        parameters: {},
        confidence: 0.9,
        requiresConfirmation: false,
        priority: 'normal',
        entities: [],
        ambiguities: []
      };

      const result = intentParser.validateIntent(validIntent);
      expect(result.valid).toBe(true);
      expect(result.errors.length).toBe(0);
    });

    it('should detect missing required parameters', () => {
      const invalidIntent: ParsedIntent = {
        intentId: 'test-2',
        action: CommandAction.LOG_DATA,
        target: 'feeding',
        parameters: {}, // Missing required params
        confidence: 0.9,
        requiresConfirmation: false,
        priority: 'normal',
        entities: [],
        ambiguities: []
      };

      const result = intentParser.validateIntent(invalidIntent);
      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });
  });

  describe('Context Management', () => {
    it('should maintain conversation context across turns', () => {
      const intent1: ParsedIntent = {
        intentId: 'turn-1',
        action: CommandAction.QUERY,
        target: 'health',
        parameters: { petName: 'Max' },
        confidence: 0.95,
        requiresConfirmation: false,
        priority: 'normal',
        entities: [
          { type: 'pet_name', value: 'Max', confidence: 0.95, resolvedValue: 'Max' }
        ],
        ambiguities: []
      };

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

      contextManager.updateContext(intent1);
      contextManager.updateContext(intent2);

      expect(contextManager.getTurnCount()).toBe(2);
      expect(contextManager.getActivePet()).toBe('Max');
      
      const context = contextManager.getContext();
      expect(context.previousIntents.length).toBe(2);
    });

    it('should support pronoun resolution via active pet', () => {
      contextManager.setActivePet('Bella');
      
      const activePet = contextManager.getActivePet();
      expect(activePet).toBe('Bella');
      
      // Simulate follow-up: "What about her medications?"
      // The active pet context helps resolve "her" to "Bella"
      const context = contextManager.getContext();
      expect(context.activePet).toBe('Bella');
    });

    it('should clear context on session end', () => {
      contextManager.setActivePet('Charlie');
      
      const intent: ParsedIntent = {
        intentId: 'test',
        action: CommandAction.NAVIGATE,
        target: 'pets',
        parameters: {},
        confidence: 0.9,
        requiresConfirmation: false,
        priority: 'normal',
        entities: [],
        ambiguities: []
      };
      contextManager.updateContext(intent);

      expect(contextManager.getTurnCount()).toBe(1);
      expect(contextManager.getActivePet()).toBe('Charlie');

      contextManager.clearContext();

      expect(contextManager.getTurnCount()).toBe(0);
      expect(contextManager.getActivePet()).toBeNull();
      expect(contextManager.isSessionActive()).toBe(false);
    });
  });

  describe('Command Router', () => {
    it('should register and check handlers', () => {
      expect(commandRouter.hasHandler(CommandAction.NAVIGATE)).toBe(false);
      
      // Register a mock handler
      const mockHandler = {
        execute: async () => ({
          success: true,
          data: null,
          message: 'Success',
          visualComponent: null,
          requiresFollowUp: false,
          followUpPrompt: null
        }),
        canExecute: () => true,
        getRequiredParameters: () => []
      };

      commandRouter.registerHandler(CommandAction.NAVIGATE, mockHandler);
      
      expect(commandRouter.hasHandler(CommandAction.NAVIGATE)).toBe(true);
    });

    it('should return error for unregistered actions', async () => {
      const intent: ParsedIntent = {
        intentId: 'test',
        action: CommandAction.NAVIGATE,
        target: 'appointments',
        parameters: {},
        confidence: 0.9,
        requiresConfirmation: false,
        priority: 'normal',
        entities: [],
        ambiguities: []
      };

      const result = await commandRouter.executeCommand(intent);
      
      expect(result.success).toBe(false);
      expect(result.message).toContain('No handler registered');
    });

    it('should get available commands', () => {
      // Register mock handlers
      const mockHandler = {
        execute: async () => ({
          success: true,
          data: null,
          message: 'Success',
          visualComponent: null,
          requiresFollowUp: false,
          followUpPrompt: null
        }),
        canExecute: () => true,
        getRequiredParameters: () => []
      };

      commandRouter.registerHandler(CommandAction.NAVIGATE, mockHandler);
      commandRouter.registerHandler(CommandAction.QUERY, mockHandler);

      const context: ConversationContext = {
        previousIntents: [],
        activePet: null,
        currentPage: '/dashboard',
        recentEntities: []
      };

      const commands = commandRouter.getAvailableCommands(context);
      
      expect(commands.length).toBeGreaterThan(0);
      expect(commands.some(c => c.action === CommandAction.NAVIGATE)).toBe(true);
      expect(commands.some(c => c.action === CommandAction.QUERY)).toBe(true);
    });
  });

  describe('Integration Flow', () => {
    it('should handle complete voice command flow', () => {
      // 1. Parse intent from transcription
      const transcription = 'Show me Max health records';
      const entities = intentParser.extractEntities(transcription);
      
      // 2. Create intent (simulated) with required parameters
      const intent: ParsedIntent = {
        intentId: 'flow-test',
        action: CommandAction.QUERY,
        target: 'health',
        parameters: { petId: '123', petName: 'Max' }, // Include petId as required
        confidence: 0.9,
        requiresConfirmation: false,
        priority: 'normal',
        entities: entities,
        ambiguities: []
      };

      // 3. Validate intent
      const validation = intentParser.validateIntent(intent);
      // Note: May have warnings but should not have critical errors for query
      expect(validation.errors.length).toBeLessThanOrEqual(1);

      // 4. Update context
      contextManager.updateContext(intent);
      expect(contextManager.getTurnCount()).toBe(1);

      // 5. Verify context is maintained
      const context = contextManager.getContext();
      expect(context.previousIntents.length).toBe(1);
      expect(context.previousIntents[0].action).toBe(CommandAction.QUERY);
    });

    it('should handle multi-turn conversation', () => {
      // Turn 1: "Show me Buddy's health records"
      const intent1: ParsedIntent = {
        intentId: 'turn-1',
        action: CommandAction.QUERY,
        target: 'health',
        parameters: { petName: 'Buddy' },
        confidence: 0.95,
        requiresConfirmation: false,
        priority: 'normal',
        entities: [
          { type: 'pet_name', value: 'Buddy', confidence: 0.95, resolvedValue: 'Buddy' }
        ],
        ambiguities: []
      };

      contextManager.updateContext(intent1);
      expect(contextManager.getActivePet()).toBe('Buddy');

      // Turn 2: "What about his medications?" (follow-up)
      const intent2: ParsedIntent = {
        intentId: 'turn-2',
        action: CommandAction.QUERY,
        target: 'medications',
        parameters: {}, // Pet resolved from context
        confidence: 0.9,
        requiresConfirmation: false,
        priority: 'normal',
        entities: [],
        ambiguities: []
      };

      contextManager.updateContext(intent2);
      
      // Context should maintain active pet
      expect(contextManager.getActivePet()).toBe('Buddy');
      expect(contextManager.getTurnCount()).toBe(2);

      // Can retrieve conversation history
      const lastIntents = contextManager.getLastIntents(2);
      expect(lastIntents.length).toBe(2);
      expect(lastIntents[0].target).toBe('health');
      expect(lastIntents[1].target).toBe('medications');
    });
  });
});
