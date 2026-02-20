/**
 * Context Sync Manager Service
 * Feature: jojo-voice-assistant-enhanced
 * 
 * Manages bidirectional synchronization between manual Dashboard interactions
 * and voice command context. Ensures voice and manual interactions stay in sync.
 * 
 * Requirements: 20.2, 20.5
 * Properties: 63, 64
 */

import { ContextManager } from './contextManager';
import { ParsedIntent, CommandAction, Entity, EntityType } from './types';

/**
 * Event types for Dashboard interactions
 */
export enum DashboardEventType {
  NAVIGATION = 'navigation',
  PET_SELECTION = 'pet_selection',
  DATA_ENTRY = 'data_entry',
  DATA_MODIFICATION = 'data_modification',
  VIEW_CHANGE = 'view_change',
}

/**
 * Dashboard interaction event
 */
export interface DashboardEvent {
  type: DashboardEventType;
  timestamp: Date;
  data: any;
  source: 'manual' | 'voice';
}

/**
 * Listener callback for Dashboard events
 */
export type DashboardEventListener = (event: DashboardEvent) => void;

/**
 * Data change event for real-time updates
 */
export interface DataChangeEvent {
  entityType: string;
  entityId: string;
  changeType: 'create' | 'update' | 'delete';
  data: any;
  timestamp: Date;
}

/**
 * Listener callback for data changes
 */
export type DataChangeListener = (event: DataChangeEvent) => void;

/**
 * ContextSyncManager Implementation
 * 
 * Provides bidirectional synchronization:
 * 1. Manual Dashboard interactions → Context_Memory updates
 * 2. Voice command data changes → Real-time Dashboard view updates
 */
export class ContextSyncManager {
  private contextManager: ContextManager;
  private eventListeners: Map<DashboardEventType, Set<DashboardEventListener>>;
  private dataChangeListeners: Set<DataChangeListener>;
  private isInitialized: boolean = false;

  constructor(contextManager: ContextManager) {
    this.contextManager = contextManager;
    this.eventListeners = new Map();
    this.dataChangeListeners = new Set();
  }

  /**
   * Initialize the sync manager
   * Sets up event listeners for Dashboard interactions
   */
  initialize(): void {
    if (this.isInitialized) {
      console.warn('ContextSyncManager already initialized');
      return;
    }

    // Initialize event listener maps
    Object.values(DashboardEventType).forEach(type => {
      this.eventListeners.set(type as DashboardEventType, new Set());
    });

    // Set up browser navigation listener
    this.setupNavigationListener();

    // Set up storage event listener for cross-tab sync
    this.setupStorageListener();

    this.isInitialized = true;
    console.log('ContextSyncManager initialized');
  }

  /**
   * Shutdown the sync manager
   * Removes all event listeners
   */
  shutdown(): void {
    if (!this.isInitialized) {
      return;
    }

    // Clear all listeners
    this.eventListeners.clear();
    this.dataChangeListeners.clear();

    this.isInitialized = false;
    console.log('ContextSyncManager shutdown');
  }

  // ============================================================================
  // Manual Interaction → Context Updates (Requirement 20.2, Property 63)
  // ============================================================================

  /**
   * Handle manual navigation event
   * Updates context with new page location
   * 
   * @param page - Page path navigated to
   * @param params - Optional navigation parameters
   */
  handleNavigation(page: string, params?: Record<string, any>): void {
    // Update context manager with new page
    this.contextManager.updateCurrentPage(page);

    // Extract pet ID from params if present
    if (params?.petId) {
      // Create a synthetic intent for context tracking
      const intent: ParsedIntent = {
        intentId: `manual-nav-${Date.now()}`,
        action: CommandAction.NAVIGATE,
        target: page,
        parameters: params,
        confidence: 1.0,
        requiresConfirmation: false,
        priority: 'normal',
        entities: [],
        ambiguities: [],
      };

      this.contextManager.updateContext(intent);
    }

    // Emit navigation event
    this.emitEvent({
      type: DashboardEventType.NAVIGATION,
      timestamp: new Date(),
      data: { page, params },
      source: 'manual',
    });
  }

