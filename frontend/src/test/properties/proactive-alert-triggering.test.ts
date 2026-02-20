/**
 * Property Test: Proactive Alert Triggering
 * Feature: jojo-voice-assistant-enhanced
 * Property 21: Proactive alert triggering
 * 
 * For any scheduled reminder (medication, appointment, feeding), when the scheduled time 
 * arrives and the user is active, JoJo should speak the alert without user request
 * 
 * Validates: Requirements 7.1, 7.2, 7.3
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import * as fc from 'fast-check';
import { ProactiveAlertManagerImpl } from '@/services/voice/proactiveAlertManager';
import { ProactiveAlert, AlertType } from '@/services/voice/types';

describe('Property 21: Proactive Alert Triggering', () => {
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

    // Mock timers with limited runs to avoid infinite loops
    vi.useFakeTimers({ toFake: ['setInterval', 'clearInterval', 'setTimeout', 'clearTimeout', 'Date'] });

    // Track triggered alerts
    triggeredAlerts = [];

    vi.clearAllMocks();
  });

  afterEach(() => {
    // Cleanup alert manager if it exists
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

  it('should trigger medication reminders when scheduled time arrives and user is active', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          petId: fc.string({ minLength: 1, maxLength: 20 }).filter(s => s.trim().length > 0),
          medicationName: fc.string({ minLength: 3, maxLength: 30 }).filter(s => s.trim().length >= 3),
          minutesFromNow: fc.integer({ min: 1, max: 5 }),
          priority: fc.constantFrom('low' as const, 'normal' as const, 'high' as const)
        }),
        async ({ petId, medicationName, minutesFromNow, priority }) => {
          // Reset triggered alerts
          triggeredAlerts = [];

          // Create fresh alert manager for this test
          alertManager = new ProactiveAlertManagerImpl();
          alertManager.onAlert(async (alert: ProactiveAlert) => {
            triggeredAlerts.push(alert);
          });

          // Simulate user activity
          document.dispatchEvent(new Event('mousedown'));

          // Schedule medication reminder
          const scheduledTime = new Date(Date.now() + minutesFromNow * 60 * 1000);
          const alert: ProactiveAlert = {
            id: `med-${petId}-${Date.now()}`,
            type: AlertType.MEDICATION_REMINDER,
            petId,
            message: `Time to give ${medicationName} to your pet`,
            scheduledTime,
            priority,
            visualData: { medicationName },
            requiresAcknowledgment: true
          };

          alertManager.scheduleAlert(alert);

          // Verify alert is scheduled
          const pendingAlerts = alertManager.getPendingAlerts();
          expect(pendingAlerts).toContainEqual(alert);

          // Advance time to scheduled time (advance by the exact amount needed)
          await vi.advanceTimersByTimeAsync(minutesFromNow * 60 * 1000);

          // Verify alert was triggered
          expect(triggeredAlerts.length).toBeGreaterThan(0);
          expect(triggeredAlerts[0].id).toBe(alert.id);
          expect(triggeredAlerts[0].type).toBe(AlertType.MEDICATION_REMINDER);
          expect(triggeredAlerts[0].petId).toBe(petId);

          // Cleanup
          alertManager.destroy();
        }
      ),
      { numRuns: 100 }
    );
  }, 60000);

  it('should trigger appointment reminders when scheduled time arrives and user is active', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          petId: fc.string({ minLength: 1, maxLength: 20 }).filter(s => s.trim().length > 0),
          appointmentType: fc.constantFrom('vet', 'grooming', 'vaccination'),
          minutesFromNow: fc.integer({ min: 1, max: 5 }),
          priority: fc.constantFrom('low' as const, 'normal' as const, 'high' as const)
        }),
        async ({ petId, appointmentType, minutesFromNow, priority }) => {
          // Reset triggered alerts
          triggeredAlerts = [];

          // Schedule appointment reminder (24 hours before)
          const scheduledTime = new Date(Date.now() + minutesFromNow * 60 * 1000);
          const alert: ProactiveAlert = {
            id: `appt-${petId}-${Date.now()}`,
            type: AlertType.APPOINTMENT_REMINDER,
            petId,
            message: `Reminder: ${appointmentType} appointment in 24 hours`,
            scheduledTime,
            priority,
            visualData: { appointmentType },
            requiresAcknowledgment: true
          };

          alertManager.scheduleAlert(alert);

          // Verify alert is scheduled
          const pendingAlerts = alertManager.getPendingAlerts();
          expect(pendingAlerts).toContainEqual(alert);

          // Simulate user activity
          document.dispatchEvent(new Event('mousedown'));

          // Advance time to scheduled time
          await vi.advanceTimersByTimeAsync(minutesFromNow * 60 * 1000);

          // Verify alert was triggered
          expect(triggeredAlerts.length).toBeGreaterThan(0);
          expect(triggeredAlerts[0].id).toBe(alert.id);
          expect(triggeredAlerts[0].type).toBe(AlertType.APPOINTMENT_REMINDER);
          expect(triggeredAlerts[0].petId).toBe(petId);
        }
      ),
      { numRuns: 100 }
    );
  }, 60000);

  it('should trigger feeding overdue alerts when scheduled time arrives and user is active', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          petId: fc.string({ minLength: 1, maxLength: 20 }).filter(s => s.trim().length > 0),
          mealType: fc.constantFrom('breakfast', 'lunch', 'dinner'),
          minutesFromNow: fc.integer({ min: 1, max: 5 }),
          priority: fc.constantFrom('normal' as const, 'high' as const)
        }),
        async ({ petId, mealType, minutesFromNow, priority }) => {
          // Reset triggered alerts
          triggeredAlerts = [];

          // Schedule feeding overdue alert (30 minutes after scheduled feeding time)
          const scheduledTime = new Date(Date.now() + minutesFromNow * 60 * 1000);
          const alert: ProactiveAlert = {
            id: `feed-${petId}-${Date.now()}`,
            type: AlertType.FEEDING_OVERDUE,
            petId,
            message: `${mealType} feeding is overdue by 30 minutes`,
            scheduledTime,
            priority,
            visualData: { mealType },
            requiresAcknowledgment: true
          };

          alertManager.scheduleAlert(alert);

          // Verify alert is scheduled
          const pendingAlerts = alertManager.getPendingAlerts();
          expect(pendingAlerts).toContainEqual(alert);

          // Simulate user activity
          document.dispatchEvent(new Event('mousedown'));

          // Advance time to scheduled time
          await vi.advanceTimersByTimeAsync(minutesFromNow * 60 * 1000);

          // Verify alert was triggered
          expect(triggeredAlerts.length).toBeGreaterThan(0);
          expect(triggeredAlerts[0].id).toBe(alert.id);
          expect(triggeredAlerts[0].type).toBe(AlertType.FEEDING_OVERDUE);
          expect(triggeredAlerts[0].petId).toBe(petId);
        }
      ),
      { numRuns: 100 }
    );
  }, 60000);

  it('should trigger alerts automatically without user request', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          alertType: fc.constantFrom(
            AlertType.MEDICATION_REMINDER,
            AlertType.APPOINTMENT_REMINDER,
            AlertType.FEEDING_OVERDUE
          ),
          petId: fc.string({ minLength: 1, maxLength: 20 }).filter(s => s.trim().length > 0),
          minutesFromNow: fc.integer({ min: 1, max: 5 })
        }),
        async ({ alertType, petId, minutesFromNow }) => {
          // Reset triggered alerts
          triggeredAlerts = [];

          // Schedule alert
          const scheduledTime = new Date(Date.now() + minutesFromNow * 60 * 1000);
          const alert: ProactiveAlert = {
            id: `alert-${alertType}-${petId}-${Date.now()}`,
            type: alertType,
            petId,
            message: `Proactive alert for ${alertType}`,
            scheduledTime,
            priority: 'normal',
            visualData: {},
            requiresAcknowledgment: true
          };

          alertManager.scheduleAlert(alert);

          // Simulate user activity (but NO explicit user request)
          document.dispatchEvent(new Event('mousedown'));

          // Advance time to scheduled time
          await vi.advanceTimersByTimeAsync(minutesFromNow * 60 * 1000);

          // Verify alert was triggered automatically (without user request)
          expect(triggeredAlerts.length).toBeGreaterThan(0);
          expect(triggeredAlerts[0].id).toBe(alert.id);
          expect(triggeredAlerts[0].type).toBe(alertType);
        }
      ),
      { numRuns: 100 }
    );
  }, 60000);

  it('should only trigger alerts when user is active', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          petId: fc.string({ minLength: 1, maxLength: 20 }).filter(s => s.trim().length > 0),
          alertType: fc.constantFrom(
            AlertType.MEDICATION_REMINDER,
            AlertType.APPOINTMENT_REMINDER,
            AlertType.FEEDING_OVERDUE
          ),
          minutesFromNow: fc.integer({ min: 1, max: 5 })
        }),
        async ({ petId, alertType, minutesFromNow }) => {
          // Reset triggered alerts
          triggeredAlerts = [];

          // Schedule alert
          const scheduledTime = new Date(Date.now() + minutesFromNow * 60 * 1000);
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

          // Simulate user being INACTIVE (no activity events)
          // Mark user as inactive by advancing time past inactivity threshold
          await vi.advanceTimersByTimeAsync(6 * 60 * 1000); // 6 minutes (past 5 minute threshold)

          // Advance to scheduled time
          await vi.advanceTimersByTimeAsync(minutesFromNow * 60 * 1000);

          // Alert should NOT be triggered when user is inactive
          // It should be queued instead
          expect(triggeredAlerts.length).toBe(0);

          // Now simulate user becoming active
          document.dispatchEvent(new Event('mousedown'));

          // Wait a bit for queued alerts to be processed
          await vi.advanceTimersByTimeAsync(100);

          // Now the alert should be triggered
          expect(triggeredAlerts.length).toBeGreaterThan(0);
          expect(triggeredAlerts[0].id).toBe(alert.id);
        }
      ),
      { numRuns: 100 }
    );
  }, 60000);

  it('should trigger multiple alerts in priority order when multiple are due', async () => {
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

          // Simulate user activity
          document.dispatchEvent(new Event('mousedown'));

          // Advance time to scheduled time
          await vi.advanceTimersByTimeAsync(2 * 60 * 1000);

          // Wait for all alerts to be processed (2 seconds between each)
          await vi.advanceTimersByTimeAsync(alerts.length * 2000);

          // Verify all alerts were triggered
          expect(triggeredAlerts.length).toBe(alerts.length);

          // Verify high priority alerts were triggered before lower priority ones
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

  it('should handle alerts scheduled at exact current time', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          petId: fc.string({ minLength: 1, maxLength: 20 }).filter(s => s.trim().length > 0),
          alertType: fc.constantFrom(
            AlertType.MEDICATION_REMINDER,
            AlertType.APPOINTMENT_REMINDER,
            AlertType.FEEDING_OVERDUE
          )
        }),
        async ({ petId, alertType }) => {
          // Reset triggered alerts
          triggeredAlerts = [];

          // Schedule alert for current time (already due)
          const scheduledTime = new Date(Date.now());
          const alert: ProactiveAlert = {
            id: `alert-${alertType}-${petId}-${Date.now()}`,
            type: alertType,
            petId,
            message: `Immediate alert`,
            scheduledTime,
            priority: 'high',
            visualData: {},
            requiresAcknowledgment: true
          };

          alertManager.scheduleAlert(alert);

          // Simulate user activity
          document.dispatchEvent(new Event('mousedown'));

          // Trigger immediate check by advancing just a tiny bit
          await vi.advanceTimersByTimeAsync(100);

          // Alert should be triggered immediately
          expect(triggeredAlerts.length).toBeGreaterThan(0);
          expect(triggeredAlerts[0].id).toBe(alert.id);
        }
      ),
      { numRuns: 100 }
    );
  }, 60000);
});
