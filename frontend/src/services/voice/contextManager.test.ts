/**
 * Context Manager Tests
 * Feature: jojo-voice-assistant-enhanced
 * 
 * Tests for conversation context management, active pet tracking,
 * entity memory, and context cleanup functionality.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { ContextManager } from './contextManager';
import { ParsedIntent, Entity, CommandAction, EntityType } from './types';

describe('ContextManager', () => {
  let contextManager: ContextManager;

  beforeEach(() => {
    contextManager = new ContextManager('/dashboard');
  });

  describe('Conversation Context Storage', () => {
    it('should maintain 10-turn conversation window', () => {
      // Create 15 intents
      for (let i = 0; i < 15; i++) {
        const intent: ParsedIntent = {
          intentId: `intent-${i}`,
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

      // Should only keep last 10
      expect(contextManager.getTurnCount()).toBe(10);
      
      const context = contextManager.getContext();
      expect(context.previousIntents.length).toBe(10);
      
      // First intent should be intent-5 (oldest kept)
      expect(context.previousIntents[0].intentId).toBe('intent-5');
      
      // Last intent should be intent-14 (newest)
      expect(context.previousIntents[9].intentId).toBe('intent-14');
    });

    it('should return immutable copy of context', () => {
      const intent: ParsedIntent = {
        intentId: 'test-intent',
        action: CommandAction.NAVIGATE,
        target: 'pets',
        parameters: {},
        confidence: 0.95,
        requiresConfirmation: false,
        priority: 'normal',
        entities: [],
        ambiguities: []
      };
      
      contextManager.updateContext(intent);
      
      const context1 = contextManager.getContext();
      const context2 = contextManager.getContext();
      
      // Should be different objects
      expect(context1).not.toBe(context2);
      expect(context1.previousIntents).not.toBe(context2.previousIntents);
      
      // But have same content
      expect(context1.previousIntents.length).toBe(context2.previousIntents.length);
    });
  });

  describe('Active Pet Tracking', () => {
    it('should set and get active pet', () => {
      expect(contextManager.getActivePet()).toBeNull();
      
      contextManager.setActivePet('Buddy');
      expect(contextManager.getActivePet()).toBe('Buddy');
      
      contextManager.setActivePet('Max');
      expect(contextManager.getActivePet()).toBe('Max');
    });

    it('should auto-update active pet from intent entities', () => {
      const petEntity: Entity = {
        type: EntityType.PET_NAME,
        value: 'Luna',
        confidence: 0.95,
        resolvedValue: 'Luna'
      };

      const intent: ParsedIntent = {
        intentId: 'pet-intent',
        action: CommandAction.QUERY,
        target: 'health',
        parameters: {},
        confidence: 0.9,
        requiresConfirmation: false,
        priority: 'normal',
        entities: [petEntity],
        ambiguities: []
      };

      contextManager.updateContext(intent);
      
      expect(contextManager.getActivePet()).toBe('Luna');
    });

    it('should support pronoun resolution via active pet', () => {
      contextManager.setActivePet('Charlie');
      
      const activePet = contextManager.getActivePet();
      expect(activePet).toBe('Charlie');
      
      // Simulate pronoun resolution: "his medication" -> Charlie's medication
      const resolvedPet = activePet;
      expect(resolvedPet).toBe('Charlie');
    });
  });

  describe('Entity Memory', () => {
    it('should maintain last 20 entities', () => {
      // Add 25 entities
      for (let i = 0; i < 25; i++) {
        const entity: Entity = {
          type: EntityType.AMOUNT,
          value: `${i}`,
          confidence: 0.9,
          resolvedValue: i
        };
        contextManager.addEntity(entity);
      }

      const context = contextManager.getContext();
      expect(context.recentEntities.length).toBe(20);
      
      // First entity should be entity-5 (oldest kept)
      expect(context.recentEntities[0].value).toBe('5');
      
      // Last entity should be entity-24 (newest)
      expect(context.recentEntities[19].value).toBe('24');
    });

    it('should store entities from intent updates', () => {
      const entities: Entity[] = [
        {
          type: EntityType.PET_NAME,
          value: 'Bella',
          confidence: 0.95,
          resolvedValue: 'Bella'
        },
        {
          type: EntityType.MEDICATION_NAME,
          value: 'Heartgard',
          confidence: 0.9,
          resolvedValue: 'Heartgard'
        }
      ];

      const intent: ParsedIntent = {
        intentId: 'med-intent',
        action: CommandAction.LOG_DATA,
        target: 'medication',
        parameters: {},
        confidence: 0.9,
        requiresConfirmation: false,
        priority: 'normal',
        entities: entities,
        ambiguities: []
      };

      contextManager.updateContext(intent);
      
      const context = contextManager.getContext();
      expect(context.recentEntities.length).toBe(2);
      expect(context.recentEntities[0].type).toBe(EntityType.PET_NAME);
      expect(context.recentEntities[1].type).toBe(EntityType.MEDICATION_NAME);
    });

    it('should retrieve entities by type', () => {
      const entities: Entity[] = [
        { type: EntityType.PET_NAME, value: 'Max', confidence: 0.9, resolvedValue: 'Max' },
        { type: EntityType.DATE, value: 'today', confidence: 0.85, resolvedValue: new Date() },
        { type: EntityType.PET_NAME, value: 'Luna', confidence: 0.92, resolvedValue: 'Luna' },
        { type: EntityType.AMOUNT, value: '2', confidence: 0.95, resolvedValue: 2 }
      ];

      entities.forEach(e => contextManager.addEntity(e));

      const petEntities = contextManager.getRecentEntitiesByType(EntityType.PET_NAME);
      expect(petEntities.length).toBe(2);
      expect(petEntities[0].value).toBe('Max');
      expect(petEntities[1].value).toBe('Luna');
    });

    it('should find entity by value', () => {
      const entity: Entity = {
        type: EntityType.MEDICATION_NAME,
        value: 'Frontline',
        confidence: 0.9,
        resolvedValue: 'Frontline'
      };

      contextManager.addEntity(entity);

      const found = contextManager.findEntityByValue('Frontline');
      expect(found).not.toBeNull();
      expect(found?.type).toBe(EntityType.MEDICATION_NAME);

      const notFound = contextManager.findEntityByValue('NonExistent');
      expect(notFound).toBeNull();
    });

    it('should handle case-insensitive entity search', () => {
      const entity: Entity = {
        type: EntityType.PET_NAME,
        value: 'Buddy',
        confidence: 0.95,
        resolvedValue: 'Buddy'
      };

      contextManager.addEntity(entity);

      const found1 = contextManager.findEntityByValue('buddy');
      const found2 = contextManager.findEntityByValue('BUDDY');
      const found3 = contextManager.findEntityByValue('BuDdY');

      expect(found1).not.toBeNull();
      expect(found2).not.toBeNull();
      expect(found3).not.toBeNull();
    });
  });

  describe('Context Cleanup', () => {
    it('should clear all context on clearContext()', () => {
      // Setup context with data
      contextManager.setActivePet('Rocky');
      
      const entity: Entity = {
        type: EntityType.PET_NAME,
        value: 'Rocky',
        confidence: 0.95,
        resolvedValue: 'Rocky'
      };
      contextManager.addEntity(entity);

      const intent: ParsedIntent = {
        intentId: 'test-intent',
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

      // Verify context has data
      expect(contextManager.getActivePet()).toBe('Rocky');
      expect(contextManager.getTurnCount()).toBe(1);
      expect(contextManager.getContext().recentEntities.length).toBe(1);

      // Clear context
      contextManager.clearContext();

      // Verify everything is cleared
      expect(contextManager.getActivePet()).toBeNull();
      expect(contextManager.getTurnCount()).toBe(0);
      expect(contextManager.getContext().recentEntities.length).toBe(0);
      expect(contextManager.isSessionActive()).toBe(false);
    });

    it('should mark session as inactive after clearContext()', () => {
      expect(contextManager.isSessionActive()).toBe(true);
      
      contextManager.clearContext();
      
      expect(contextManager.isSessionActive()).toBe(false);
    });

    it('should support starting new session', () => {
      // Add some data
      contextManager.setActivePet('Daisy');
      
      const intent: ParsedIntent = {
        intentId: 'old-intent',
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

      // End session
      contextManager.clearContext();
      expect(contextManager.isSessionActive()).toBe(false);

      // Start new session
      contextManager.startNewSession();
      expect(contextManager.isSessionActive()).toBe(true);
      expect(contextManager.getTurnCount()).toBe(0);
      expect(contextManager.getActivePet()).toBeNull();
    });
  });

  describe('Context-Aware Follow-up', () => {
    it('should support follow-up interpretation via context', () => {
      // First turn: "Show me Buddy's health records"
      const firstIntent: ParsedIntent = {
        intentId: 'first-turn',
        action: CommandAction.QUERY,
        target: 'health_records',
        parameters: { petName: 'Buddy' },
        confidence: 0.95,
        requiresConfirmation: false,
        priority: 'normal',
        entities: [
          { type: EntityType.PET_NAME, value: 'Buddy', confidence: 0.95, resolvedValue: 'Buddy' }
        ],
        ambiguities: []
      };
      contextManager.updateContext(firstIntent);

      // Second turn: "What about his medications?" (follow-up)
      // Context should help resolve "his" to "Buddy"
      expect(contextManager.getActivePet()).toBe('Buddy');
      
      const lastIntents = contextManager.getLastIntents(1);
      expect(lastIntents[0].parameters.petName).toBe('Buddy');
    });

    it('should retrieve last N intents for context', () => {
      // Add 5 intents
      for (let i = 0; i < 5; i++) {
        const intent: ParsedIntent = {
          intentId: `intent-${i}`,
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

      const last3 = contextManager.getLastIntents(3);
      expect(last3.length).toBe(3);
      expect(last3[0].intentId).toBe('intent-2');
      expect(last3[1].intentId).toBe('intent-3');
      expect(last3[2].intentId).toBe('intent-4');
    });
  });

  describe('Current Page Tracking', () => {
    it('should initialize with provided page', () => {
      const manager = new ContextManager('/pets');
      expect(manager.getContext().currentPage).toBe('/pets');
    });

    it('should update current page', () => {
      expect(contextManager.getContext().currentPage).toBe('/dashboard');
      
      contextManager.updateCurrentPage('/appointments');
      expect(contextManager.getContext().currentPage).toBe('/appointments');
      
      contextManager.updateCurrentPage('/health');
      expect(contextManager.getContext().currentPage).toBe('/health');
    });
  });

  describe('Context Summary', () => {
    it('should provide human-readable context summary', () => {
      contextManager.setActivePet('Max');
      
      const entity: Entity = {
        type: EntityType.PET_NAME,
        value: 'Max',
        confidence: 0.95,
        resolvedValue: 'Max'
      };
      contextManager.addEntity(entity);

      const intent: ParsedIntent = {
        intentId: 'test',
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

      const summary = contextManager.getContextSummary();
      
      expect(summary).toContain('Turn Count: 1');
      expect(summary).toContain('Active Pet: Max');
      expect(summary).toContain('Current Page: /dashboard');
      expect(summary).toContain('Recent Entities: 1');
      expect(summary).toContain('Session Active: true');
    });
  });
});
