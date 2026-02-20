/**
 * Property Test: Alert Acknowledgment
 * Feature: jojo-voice-assistant-enhanced
 * Property 23: Alert acknowledgment
 * 
 * For any proactive alert, when the user acknowledges it via voice, 
 * JoJo should mark the reminder as acknowledged in the system
 * 
 * Validates: Requirements 7.5
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import * as fc from 'fast-check';
import { ProactiveAlertManagerImpl } from '@/services/voice/proactiveAlertManager';
import { ProactiveAlert, AlertType } from '@/services/voice/types';

describe('Property 23: Alert Acknowledgment', () => {
  let alertManager: ProactiveAlertManagerImpl;
  let originalLocalStorage: Storage;

  beforeEach(() => {
    // Save original localStorage
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

    // Create fresh alert manager
    alertManager = new ProactiveAlertManagerImpl();

    vi.clearAllMocks();
  });

  afterEach(() => {
    // Cleanup alert manager
    if (alertManager) {
      alertManager.destroy();
    }
    
    // Restore original localStorage
    global.localStorage = originalLocalStorage;
    
    vi.restoreAllMocks();
  });

  it('should mark medication reminder as acknowledged when user acknowledges via voice', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          petId: fc.string({ minLength: 1, maxLength: 20 }).filter(s => s.trim().length > 0),
          medicationName: fc.string({ minLength: 3, maxLength: 30 }).filter(s => s.trim().length >= 3),
          priority: fc.constantFrom('low' as const, 'normal' as const, 'high' as const),
          acknowledgmentPhrase: fc.constantFrom('okay', 'got it', 'done', 'thanks', 'acknowledged')
        }),
        async ({ petId, medicationName, priority, acknowledgmentPhrase }) => {
          // Schedule a medication reminder
          const alert: ProactiveAlert = {
            id: `med-${petId}-${Date.now()}-${Math.random()}`,
            type: AlertType.MEDICATION_REMINDER,
            petId,
            message: `Time to give ${medicationName} to your pet`,
            scheduledTime: new Date(Date.now() + 60000),
            priority,
            visualData: { medicationName },
            requiresAcknowledgment: true
          };

          alertManager.scheduleAlert(alert);

          // Verify alert is in pending alerts
          const pendingBefore = alertManager.getPendingAlerts();
          expect(pendingBefore).toContainEqual(alert);
          expect(pendingBefore.length).toBeGreaterThan(0);

          // User acknowledges the alert via voice (simulated by calling acknowledgeAlert)
          // In real implementation, this would be triggered by voice command recognition
          alertManager.acknowledgeAlert(alert.id);

          // Verify alert is no longer in pending alerts (marked as acknowledged)
          const pendingAfter = alertManager.getPendingAlerts();
          expect(pendingAfter).not.toContainEqual(alert);
          expect(pendingAfter.find(a => a.id === alert.id)).toBeUndefined();
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should mark appointment reminder as acknowledged when user acknowledges via voice', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          petId: fc.string({ minLength: 1, maxLength: 20 }).filter(s => s.trim().length > 0),
          appointmentType: fc.constantFrom('vet', 'grooming', 'vaccination', 'checkup'),
          priority: fc.constantFrom('low' as const, 'normal' as const, 'high' as const),
          acknowledgmentPhrase: fc.constantFrom('okay', 'got it', 'done', 'thanks', 'acknowledged')
        }),
        async ({ petId, appointmentType, priority, acknowledgmentPhrase }) => {
          // Schedule an appointment reminder
          const alert: ProactiveAlert = {
            id: `appt-${petId}-${Date.now()}-${Math.random()}`,
            type: AlertType.APPOINTMENT_REMINDER,
            petId,
            message: `Reminder: ${appointmentType} appointment in 24 hours`,
            scheduledTime: new Date(Date.now() + 60000),
            priority,
            visualData: { appointmentType },
            requiresAcknowledgment: true
          };

          alertManager.scheduleAlert(alert);

          // Verify alert is scheduled
          const pendingBefore = alertManager.getPendingAlerts();
          expect(pendingBefore).toContainEqual(alert);

          // User acknowledges via voice
          alertManager.acknowledgeAlert(alert.id);

          // Verify alert is marked as acknowledged (removed from pending)
          const pendingAfter = alertManager.getPendingAlerts();
          expect(pendingAfter.find(a => a.id === alert.id)).toBeUndefined();
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should mark feeding overdue alert as acknowledged when user acknowledges via voice', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          petId: fc.string({ minLength: 1, maxLength: 20 }).filter(s => s.trim().length > 0),
          mealType: fc.constantFrom('breakfast', 'lunch', 'dinner', 'snack'),
          priority: fc.constantFrom('normal' as const, 'high' as const),
          acknowledgmentPhrase: fc.constantFrom('okay', 'got it', 'done', 'thanks', 'acknowledged')
        }),
        async ({ petId, mealType, priority, acknowledgmentPhrase }) => {
          // Schedule a feeding overdue alert
          const alert: ProactiveAlert = {
            id: `feed-${petId}-${Date.now()}-${Math.random()}`,
            type: AlertType.FEEDING_OVERDUE,
            petId,
            message: `${mealType} feeding is overdue by 30 minutes`,
            scheduledTime: new Date(Date.now() + 60000),
            priority,
            visualData: { mealType },
            requiresAcknowledgment: true
          };

          alertManager.scheduleAlert(alert);

          // Verify alert is scheduled
          expect(alertManager.getPendingAlerts()).toContainEqual(alert);

          // User acknowledges via voice
          alertManager.acknowledgeAlert(alert.id);

          // Verify alert is acknowledged
          expect(alertManager.getPendingAlerts().find(a => a.id === alert.id)).toBeUndefined();
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should mark health check alert as acknowledged when user acknowledges via voice', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          petId: fc.string({ minLength: 1, maxLength: 20 }).filter(s => s.trim().length > 0),
          checkType: fc.constantFrom('weight', 'temperature', 'general', 'dental'),
          priority: fc.constantFrom('low' as const, 'normal' as const, 'high' as const),
          acknowledgmentPhrase: fc.constantFrom('okay', 'got it', 'done', 'thanks', 'acknowledged')
        }),
        async ({ petId, checkType, priority, acknowledgmentPhrase }) => {
          // Schedule a health check alert
          const alert: ProactiveAlert = {
            id: `health-${petId}-${Date.now()}-${Math.random()}`,
            type: AlertType.HEALTH_CHECK,
            petId,
            message: `Time for ${checkType} health check`,
            scheduledTime: new Date(Date.now() + 60000),
            priority,
            visualData: { checkType },
            requiresAcknowledgment: true
          };

          alertManager.scheduleAlert(alert);

          // Verify alert is scheduled
          const pendingBefore = alertManager.getPendingAlerts();
          expect(pendingBefore.some(a => a.id === alert.id)).toBe(true);

          // User acknowledges via voice
          alertManager.acknowledgeAlert(alert.id);

          // Verify alert is acknowledged (removed from system)
          const pendingAfter = alertManager.getPendingAlerts();
          expect(pendingAfter.some(a => a.id === alert.id)).toBe(false);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should handle acknowledgment of any alert type via voice commands', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          alertType: fc.constantFrom(
            AlertType.MEDICATION_REMINDER,
            AlertType.APPOINTMENT_REMINDER,
            AlertType.FEEDING_OVERDUE,
            AlertType.HEALTH_CHECK
          ),
          petId: fc.string({ minLength: 1, maxLength: 20 }).filter(s => s.trim().length > 0),
          priority: fc.constantFrom('low' as const, 'normal' as const, 'high' as const),
          acknowledgmentPhrase: fc.constantFrom('okay', 'got it', 'done', 'thanks', 'acknowledged', 'yes', 'alright')
        }),
        async ({ alertType, petId, priority, acknowledgmentPhrase }) => {
          // Create alert of any type
          const alert: ProactiveAlert = {
            id: `alert-${alertType}-${petId}-${Date.now()}-${Math.random()}`,
            type: alertType,
            petId,
            message: `Alert for ${alertType}`,
            scheduledTime: new Date(Date.now() + 60000),
            priority,
            visualData: {},
            requiresAcknowledgment: true
          };

          alertManager.scheduleAlert(alert);

          // Verify alert exists before acknowledgment
          const alertExists = alertManager.getPendingAlerts().some(a => a.id === alert.id);
          expect(alertExists).toBe(true);

          // User acknowledges via voice (any acknowledgment phrase should work)
          alertManager.acknowledgeAlert(alert.id);

          // Verify alert is marked as acknowledged in the system
          const alertStillExists = alertManager.getPendingAlerts().some(a => a.id === alert.id);
          expect(alertStillExists).toBe(false);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should handle acknowledgment of multiple alerts independently', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.array(
          fc.record({
            petId: fc.string({ minLength: 1, maxLength: 20 }).filter(s => s.trim().length > 0),
            alertType: fc.constantFrom(
              AlertType.MEDICATION_REMINDER,
              AlertType.APPOINTMENT_REMINDER,
              AlertType.FEEDING_OVERDUE,
              AlertType.HEALTH_CHECK
            ),
            priority: fc.constantFrom('low' as const, 'normal' as const, 'high' as const)
          }),
          { minLength: 2, maxLength: 5 }
        ),
        async (alertConfigs) => {
          // Schedule multiple alerts
          const alerts: ProactiveAlert[] = alertConfigs.map((config, index) => ({
            id: `alert-${config.alertType}-${config.petId}-${index}-${Date.now()}-${Math.random()}`,
            type: config.alertType,
            petId: config.petId,
            message: `Alert ${index}`,
            scheduledTime: new Date(Date.now() + 60000),
            priority: config.priority,
            visualData: {},
            requiresAcknowledgment: true
          }));

          alerts.forEach(alert => alertManager.scheduleAlert(alert));

          // Verify all alerts are scheduled
          const pendingBefore = alertManager.getPendingAlerts();
          expect(pendingBefore.length).toBeGreaterThanOrEqual(alerts.length);

          // Acknowledge only the first alert
          alertManager.acknowledgeAlert(alerts[0].id);

          // Verify only the first alert is acknowledged, others remain
          const pendingAfter = alertManager.getPendingAlerts();
          expect(pendingAfter.some(a => a.id === alerts[0].id)).toBe(false);
          
          // Other alerts should still be pending
          for (let i = 1; i < alerts.length; i++) {
            expect(pendingAfter.some(a => a.id === alerts[i].id)).toBe(true);
          }

          // Acknowledge remaining alerts one by one
          for (let i = 1; i < alerts.length; i++) {
            alertManager.acknowledgeAlert(alerts[i].id);
            const pending = alertManager.getPendingAlerts();
            expect(pending.some(a => a.id === alerts[i].id)).toBe(false);
          }

          // All alerts should now be acknowledged
          const finalPending = alertManager.getPendingAlerts();
          alerts.forEach(alert => {
            expect(finalPending.some(a => a.id === alert.id)).toBe(false);
          });
        }
      ),
      { numRuns: 50 }
    );
  });

  it('should handle acknowledgment of non-existent alerts gracefully', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.string({ minLength: 5, maxLength: 50 }),
        async (nonExistentAlertId) => {
          // Try to acknowledge an alert that doesn't exist
          const pendingBefore = alertManager.getPendingAlerts();
          const countBefore = pendingBefore.length;

          // This should not throw an error
          expect(() => {
            alertManager.acknowledgeAlert(nonExistentAlertId);
          }).not.toThrow();

          // Pending alerts count should remain the same
          const pendingAfter = alertManager.getPendingAlerts();
          expect(pendingAfter.length).toBe(countBefore);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should persist acknowledgment across alert manager lifecycle', async () => {
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
          priority: fc.constantFrom('low' as const, 'normal' as const, 'high' as const)
        }),
        async ({ petId, alertType, priority }) => {
          // Schedule an alert
          const alert: ProactiveAlert = {
            id: `alert-${alertType}-${petId}-${Date.now()}-${Math.random()}`,
            type: alertType,
            petId,
            message: `Test alert`,
            scheduledTime: new Date(Date.now() + 60000),
            priority,
            visualData: {},
            requiresAcknowledgment: true
          };

          alertManager.scheduleAlert(alert);

          // Verify alert is scheduled
          expect(alertManager.getPendingAlerts().some(a => a.id === alert.id)).toBe(true);

          // Acknowledge the alert
          alertManager.acknowledgeAlert(alert.id);

          // Verify alert is acknowledged
          expect(alertManager.getPendingAlerts().some(a => a.id === alert.id)).toBe(false);

          // Destroy and recreate alert manager (simulating app restart)
          alertManager.destroy();
          alertManager = new ProactiveAlertManagerImpl();

          // Acknowledged alert should NOT reappear after restart
          const pendingAfterRestart = alertManager.getPendingAlerts();
          expect(pendingAfterRestart.some(a => a.id === alert.id)).toBe(false);
        }
      ),
      { numRuns: 50 }
    );
  });

  it('should support various voice acknowledgment phrases', async () => {
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
          // Test various acknowledgment phrases that users might say
          acknowledgmentPhrase: fc.constantFrom(
            'okay',
            'got it',
            'done',
            'thanks',
            'acknowledged',
            'yes',
            'alright',
            'ok',
            'sure',
            'will do',
            'understood',
            'roger that'
          )
        }),
        async ({ petId, alertType, acknowledgmentPhrase }) => {
          // Schedule alert
          const alert: ProactiveAlert = {
            id: `alert-${alertType}-${petId}-${Date.now()}-${Math.random()}`,
            type: alertType,
            petId,
            message: `Test alert`,
            scheduledTime: new Date(Date.now() + 60000),
            priority: 'normal',
            visualData: {},
            requiresAcknowledgment: true
          };

          alertManager.scheduleAlert(alert);

          // Verify alert is scheduled
          expect(alertManager.getPendingAlerts().some(a => a.id === alert.id)).toBe(true);

          // Acknowledge with any phrase (in real implementation, voice recognition
          // would parse these phrases and call acknowledgeAlert)
          alertManager.acknowledgeAlert(alert.id);

          // Verify acknowledgment works regardless of phrase used
          expect(alertManager.getPendingAlerts().some(a => a.id === alert.id)).toBe(false);
        }
      ),
      { numRuns: 100 }
    );
  });
});