  /**
   * Handle manual pet selection
   * Updates active pet in context for subsequent voice commands
   * 
   * @param petId - ID of the selected pet
   * @param petName - Name of the selected pet
   */
  handlePetSelection(petId: string, petName: string): void {
    // Add pet entity to context
    const petEntity: Entity = {
      type: EntityType.PET_NAME,
      value: petName,
      confidence: 1.0,
      resolvedValue: petId,
    };
    this.contextManager.addEntity(petEntity);

    // Create synthetic intent for context tracking
    const intent: ParsedIntent = {
      intentId: `manual-pet-select-${Date.now()}`,
      action: CommandAction.NAVIGATE,
      target: 'pet_profile',
      parameters: { petId, petName },
      confidence: 1.0,
      requiresConfirmation: false,
      priority: 'normal',
      entities: [petEntity],
      ambiguities: [],
    };

    this.contextManager.updateContext(intent);

    // Update active pet in context AFTER updateContext
    // (updateContext may override it with resolvedValue, so we set it again)
    this.contextManager.setActivePet(petName);

    // Emit pet selection event
    this.emitEvent({
      type: DashboardEventType.PET_SELECTION,
      timestamp: new Date(),
      data: { petId, petName },
      source: 'manual',
    });
  }

  /**
   * Handle manual data entry
   * Updates context with data entry action for voice awareness
   * 
   * @param dataType - Type of data entered (feeding, medication, weight, etc.)
   * @param petId - ID of the pet
   * @param data - Data that was entered
   */
  handleDataEntry(dataType: string, petId: string, data: any): void {
    // Create synthetic intent for context tracking
    const intent: ParsedIntent = {
      intentId: `manual-data-entry-${Date.now()}`,
      action: CommandAction.LOG_DATA,
      target: dataType,
      parameters: { petId, ...data },
      confidence: 1.0,
      requiresConfirmation: false,
      priority: 'normal',
      entities: [],
      ambiguities: [],
    };

    this.contextManager.updateContext(intent);

    // Emit data entry event
    this.emitEvent({
      type: DashboardEventType.DATA_ENTRY,
      timestamp: new Date(),
      data: { dataType, petId, data },
      source: 'manual',
    });
  }

  /**
   * Handle manual view change
   * Updates context with current view for context-aware suggestions
   * 
   * @param viewName - Name of the view
   * @param viewData - Optional view-specific data
   */
  handleViewChange(viewName: string, viewData?: any): void {
    // Emit view change event
    this.emitEvent({
      type: DashboardEventType.VIEW_CHANGE,
      timestamp: new Date(),
      data: { viewName, viewData },
      source: 'manual',
    });
  }

  // ============================================================================
  // Voice Command → Real-time View Updates (Requirement 20.5, Property 64)
  // ============================================================================

  /**
   * Notify all views of a data change from voice command
   * Ensures real-time updates across all Dashboard views
   * 
   * @param entityType - Type of entity changed (pet, appointment, medication, etc.)
   * @param entityId - ID of the changed entity
   * @param changeType - Type of change (create, update, delete)
   * @param data - Changed data
   */
  notifyDataChange(
    entityType: string,
    entityId: string,
    changeType: 'create' | 'update' | 'delete',
    data: any
  ): void {
    const event: DataChangeEvent = {
      entityType,
      entityId,
      changeType,
      data,
      timestamp: new Date(),
    };

    // Notify all registered data change listeners
    this.dataChangeListeners.forEach(listener => {
      try {
        listener(event);
      } catch (error) {
        console.error('Error in data change listener:', error);
      }
    });

    // Emit as Dashboard event for tracking
    this.emitEvent({
      type: DashboardEventType.DATA_MODIFICATION,
      timestamp: new Date(),
      data: event,
      source: 'voice',
    });
  }

  /**
   * Register a listener for data changes
   * Views can subscribe to receive real-time updates
   * 
   * @param listener - Callback function for data changes
   * @returns Unsubscribe function
   */
  onDataChange(listener: DataChangeListener): () => void {
    this.dataChangeListeners.add(listener);

    // Return unsubscribe function
    return () => {
      this.dataChangeListeners.delete(listener);
    };
  }

  // ============================================================================
  // Event Management
  // ============================================================================

