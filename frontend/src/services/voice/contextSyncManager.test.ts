/**
 * Unit Tests for ContextSyncManager
 * Feature: jojo-voice-assistant-enhanced
 * 
 * Tests bidirectional synchronization between manual Dashboard interactions
 * and voice command context.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ContextSyncManager, DashboardEventType } from './contextSyncManager';
import { ContextManager } from './contextManager';
import { CommandAction, EntityType } from './types';

describe('ContextSyncManager', () => {
  let contextManager: ContextManager;
  let syncManager: ContextSyncManager;

  beforeEach(() => {
    // Create fresh instances for each test
    contextManager = new ContextManager('/');
    syncManager = new ContextSyncManager(contextManager);
    syncManager.initialize();
  });

  describe('Initialization', () => {
    it('should initialize successfully', () => {
      const status = syncManager.getSyncStatus();
      expect(status.initialized).toBe(true);
    });

    it('should not initialize twice', () => {
      const consoleSpy = vi.spyOn(console, 'warn');
      syncManager.initialize();
      expect(consoleSpy).toHaveBeenCalledWith('ContextSyncManager already initialized');
    });

    it('should shutdown successfully', () => {
      syncManager.shutdown();
      const status = syncManager.getSyncStatus();
      expect(status.initialized).toBe(false);
    });
  });

  describe('Manual Navigation → Context Updates (Requirement 20.2, Property 63)', () => {
    it('should update context when navigating to a page', () => {
      syncManager.handleNavigation('/appointments');
      
      const context = contextManager.getContext();
      expect(context.currentPage).toBe('/appointments');
    });

    it('should update context with pet ID from navigation params', () => {
      syncManager.handleNavigation('/pet/123', { petId: '123' });
      
      const context = contextManager.getContext();
      expect(context.previousIntents).toHaveLength(1);
      expect(context.previousIntents[0].action).toBe(CommandAction.NAVIGATE);
      expect(context.previousIntents[0].parameters.petId).toBe('123');
    });

    it('should emit navigation event', () => {
      const listener = vi.fn();
      syncManager.addEventListener(DashboardEventType.NAVIGATION, listener);
      
      syncManager.handleNavigation('/health-records');
      
      expect(listener).toHaveBeenCalledWith(
        expect.objectContaining({
          type: DashboardEventType.NAVIGATION,
          data: { page: '/health-records', params: undefined },
          source: 'manual',
        })
      );
    });
  });

  describe('Manual Pet Selection → Context Updates (Requirement 20.2, Property 63)', () => {
    it('should set active pet in context', () => {
      syncManager.handlePetSelection('123', 'Buddy');
      
      const activePet = contextManager.getActivePet();
      expect(activePet).toBe('Buddy');
    });

    it('should add pet entity to context', () => {
      syncManager.handlePetSelection('123', 'Buddy');
      
      const context = contextManager.getContext();
      const petEntity = context.recentEntities.find(e => e.type === EntityType.PET_NAME);
      
      expect(petEntity).toBeDefined();
      expect(petEntity?.value).toBe('Buddy');
      expect(petEntity?.resolvedValue).toBe('123');
    });

    it('should create synthetic intent for pet selection', () => {
      syncManager.handlePetSelection('123', 'Buddy');
      
      const context = contextManager.getContext();
      expect(context.previousIntents).toHaveLength(1);
      expect(context.previousIntents[0].action).toBe(CommandAction.NAVIGATE);
      expect(context.previousIntents[0].parameters.petName).toBe('Buddy');
    });

    it('should emit pet selection event', () => {
      const listener = vi.fn();
      syncManager.addEventListener(DashboardEventType.PET_SELECTION, listener);
      
      syncManager.handlePetSelection('123', 'Buddy');
      
      expect(listener).toHaveBeenCalledWith(
        expect.objectContaining({
          type: DashboardEventType.PET_SELECTION,
          data: { petId: '123', petName: 'Buddy' },
          source: 'manual',
        })
      );
    });
  });

  describe('Manual Data Entry → Context Updates (Requirement 20.2, Property 63)', () => {
    it('should update context with data entry action', () => {
      const feedingData = {
        amount: 2,
        unit: 'cups',
        foodType: 'dry food',
        time: new Date(),
      };
      
      syncManager.handleDataEntry('feeding', '123', feedingData);
      
      const context = contextManager.getContext();
      expect(context.previousIntents).toHaveLength(1);
      expect(context.previousIntents[0].action).toBe(CommandAction.LOG_DATA);
      expect(context.previousIntents[0].target).toBe('feeding');
    });

    it('should emit data entry event', () => {
      const listener = vi.fn();
      syncManager.addEventListener(DashboardEventType.DATA_ENTRY, listener);
      
      const medicationData = {
        name: 'Heartgard',
        dosage: '1 tablet',
        time: new Date(),
      };
      
      syncManager.handleDataEntry('medication', '123', medicationData);
      
      expect(listener).toHaveBeenCalledWith(
        expect.objectContaining({
          type: DashboardEventType.DATA_ENTRY,
          data: {
            dataType: 'medication',
            petId: '123',
            data: medicationData,
          },
          source: 'manual',
        })
      );
    });
  });

  describe('Voice Command → Real-time View Updates (Requirement 20.5, Property 64)', () => {
    it('should notify listeners of data changes', () => {
      const listener = vi.fn();
      syncManager.onDataChange(listener);
      
      syncManager.notifyDataChange('appointment', '456', 'create', {
        date: new Date(),
        clinic: 'Pet Clinic',
      });
      
      expect(listener).toHaveBeenCalledWith(
        expect.objectContaining({
          entityType: 'appointment',
          entityId: '456',
          changeType: 'create',
        })
      );
    });

    it('should handle multiple data change listeners', () => {
      const listener1 = vi.fn();
      const listener2 = vi.fn();
      
      syncManager.onDataChange(listener1);
      syncManager.onDataChange(listener2);
      
      syncManager.notifyDataChange('feeding', '789', 'update', {
        amount: 3,
      });
      
      expect(listener1).toHaveBeenCalled();
      expect(listener2).toHaveBeenCalled();
    });

    it('should allow unsubscribing from data changes', () => {
      const listener = vi.fn();
      const unsubscribe = syncManager.onDataChange(listener);
      
      unsubscribe();
      
      syncManager.notifyDataChange('medication', '101', 'delete', {});
      
      expect(listener).not.toHaveBeenCalled();
    });

    it('should emit data modification event', () => {
      const listener = vi.fn();
      syncManager.addEventListener(DashboardEventType.DATA_MODIFICATION, listener);
      
      syncManager.notifyDataChange('weight', '202', 'create', {
        weight: 25,
        unit: 'kg',
      });
      
      expect(listener).toHaveBeenCalledWith(
        expect.objectContaining({
          type: DashboardEventType.DATA_MODIFICATION,
          source: 'voice',
        })
      );
    });
  });

  describe('Event Management', () => {
    it('should register and trigger event listeners', () => {
      const listener = vi.fn();
      syncManager.addEventListener(DashboardEventType.VIEW_CHANGE, listener);
      
      syncManager.handleViewChange('health-dashboard', { petId: '123' });
      
      expect(listener).toHaveBeenCalled();
    });

    it('should allow unsubscribing from events', () => {
      const listener = vi.fn();
      const unsubscribe = syncManager.addEventListener(
        DashboardEventType.NAVIGATION,
        listener
      );
      
      unsubscribe();
      
      syncManager.handleNavigation('/test');
      
      expect(listener).not.toHaveBeenCalled();
    });

    it('should handle errors in event listeners gracefully', () => {
      const errorListener = vi.fn(() => {
        throw new Error('Listener error');
      });
      const normalListener = vi.fn();
      
      syncManager.addEventListener(DashboardEventType.NAVIGATION, errorListener);
      syncManager.addEventListener(DashboardEventType.NAVIGATION, normalListener);
      
      const consoleSpy = vi.spyOn(console, 'error');
      
      syncManager.handleNavigation('/test');
      
      // Error listener should throw but not prevent normal listener
      expect(consoleSpy).toHaveBeenCalled();
      expect(normalListener).toHaveBeenCalled();
    });
  });

  describe('Sync Status', () => {
    it('should return correct sync status', () => {
      syncManager.handlePetSelection('123', 'Max');
      syncManager.handleNavigation('/appointments');
      
      const listener1 = vi.fn();
      const listener2 = vi.fn();
      syncManager.addEventListener(DashboardEventType.NAVIGATION, listener1);
      syncManager.onDataChange(listener2);
      
      const status = syncManager.getSyncStatus();
      
      expect(status.initialized).toBe(true);
      expect(status.eventListenerCount).toBeGreaterThan(0);
      expect(status.dataChangeListenerCount).toBe(1);
      expect(status.activePet).toBe('Max');
      expect(status.currentPage).toBe('/appointments');
    });
  });

  describe('Cross-tab Synchronization', () => {
    it('should persist active pet to localStorage', () => {
      syncManager.persistActivePet('Charlie');
      
      expect(localStorage.getItem('active_pet')).toBe('Charlie');
    });

    it('should clear persisted active pet', () => {
      syncManager.persistActivePet('Charlie');
      syncManager.clearPersistedActivePet();
      
      expect(localStorage.getItem('active_pet')).toBeNull();
    });

    it('should sync from Dashboard state', () => {
      // Set up localStorage
      localStorage.setItem('active_pet', 'Luna');
      
      // Mock window.location.pathname
      Object.defineProperty(window, 'location', {
        value: { pathname: '/health-records' },
        writable: true,
      });
      
      syncManager.syncFromDashboard();
      
      const context = contextManager.getContext();
      expect(context.activePet).toBe('Luna');
      expect(context.currentPage).toBe('/health-records');
    });
  });

  describe('Edge Cases', () => {
    it('should handle navigation without params', () => {
      syncManager.handleNavigation('/dashboard');
      
      const context = contextManager.getContext();
      expect(context.currentPage).toBe('/dashboard');
    });

    it('should handle empty data entry', () => {
      syncManager.handleDataEntry('activity', '123', {});
      
      const context = contextManager.getContext();
      expect(context.previousIntents).toHaveLength(1);
    });

    it('should handle view change without data', () => {
      const listener = vi.fn();
      syncManager.addEventListener(DashboardEventType.VIEW_CHANGE, listener);
      
      syncManager.handleViewChange('medications');
      
      expect(listener).toHaveBeenCalledWith(
        expect.objectContaining({
          data: { viewName: 'medications', viewData: undefined },
        })
      );
    });
  });
});
