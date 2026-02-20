/**
 * Context Manager Service
 * Feature: jojo-voice-assistant-enhanced
 * 
 * Manages conversation context and state across voice interactions.
 * Implements conversation history tracking, active pet management,
 * entity memory, and context cleanup.
 * 
 * Requirements: 9.1, 9.2, 9.3, 9.4, 9.5
 */

import { 
  ContextManager as IContextManager,
  ConversationContext,
  ParsedIntent,
  Entity
} from './types';

/**
 * Implementation of the ContextManager interface
 * 
 * Key Features:
 * - Maintains 10-turn conversation window
 * - Tracks active pet for pronoun resolution
 * - Stores last 20 entities for context-aware parsing
 * - Automatic cleanup on session end
 */
export class ContextManager implements IContextManager {
  private context: ConversationContext;
  private readonly MAX_TURNS = 10;
  private readonly MAX_ENTITIES = 20;
  private sessionActive: boolean = true;

  constructor(initialPage: string = '/') {
    this.context = {
      previousIntents: [],
      activePet: null,
      currentPage: initialPage,
      recentEntities: [],
      lastSummarizedQuery: undefined
    };
  }

  /**
   * Update context with new intent from conversation turn
   * Maintains 10-turn window by removing oldest when limit exceeded
   * 
   * @param intent - Parsed intent from current turn
   */
  updateContext(intent: ParsedIntent): void {
    // Add intent to history
    this.context.previousIntents.push(intent);

    // Maintain 10-turn window
    if (this.context.previousIntents.length > this.MAX_TURNS) {
      this.context.previousIntents.shift();
    }

    // Extract and store entities from intent
    if (intent.entities && intent.entities.length > 0) {
      intent.entities.forEach(entity => this.addEntity(entity));
    }

    // Auto-update active pet if pet name entity is present
    const petNameEntity = intent.entities.find(e => e.type === 'pet_name');
    if (petNameEntity && petNameEntity.resolvedValue) {
      this.setActivePet(petNameEntity.resolvedValue);
    }
  }

  /**
   * Get current conversation context
   * Returns immutable copy to prevent external modifications
   * 
   * @returns Current conversation context
   */
  getContext(): ConversationContext {
    return {
      previousIntents: [...this.context.previousIntents],
      activePet: this.context.activePet,
      currentPage: this.context.currentPage,
      recentEntities: [...this.context.recentEntities],
      lastSummarizedQuery: this.context.lastSummarizedQuery ? { ...this.context.lastSummarizedQuery } : undefined
    };
  }

  /**
   * Set active pet for subsequent commands
   * Used for pronoun resolution (his, her, its)
   * 
   * @param petName - Name of the pet to set as active
   */
  setActivePet(petName: string): void {
    this.context.activePet = petName;
  }

  /**
   * Get currently active pet
   * Returns null if no pet is active
   * 
   * @returns Active pet name or null
   */
  getActivePet(): string | null {
    return this.context.activePet;
  }

  /**
   * Add entity to recent entities memory
   * Maintains last 20 entities for context-aware parsing
   * 
   * @param entity - Entity to add to memory
   */
  addEntity(entity: Entity): void {
    // Add entity to recent entities
    this.context.recentEntities.push(entity);

    // Maintain 20-entity limit
    if (this.context.recentEntities.length > this.MAX_ENTITIES) {
      this.context.recentEntities.shift();
    }
  }

  /**
   * Clear all conversation history and context
   * Called on session end or explicit reset
   */
  clearContext(): void {
    this.context.previousIntents = [];
    this.context.activePet = null;
    this.context.recentEntities = [];
    this.context.lastSummarizedQuery = undefined;
    this.sessionActive = false;
  }

  /**
   * Get current conversation turn count
   * 
   * @returns Number of turns in current conversation
   */
  getTurnCount(): number {
    return this.context.previousIntents.length;
  }

  /**
   * Update current page context
   * Used for context-aware command suggestions
   * 
   * @param page - Current page path
   */
  updateCurrentPage(page: string): void {
    this.context.currentPage = page;
  }

  /**
   * Get recent entities of specific type
   * Useful for entity resolution and disambiguation
   * 
   * @param entityType - Type of entities to retrieve
   * @returns Array of entities matching the type
   */
  getRecentEntitiesByType(entityType: string): Entity[] {
    return this.context.recentEntities.filter(e => e.type === entityType);
  }

  /**
   * Check if session is active
   * 
   * @returns True if session is active
   */
  isSessionActive(): boolean {
    return this.sessionActive;
  }

  /**
   * Start new session
   * Clears context and marks session as active
   */
  startNewSession(): void {
    this.clearContext();
    this.sessionActive = true;
  }

  /**
   * Get last N intents from conversation history
   * 
   * @param count - Number of intents to retrieve
   * @returns Array of recent intents
   */
  getLastIntents(count: number): ParsedIntent[] {
    const startIndex = Math.max(0, this.context.previousIntents.length - count);
    return this.context.previousIntents.slice(startIndex);
  }

  /**
   * Find entity by value in recent entities
   * Used for entity resolution and reference tracking
   * 
   * @param value - Entity value to search for
   * @returns Entity if found, null otherwise
   */
  findEntityByValue(value: string): Entity | null {
    return this.context.recentEntities.find(e => 
      e.value.toLowerCase() === value.toLowerCase()
    ) || null;
  }

  /**
   * Get context summary for debugging
   * 
   * @returns Human-readable context summary
   */
  getContextSummary(): string {
    return `Context Summary:
- Turn Count: ${this.getTurnCount()}
- Active Pet: ${this.context.activePet || 'None'}
- Current Page: ${this.context.currentPage}
- Recent Entities: ${this.context.recentEntities.length}
- Session Active: ${this.sessionActive}`;
  }

  /**
   * Store summarized query information for "show more details" follow-up
   * Requirement 6.6: Support follow-up commands for detailed information
   * 
   * @param queryType - Type of query (appointments, medications, etc.)
   * @param fullData - Complete result set
   * @param petName - Pet the query was for
   */
  storeSummarizedQuery(queryType: string, fullData: any, petName: string): void {
    this.context.lastSummarizedQuery = {
      queryType,
      fullData,
      petName
    };
  }

  /**
   * Get last summarized query information
   * Used for handling "show more details" follow-up commands
   * 
   * @returns Last summarized query or undefined
   */
  getLastSummarizedQuery(): { queryType: string; fullData: any; petName: string } | undefined {
    return this.context.lastSummarizedQuery;
  }

  /**
   * Clear last summarized query
   * Called after showing full details or when context changes
   */
  clearSummarizedQuery(): void {
    this.context.lastSummarizedQuery = undefined;
  }
}

/**
 * Create a new ContextManager instance
 * 
 * @param initialPage - Initial page path (default: '/')
 * @returns New ContextManager instance
 */
export function createContextManager(initialPage?: string): ContextManager {
  return new ContextManager(initialPage);
}
