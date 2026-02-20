/**
 * Property-Based Tests for Context Synchronization
 * Feature: jojo-voice-assistant-enhanced
 * 
 * Tests Properties 63 and 64 using property-based testing
 */

import { describe, it, expect, beforeEach } from 'vitest';
import fc from 'fast-check';
import { ContextSyncManager, DashboardEventType } from '../../services/voice/contextSyncManager';
import { ContextManager } from '../../services/voice/contextManager';

describe('Context Synchronization Properties', () => {
  let contextManager: ContextManager;
  let syncManager: ContextSyncManager;

  beforeEach(() => {
    contextManager = new ContextManager('/');
    syncManager = new ContextSyncManager(contextManager);
    syncManager.initialize();
  });

  // Feature: jojo-voice-assistant-enhanced, Property 63: Manual-context bidirectional sync
  describe('Property 63: Manual-context bidirectional sync', () => {
    it('should update Context_Memory for any manual Dashboard interaction', () => {
      fc.assert(
        fc.property(
          fc.record({
            page: fc.constantFrom(
              '/dashboard',
              '/appointments',
              '/health-records',
              '/medications',
              '/feeding'
            ),
            petId: fc.string({ minLength: 1, maxLength: 10 }),
            petName: fc.string({ minLength: 1, maxLength: 20 }),
          }),
          ({ page, petId, petName }) => {
            // Create fresh instances for each property test run
            const freshContextManager = new ContextManager('/');
            const freshSyncManager = new ContextSyncManager(freshContextManager);
            freshSyncManager.initialize();

            // Perform manual Dashboard interaction: navigation with pet selection
            freshSyncManager.handleNavigation(page, { petId });
            freshSyncManager.handlePetSelection(petId, petName);

            // Verify Context_Memory reflects the state change
            const context = freshContextManager.getContext();

            // Context should have updated page
            expect(context.currentPage).toBe(page);

            // Context should have active pet for subsequent voice commands
            expect(context.activePet).toBe(petName);

            // Context should have intent history
            expect(context.previousIntents.length).toBeGreaterThan(0);

            // Context should have pet entity
            const petEntity = context.recentEntities.find(
              e => e.type === 'pet_name' && e.value === petName
            );
            expect(petEntity).toBeDefined();
            expect(petEntity?.resolvedValue).toBe(petId);

            // Cleanup
            freshSyncManager.shutdown();
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should update Context_Memory for any manual data entry interaction', () => {
      fc.assert(
        fc.property(
          fc.record({
            dataType: fc.constantFrom('feeding', 'medication', 'weight', 'activity'),
            petId: fc.string({ minLength: 1, maxLength: 10 }),
            amount: fc.integer({ min: 1, max: 10 }),
            unit: fc.constantFrom('cups', 'grams', 'kg', 'lbs'),
          }),
          ({ dataType, petId, amount, unit }) => {
            // Create fresh instances for each property test run
            const freshContextManager = new ContextManager('/');
            const freshSyncManager = new ContextSyncManager(freshContextManager);
            freshSyncManager.initialize();

            // Perform manual data entry
            const data = { amount, unit, time: new Date() };
            freshSyncManager.handleDataEntry(dataType, petId, data);

            // Verify Context_Memory reflects the data entry
            const context = freshContextManager.getContext();

            // Context should have the data entry intent
            const dataEntryIntent = context.previousIntents.find(
              intent => intent.action === 'log_data' && intent.target === dataType
            );

            expect(dataEntryIntent).toBeDefined();
            expect(dataEntryIntent?.parameters.petId).toBe(petId);
            expect(dataEntryIntent?.parameters.amount).toBe(amount);

            // Cleanup
            freshSyncManager.shutdown();
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should maintain context across multiple manual interactions', () => {
      fc.assert(
        fc.property(
          fc.array(
            fc.record({
              petName: fc.string({ minLength: 1, maxLength: 20 }),
              petId: fc.string({ minLength: 1, maxLength: 10 }),
              page: fc.constantFrom('/dashboard', '/appointments', '/health-records'),
            }),
            { minLength: 1, maxLength: 5 }
          ),
          (interactions) => {
            // Create fresh instances for each property test run
            const freshContextManager = new ContextManager('/');
            const freshSyncManager = new ContextSyncManager(freshContextManager);
            freshSyncManager.initialize();

            // Perform multiple manual interactions
            interactions.forEach(({ petName, petId, page }) => {
              freshSyncManager.handlePetSelection(petId, petName);
              freshSyncManager.handleNavigation(page);
            });

            // Verify context maintains history
            const context = freshContextManager.getContext();

            // Last pet should be active
            const lastInteraction = interactions[interactions.length - 1];
            expect(context.activePet).toBe(lastInteraction.petName);

            // Last page should be current
            expect(context.currentPage).toBe(lastInteraction.page);

            // Intent history should be maintained (up to 10 turns)
            expect(context.previousIntents.length).toBeGreaterThan(0);
            expect(context.previousIntents.length).toBeLessThanOrEqual(10);

            // Cleanup
            freshSyncManager.shutdown();
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  // Feature: jojo-voice-assistant-enhanced, Property 64: Real-time cross-view updates
  describe('Property 64: Real-time cross-view updates', () => {
    it('should notify all views for any data modification via voice command', () => {
      fc.assert(
        fc.property(
          fc.record({
            entityType: fc.constantFrom('appointment', 'medication', 'feeding', 'weight'),
            entityId: fc.string({ minLength: 1, maxLength: 10 }),
            changeType: fc.constantFrom('create', 'update', 'delete'),
            data: fc.record({
              value: fc.integer({ min: 1, max: 100 }),
              timestamp: fc.date(),
            }),
          }),
          ({ entityType, entityId, changeType, data }) => {
            // Set up multiple view listeners (simulating different Dashboard views)
            const view1Updates: any[] = [];
            const view2Updates: any[] = [];
            const view3Updates: any[] = [];

            syncManager.onDataChange(event => view1Updates.push(event));
            syncManager.onDataChange(event => view2Updates.push(event));
            syncManager.onDataChange(event => view3Updates.push(event));

            // Perform voice command data modification
            syncManager.notifyDataChange(entityType, entityId, changeType, data);

            // Verify all views received the update in real-time
            expect(view1Updates).toHaveLength(1);
            expect(view2Updates).toHaveLength(1);
            expect(view3Updates).toHaveLength(1);

            // Verify update content is correct
            [view1Updates, view2Updates, view3Updates].forEach(updates => {
              expect(updates[0].entityType).toBe(entityType);
              expect(updates[0].entityId).toBe(entityId);
              expect(updates[0].changeType).toBe(changeType);
              expect(updates[0].data).toEqual(data);
            });
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should update all views displaying the same data in real-time', () => {
      fc.assert(
        fc.property(
          fc.array(
            fc.record({
              entityType: fc.constantFrom('appointment', 'medication', 'feeding'),
              entityId: fc.string({ minLength: 1, maxLength: 10 }),
              changeType: fc.constantFrom('create', 'update', 'delete'),
            }),
            { minLength: 1, maxLength: 10 }
          ),
          (modifications) => {
            // Set up view listeners
            const allUpdates: any[] = [];
            syncManager.onDataChange(event => allUpdates.push(event));

            // Perform multiple voice command modifications
            modifications.forEach(({ entityType, entityId, changeType }) => {
              syncManager.notifyDataChange(entityType, entityId, changeType, {
                timestamp: new Date(),
              });
            });

            // Verify all modifications were broadcast
            expect(allUpdates).toHaveLength(modifications.length);

            // Verify each modification matches
            modifications.forEach((mod, index) => {
              expect(allUpdates[index].entityType).toBe(mod.entityType);
              expect(allUpdates[index].entityId).toBe(mod.entityId);
              expect(allUpdates[index].changeType).toBe(mod.changeType);
            });
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should handle concurrent view updates without data loss', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 1, max: 20 }),
          fc.record({
            entityType: fc.constantFrom('appointment', 'medication', 'feeding', 'weight'),
            entityId: fc.string({ minLength: 1, maxLength: 10 }),
          }),
          (viewCount, { entityType, entityId }) => {
            // Set up multiple concurrent view listeners
            const viewUpdates: any[][] = [];
            for (let i = 0; i < viewCount; i++) {
              const updates: any[] = [];
              syncManager.onDataChange(event => updates.push(event));
              viewUpdates.push(updates);
            }

            // Perform voice command modification
            const testData = { value: 42, timestamp: new Date() };
            syncManager.notifyDataChange(entityType, entityId, 'update', testData);

            // Verify all views received the update
            expect(viewUpdates).toHaveLength(viewCount);
            viewUpdates.forEach(updates => {
              expect(updates).toHaveLength(1);
              expect(updates[0].entityType).toBe(entityType);
              expect(updates[0].entityId).toBe(entityId);
              expect(updates[0].data).toEqual(testData);
            });
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should maintain update order across views', () => {
      fc.assert(
        fc.property(
          fc.array(
            fc.record({
              entityType: fc.constantFrom('appointment', 'medication'),
              entityId: fc.string({ minLength: 1, maxLength: 10 }),
              sequence: fc.integer({ min: 1, max: 100 }),
            }),
            { minLength: 2, maxLength: 10 }
          ),
          (modifications) => {
            // Set up view listeners
            const view1Updates: any[] = [];
            const view2Updates: any[] = [];

            syncManager.onDataChange(event => view1Updates.push(event));
            syncManager.onDataChange(event => view2Updates.push(event));

            // Perform modifications in sequence
            modifications.forEach(({ entityType, entityId, sequence }) => {
              syncManager.notifyDataChange(entityType, entityId, 'update', { sequence });
            });

            // Verify both views received updates in same order
            expect(view1Updates).toHaveLength(modifications.length);
            expect(view2Updates).toHaveLength(modifications.length);

            modifications.forEach((mod, index) => {
              expect(view1Updates[index].data.sequence).toBe(mod.sequence);
              expect(view2Updates[index].data.sequence).toBe(mod.sequence);
            });
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  describe('Bidirectional Sync Integration', () => {
    it('should maintain sync when alternating between manual and voice interactions', () => {
      fc.assert(
        fc.property(
          fc.array(
            fc.record({
              isManual: fc.boolean(),
              petName: fc.string({ minLength: 1, maxLength: 20 }),
              petId: fc.string({ minLength: 1, maxLength: 10 }),
              dataType: fc.constantFrom('feeding', 'medication', 'weight'),
            }),
            { minLength: 2, maxLength: 10 }
          ),
          (interactions) => {
            const allUpdates: any[] = [];
            syncManager.onDataChange(event => allUpdates.push(event));

            interactions.forEach(({ isManual, petName, petId, dataType }) => {
              if (isManual) {
                // Manual interaction
                syncManager.handlePetSelection(petId, petName);
                syncManager.handleDataEntry(dataType, petId, { value: 1 });
              } else {
                // Voice command interaction
                syncManager.notifyDataChange(dataType, petId, 'create', { value: 1 });
              }
            });

            // Verify context is maintained
            const context = contextManager.getContext();
            expect(context.previousIntents.length).toBeGreaterThan(0);

            // Verify voice updates were broadcast
            const voiceInteractions = interactions.filter(i => !i.isManual);
            expect(allUpdates.length).toBeGreaterThanOrEqual(voiceInteractions.length);
          }
        ),
        { numRuns: 100 }
      );
    });
  });
});