  /**
   * Register a listener for specific Dashboard event type
   * 
   * @param eventType - Type of event to listen for
   * @param listener - Callback function
   * @returns Unsubscribe function
   */
  addEventListener(
    eventType: DashboardEventType,
    listener: DashboardEventListener
  ): () => void {
    const listeners = this.eventListeners.get(eventType);
    if (listeners) {
      listeners.add(listener);
    }

    // Return unsubscribe function
    return () => {
      const listeners = this.eventListeners.get(eventType);
      if (listeners) {
        listeners.delete(listener);
      }
    };
  }

  /**
   * Remove a specific event listener
   * 
   * @param eventType - Type of event
   * @param listener - Listener to remove
   */
  removeEventListener(
    eventType: DashboardEventType,
    listener: DashboardEventListener
  ): void {
    const listeners = this.eventListeners.get(eventType);
    if (listeners) {
      listeners.delete(listener);
    }
  }

  /**
   * Emit an event to all registered listeners
   * 
   * @param event - Event to emit
   */
  private emitEvent(event: DashboardEvent): void {
    const listeners = this.eventListeners.get(event.type);
    if (listeners) {
      listeners.forEach(listener => {
        try {
          listener(event);
        } catch (error) {
          console.error(`Error in event listener for ${event.type}:`, error);
        }
      });
    }
  }

  // ============================================================================
  // Browser Integration
  // ============================================================================

  /**
   * Set up browser navigation listener
   * Tracks URL changes for context updates
   */
  private setupNavigationListener(): void {
    // Listen for popstate events (back/forward navigation)
    window.addEventListener('popstate', () => {
      const currentPath = window.location.pathname;
      this.handleNavigation(currentPath);
    });

    // Listen for pushState/replaceState (programmatic navigation)
    const originalPushState = history.pushState;
    const originalReplaceState = history.replaceState;

    history.pushState = (...args) => {
      originalPushState.apply(history, args);
      const currentPath = window.location.pathname;
      this.handleNavigation(currentPath);
    };

    history.replaceState = (...args) => {
      originalReplaceState.apply(history, args);
      const currentPath = window.location.pathname;
      this.handleNavigation(currentPath);
    };
  }

  /**
   * Set up storage event listener for cross-tab synchronization
   * Ensures context stays in sync across multiple tabs
   */
  private setupStorageListener(): void {
    window.addEventListener('storage', (event) => {
      // Handle context sync across tabs
      if (event.key === 'active_pet' && event.newValue) {
        const petName = event.newValue;
        this.contextManager.setActivePet(petName);
      }
    });
  }

  // ============================================================================
  // Utility Methods
  // ============================================================================

  /**
   * Get current sync status
   * 
   * @returns Sync status information
   */
  getSyncStatus(): {
    initialized: boolean;
    eventListenerCount: number;
    dataChangeListenerCount: number;
    activePet: string | null;
    currentPage: string;
  } {
    let totalEventListeners = 0;
    this.eventListeners.forEach(listeners => {
      totalEventListeners += listeners.size;
    });

    const context = this.contextManager.getContext();

    return {
      initialized: this.isInitialized,
      eventListenerCount: totalEventListeners,
      dataChangeListenerCount: this.dataChangeListeners.size,
      activePet: context.activePet,
      currentPage: context.currentPage,
    };
  }

  /**
   * Manually trigger a sync from current Dashboard state
   * Useful for ensuring context is up-to-date
   */
  syncFromDashboard(): void {
    // Get current page from browser
    const currentPath = window.location.pathname;
    this.contextManager.updateCurrentPage(currentPath);

    // Get active pet from localStorage if available
    const activePet = localStorage.getItem('active_pet');
    if (activePet) {
      this.contextManager.setActivePet(activePet);
    }
  }

  /**
   * Persist active pet to localStorage for cross-tab sync
   * 
   * @param petName - Pet name to persist
   */
  persistActivePet(petName: string): void {
    localStorage.setItem('active_pet', petName);
  }

  /**
   * Clear persisted active pet
   */
  clearPersistedActivePet(): void {
    localStorage.removeItem('active_pet');
  }
}

/**
 * Create a new ContextSyncManager instance
 * 
 * @param contextManager - ContextManager instance to sync with
 * @returns New ContextSyncManager instance
 */
export function createContextSyncManager(
  contextManager: ContextManager
): ContextSyncManager {
  return new ContextSyncManager(contextManager);
}

// Export default
export default ContextSyncManager;
