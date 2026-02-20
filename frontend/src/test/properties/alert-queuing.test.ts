/**
 * Property Test: Alert Queuing for Inactive Users
 * Feature: jojo-voice-assistant-enhanced
 * Property 24: Alert queuing for inactive users
 * 
 * For any scheduled alert that triggers when the user is not actively using the dashboard,
 * the alert should be queued for delivery in the next active session
 * 
 * **Validates: Requirements 7.6**
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import * as fc from 'fast-check';
import { ProactiveAlertManagerImpl } from '@/services/voice/proactiveAlertManager';
import { ProactiveAlert, AlertType } from '@/services/voice/types';

describe('Property 24: Alert Queuing for Inactive Users', () => {
  let alertManager: ProactiveAlertManagerImpl;
  let triggeredAlerts: ProactiveAlert[];
  let originalSetInterval: typeof setInterval;
  let originalClearInterval: typeof clearInterval;
  let originalLocalStorage: Storage;

  beforeEach(() => {
    // Save originals
    originalSetInterval = global.setInterval;
    originalClearInterval = global.clearInterval;
    originalLocalStorage = global.localStorage;

    // Mock localStorage
    const localStorageMock: { [key: string]: string } = {};
    global.localStorage = {
      getItem: vi.fn((key: string) => localStorageMock[key] || null),
      setItem: vi.fn((key: string, value: string) => {
        localStorageMock[key] = value;
      }),
      removeItem: vi.fn((key: string) => {
        delete localStorageMock[key];
      }),
      clear: vi.fn(() => {
        Object.keys(localStorageMock).forEach(key => delete localStorageMock[key]);
      }),
      key: vi.fn((index: number) => Object.keys(localStorageMock)[index] || null),
      length: Object.keys(localStorageMock).length
    } as Storage;

    // Mock timers BEFORE creating alert manager
    vi.useFakeTimers({ toFake: ['setInterval', 'clearInterval', 'setTimeout', 'clearTimeout', 'Date'] });

    // Track triggered alerts
    triggeredAlerts = [];

    // Create fresh alert manager (this will start monitoring with fake timers)
    alertManager = new ProactiveAlertManagerImpl();
    alertManager.onAlert(async (alert: ProactiveAlert) => {
      triggeredAlerts.push(alert);
    });

    vi.clearAllMocks();
  });

  afterEach(() => {
    // Cleanup alert manager
    if (alertManager) {
      alertManager.destroy();
    }
    
    // Restore originals
    global.setInterval = originalSetInterval;
    global.clearInterval = originalClearInterval;
    global.localStorage = originalLocalStorage;
    
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it('should queue alerts when user is inactive and deliver them when user becomes active', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          petId: fc.string({ minLength: 1, maxLength: 20 }).filter(s => s.trim().length > 0),
          alertType: fc.constantFrom(
            AlertType.MEDICATION_REMINDER,
            AlertType.APPOINTMENT_REMINDER,
            AlertType.FEEDING_OVERDUE,
            AlertType.HEALTH_CHECK
          ),
          minutesFromNow: fc.integer({ min: 7, max: 10 }), // Schedule further in future to avoid race
          priority: fc.constantFrom('low' as const, 'normal' as const, 'high' as const)
        }),
        async ({ petId, alertType, minutesFromNow, priority }) => {
          // Reset triggered alerts
          triggeredAlerts = [];

          // Schedule alert for future time (after we'll be inactive)
          const scheduledTime = new Date(Date.now() + minutesFromNow * 60 * 1000);
          const alert: ProactiveAlert = {
            id: `alert-${alertType}-${petId}-${Date.now()}`,
            type: alertType,
            petId,
            message: `Alert for ${alertType}`,
            scheduledTime,
            priority,
            visualData: { alertType },
            requiresAcknowledgment: true
          };

          alertManager.scheduleAlert(alert);

          // Verify alert is scheduled
          const pendingAlerts = alertManager.getPendingAlerts();
          expect(pendingAlerts).toContainEqual(alert);

          // Make user inactive by advancing time past inactivity threshold (5 minutes)
          // Advance in smaller increments to ensure inactivity timer fires
          await vi.advanceTimersByTimeAsync(5 * 60 * 1000 + 1000); // 5 min + 1 sec

          // Verify no alerts triggered yet (alert is still in future)
          expect(triggeredAlerts.length).toBe(0);

          // Now advance to the scheduled time while user is inactive
          const remainingTime = minutesFromNow * 60 * 1000 - (5 * 60 * 1000 + 1000);
          await vi.advanceTimersByTimeAsync(remainingTime + 1000); // Add 1 sec buffer

          // Alert should NOT be triggered immediately when user is inactive
          expect(triggeredAlerts.length).toBe(0);

          // Now simulate user becoming active (next session)
          document.dispatchEvent(new Event('mousedown'));

          // Wait for queued alerts to be processed
          await vi.advanceTimersByTimeAsync(500);

          // Alert should now be delivered
          expect(triggeredAlerts.length).toBeGreaterThan(0);
          expect(triggeredAlerts[0].type).toBe(alertType);
          expect(triggeredAlerts[0].petId).toBe(petId);
          expect(triggeredAlerts[0].priority).toBe(priority);
        }
      ),
      { numRuns: 100 }
    );
  }, 60000);

  it('should queue multiple alerts when user is inactive and deliver all when user becomes active', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.array(
          fc.record({
            petId: fc.string({ minLength: 1, maxLength: 20 }).filter(s => s.trim().length > 0),
            alertType: fc.constantFrom(
              AlertType.MEDICATION_REMINDER,
              AlertType.APPOINTMENT_REMINDER,
              AlertType.FEEDING_OVERDUE
            ),
            priority: fc.constantFrom('low' as const, 'normal' as const, 'high' as const)
          }),
          { minLength: 2, maxLength: 5 }
        ),
        async (alertConfigs) => {
          // Reset triggered alerts
          triggeredAlerts = [];

          // Schedule all alerts for the same time (well in the future)
          const scheduledTime = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes from now
          const alerts: ProactiveAlert[] = alertConfigs.map((config, index) => ({
            id: `alert-${config.alertType}-${config.petId}-${index}`,
            type: config.alertType,
            petId: config.petId,
            message: `Alert ${index}`,
            scheduledTime,
            priority: config.priority,
            visualData: {},
            requiresAcknowledgment: true
          }));

          alerts.forEach(alert => alertManager.scheduleAlert(alert));

          // Simulate user being INACTIVE (advance past inactivity threshold)
          await vi.advanceTimersByTimeAsync(5 * 60 * 1000 + 1000); // 5 min + 1 sec

          // Verify no alerts triggered yet
          expect(triggeredAlerts.length).toBe(0);

          // Advance to scheduled time while user is inactive
          await vi.advanceTimersByTimeAsync(5 * 60 * 1000); // Remaining time to reach 10 min

          // No alerts should be triggered yet
          expect(triggeredAlerts.length).toBe(0);

          // User becomes active
          document.dispatchEvent(new Event('mousedown'));

          // Wait for all queued alerts to be processed (2 seconds between each)
          await vi.advanceTimersByTimeAsync(alerts.length * 2500);

          // All alerts should now be delivered
          expect(triggeredAlerts.length).toBe(alerts.length);

          // Verify all alert IDs are present
          const triggeredIds = triggeredAlerts.map(a => a.id);
          alerts.forEach(alert => {
            expect(triggeredIds).toContain(alert.id);
          });
        }
      ),
      { numRuns: 20 }
    );
  }, 60000);

  it('should not lose alerts when user is inactive for extended periods', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          petId: fc.string({ minLength: 1, maxLength: 20 }).filter(s => s.trim().length > 0),
          alertType: fc.constantFrom(
            AlertType.MEDICATION_REMINDER,
            AlertType.APPOINTMENT_REMINDER,
            AlertType.FEEDING_OVERDUE
          ),
          inactiveMinutes: fc.integer({ min: 10, max: 60 })
        }),
        async ({ petId, alertType, inactiveMinutes }) => {
          // Reset triggered alerts
          triggeredAlerts = [];

          // Schedule alert for 8 minutes from now
          const scheduledTime = new Date(Date.now() + 8 * 60 * 1000);
          const alert: ProactiveAlert = {
            id: `alert-${alertType}-${petId}-${Date.now()}`,
            type: alertType,
            petId,
            message: `Alert for ${alertType}`,
            scheduledTime,
            priority: 'normal',
            visualData: {},
            requiresAcknowledgment: true
          };

          alertManager.scheduleAlert(alert);

          // Simulate user being INACTIVE for extended period
          await vi.advanceTimersByTimeAsync(6 * 60 * 1000); // Mark as inactive

          // Advance to scheduled time
          await vi.advanceTimersByTimeAsync(2 * 60 * 1000);

          // Continue being inactive for extended period
          await vi.advanceTimersByTimeAsync(inactiveMinutes * 60 * 1000);

          // Alert should still not be triggered
          expect(triggeredAlerts.length).toBe(0);

          // User finally becomes active
          document.dispatchEvent(new Event('mousedown'));

          // Wait for queued alerts to be processed
          await vi.advanceTimersByTimeAsync(500);

          // Alert should be delivered even after long inactivity
          expect(triggeredAlerts.length).toBeGreaterThan(0);
          expect(triggeredAlerts[0].id).toBe(alert.id);
        }
      ),
      { numRuns: 50 }
    );
  }, 60000);

  it('should deliver queued alerts in priority order when user becomes active', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.array(
          fc.record({
            petId: fc.string({ minLength: 1, maxLength: 20 }).filter(s => s.trim().length > 0),
            alertType: fc.constantFrom(
              AlertType.MEDICATION_REMINDER,
              AlertType.APPOINTMENT_REMINDER,
              AlertType.FEEDING_OVERDUE
            ),
            priority: fc.constantFrom('low' as const, 'normal' as const, 'high' as const)
          }),
          { minLength: 3, maxLength: 6 }
        ),
        async (alertConfigs) => {
          // Reset triggered alerts
          triggeredAlerts = [];

          // Schedule all alerts for the same time
          const scheduledTime = new Date(Date.now() + 2 * 60 * 1000);
          const alerts: ProactiveAlert[] = alertConfigs.map((config, index) => ({
            id: `alert-${config.alertType}-${config.petId}-${index}`,
            type: config.alertType,
            petId: config.petId,
            message: `Alert ${index}`,
            scheduledTime,
            priority: config.priority,
            visualData: {},
            requiresAcknowledgment: true
          }));

          alerts.forEach(alert => alertManager.scheduleAlert(alert));

          // Simulate user being INACTIVE
          await vi.advanceTimersByTimeAsync(6 * 60 * 1000);

          // Advance to scheduled time
          await vi.advanceTimersByTimeAsync(2 * 60 * 1000);

          // User becomes active
          document.dispatchEvent(new Event('mousedown'));

          // Wait for all queued alerts to be processed
          await vi.advanceTimersByTimeAsync(alerts.length * 2500);

          // All alerts should be delivered
          expect(triggeredAlerts.length).toBe(alerts.length);

          // Verify high priority alerts were delivered before lower priority ones
          const priorityOrder = { high: 3, normal: 2, low: 1 };
          for (let i = 0; i < triggeredAlerts.length - 1; i++) {
            const currentPriority = priorityOrder[triggeredAlerts[i].priority];
            const nextPriority = priorityOrder[triggeredAlerts[i + 1].priority];
            expect(currentPriority).toBeGreaterThanOrEqual(nextPriority);
          }
        }
      ),
      { numRuns: 20 }
    );
  }, 60000);

  it('should handle alerts scheduled during inactive period and queue them', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          petId: fc.string({ minLength: 1, maxLength: 20 }).filter(s => s.trim().length > 0),
          alertType: fc.constantFrom(
            AlertType.MEDICATION_REMINDER,
            AlertType.APPOINTMENT_REMINDER,
            AlertType.FEEDING_OVERDUE
          ),
          minutesUntilScheduled: fc.integer({ min: 2, max: 4 })
        }),
        async ({ petId, alertType, minutesUntilScheduled }) => {
          // Reset triggered alerts
          triggeredAlerts = [];

          // First, make user inactive
          await vi.advanceTimersByTimeAsync(5 * 60 * 1000 + 1000); // 5 min + 1 sec

          // Now schedule an alert while user is inactive (for future time)
          const scheduledTime = new Date(Date.now() + minutesUntilScheduled * 60 * 1000);
          const alert: ProactiveAlert = {
            id: `alert-${alertType}-${petId}-${Date.now()}`,
            type: alertType,
            petId,
            message: `Alert scheduled during inactivity`,
            scheduledTime,
            priority: 'normal',
            visualData: {},
            requiresAcknowledgment: true
          };

          alertManager.scheduleAlert(alert);

          // Advance to scheduled time (still inactive)
          await vi.advanceTimersByTimeAsync(minutesUntilScheduled * 60 * 1000 + 1000);

          // Alert should not be triggered
          expect(triggeredAlerts.length).toBe(0);

          // User becomes active
          document.dispatchEvent(new Event('mousedown'));

          // Wait for queued alerts
          await vi.advanceTimersByTimeAsync(500);

          // Alert should be delivered
          expect(triggeredAlerts.length).toBeGreaterThan(0);
          expect(triggeredAlerts[0].type).toBe(alertType);
          expect(triggeredAlerts[0].petId).toBe(petId);
        }
      ),
      { numRuns: 100 }
    );
  }, 60000);

  it('should clear queue after delivering all queued alerts', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.array(
          fc.record({
            petId: fc.string({ minLength: 1, maxLength: 20 }).filter(s => s.trim().length > 0),
            alertType: fc.constantFrom(
              AlertType.MEDICATION_REMINDER,
              AlertType.APPOINTMENT_REMINDER
            )
          }),
          { minLength: 1, maxLength: 3 }
        ),
        async (alertConfigs) => {
          // Reset triggered alerts
          triggeredAlerts = [];

          // Schedule alerts
          const scheduledTime = new Date(Date.now() + 2 * 60 * 1000);
          const alerts: ProactiveAlert[] = alertConfigs.map((config, index) => ({
            id: `alert-${config.alertType}-${config.petId}-${index}`,
            type: config.alertType,
            petId: config.petId,
            message: `Alert ${index}`,
            scheduledTime,
            priority: 'normal',
            visualData: {},
            requiresAcknowledgment: true
          }));

          alerts.forEach(alert => alertManager.scheduleAlert(alert));

          // Make user inactive and trigger alerts
          await vi.advanceTimersByTimeAsync(6 * 60 * 1000);
          await vi.advanceTimersByTimeAsync(2 * 60 * 1000);

          // User becomes active - alerts should be delivered
          document.dispatchEvent(new Event('mousedown'));
          await vi.advanceTimersByTimeAsync(alerts.length * 2500);

          // All alerts delivered
          expect(triggeredAlerts.length).toBe(alerts.length);

          // Reset triggered alerts to test queue is cleared
          triggeredAlerts = [];

          // User becomes inactive again
          await vi.advanceTimersByTimeAsync(6 * 60 * 1000);

          // User becomes active again
          document.dispatchEvent(new Event('mousedown'));
          await vi.advanceTimersByTimeAsync(500);

          // No alerts should be triggered (queue was cleared)
          expect(triggeredAlerts.length).toBe(0);
        }
      ),
      { numRuns: 50 }
    );
  }, 60000);

  it('should handle rapid user activity state changes correctly', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          petId: fc.string({ minLength: 1, maxLength: 20 }).filter(s => s.trim().length > 0),
          alertType: fc.constantFrom(
            AlertType.MEDICATION_REMINDER,
            AlertType.APPOINTMENT_REMINDER
          )
        }),
        async ({ petId, alertType }) => {
          // Reset triggered alerts
          triggeredAlerts = [];

          // Schedule alert for well in the future
          const scheduledTime = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes
          const alert: ProactiveAlert = {
            id: `alert-${alertType}-${petId}-${Date.now()}`,
            type: alertType,
            petId,
            message: `Alert for rapid state changes`,
            scheduledTime,
            priority: 'normal',
            visualData: {},
            requiresAcknowledgment: true
          };

          alertManager.scheduleAlert(alert);

          // Make user inactive
          await vi.advanceTimersByTimeAsync(5 * 60 * 1000 + 1000); // 5 min + 1 sec

          // Advance to scheduled time
          await vi.advanceTimersByTimeAsync(5 * 60 * 1000); // Remaining time

          // Alert should be queued
          expect(triggeredAlerts.length).toBe(0);

          // User becomes active briefly
          document.dispatchEvent(new Event('mousedown'));
          await vi.advanceTimersByTimeAsync(100);

          // Alert should start being delivered
          expect(triggeredAlerts.length).toBeGreaterThan(0);
          expect(triggeredAlerts[0].type).toBe(alertType);
          expect(triggeredAlerts[0].petId).toBe(petId);
        }
      ),
      { numRuns: 100 }
    );
  }, 60000);
});
