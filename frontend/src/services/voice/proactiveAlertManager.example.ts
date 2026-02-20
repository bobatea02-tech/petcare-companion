/**
 * Proactive Alert Manager - Usage Examples
 * Feature: jojo-voice-assistant-enhanced
 */

import { proactiveAlertManager } from './proactiveAlertManager';
import { AlertType, ProactiveAlert } from './types';

// ============================================================================
// Example 1: Schedule Medication Reminder
// ============================================================================

export function scheduleMedicationReminder(
  petId: string,
  petName: string,
  medicationName: string,
  dosage: string,
  scheduledTime: Date
): void {
  const alert: ProactiveAlert = {
    id: `med-${petId}-${Date.now()}`,
    type: AlertType.MEDICATION_REMINDER,
    petId,
    message: `Time to give ${petName} their ${medicationName}`,
    scheduledTime,
    priority: 'high',
    visualData: {
      medicationName,
      dosage,
      petName
    },
    requiresAcknowledgment: true
  };

  proactiveAlertManager.scheduleAlert(alert);
  console.log(`Scheduled medication reminder for ${petName} at ${scheduledTime}`);
}

// ============================================================================
// Example 2: Schedule Appointment Reminder (24 hours before)
// ============================================================================

export function scheduleAppointmentReminder(
  petId: string,
  petName: string,
  appointmentTime: Date,
  clinic: string,
  reason: string
): void {
  // Schedule reminder 24 hours before appointment
  const reminderTime = new Date(appointmentTime.getTime() - 24 * 60 * 60 * 1000);

  const alert: ProactiveAlert = {
    id: `appt-${petId}-${appointmentTime.getTime()}`,
    type: AlertType.APPOINTMENT_REMINDER,
    petId,
    message: `Reminder: ${petName} has a vet appointment tomorrow at ${appointmentTime.toLocaleTimeString()}`,
    scheduledTime: reminderTime,
    priority: 'normal',
    visualData: {
      appointmentTime,
      clinic,
      reason,
      petName
    },
    requiresAcknowledgment: true
  };

  proactiveAlertManager.scheduleAlert(alert);
  console.log(`Scheduled appointment reminder for ${petName}`);
}

// ============================================================================
// Example 3: Schedule Feeding Overdue Alert
// ============================================================================

export function scheduleFeedingOverdueAlert(
  petId: string,
  petName: string,
  scheduledFeedingTime: Date
): void {
  // Alert 30 minutes after scheduled feeding time
  const alertTime = new Date(scheduledFeedingTime.getTime() + 30 * 60 * 1000);

  const alert: ProactiveAlert = {
    id: `feeding-${petId}-${scheduledFeedingTime.getTime()}`,
    type: AlertType.FEEDING_OVERDUE,
    petId,
    message: `${petName}'s feeding is overdue by 30 minutes`,
    scheduledTime: alertTime,
    priority: 'normal',
    visualData: {
      scheduledTime: scheduledFeedingTime,
      petName
    },
    requiresAcknowledgment: true
  };

  proactiveAlertManager.scheduleAlert(alert);
  console.log(`Scheduled feeding overdue alert for ${petName}`);
}

// ============================================================================
// Example 4: Trigger Urgent Health Alert Immediately
// ============================================================================

export async function triggerHealthAlert(
  petId: string,
  petName: string,
  healthScore: number,
  previousScore: number
): Promise<void> {
  const alert: ProactiveAlert = {
    id: `health-${petId}-${Date.now()}`,
    type: AlertType.HEALTH_CHECK,
    petId,
    message: `Alert: ${petName}'s health score has dropped from ${previousScore} to ${healthScore}`,
    scheduledTime: new Date(),
    priority: 'high',
    visualData: {
      healthScore,
      previousScore,
      petName,
      dropPercentage: Math.round(((previousScore - healthScore) / previousScore) * 100)
    },
    requiresAcknowledgment: true
  };

  await proactiveAlertManager.triggerAlert(alert);
  console.log(`Triggered urgent health alert for ${petName}`);
}

// ============================================================================
// Example 5: Setup Alert Handler in Voice Assistant
// ============================================================================

export function setupAlertHandler(
  ttsEngine: any,
  audioFeedbackController: any,
  responseComposer: any,
  contextManager: any
): void {
  proactiveAlertManager.onAlert(async (alert) => {
    console.log(`[Voice Assistant] Received alert: ${alert.type}`);

    // Show visual indicator
    audioFeedbackController.showSpeaking(null);

    // Compose response with visual data
    const response = responseComposer.composeResponse(
      {
        success: true,
        data: alert.visualData,
        message: alert.message,
        visualComponent: getVisualComponentForAlertType(alert.type),
        requiresFollowUp: alert.requiresAcknowledgment,
        followUpPrompt: 'Say "okay" or "got it" to acknowledge'
      },
      contextManager.getContext()
    );

    // Speak the alert
    try {
      const audio = await ttsEngine.synthesize(response.text);
      // Play audio...
    } catch (error) {
      console.error('Error speaking alert:', error);
    }

    // Return to idle state
    setTimeout(() => {
      audioFeedbackController.showIdle();
    }, 2000);
  });
}

function getVisualComponentForAlertType(type: AlertType): string {
  switch (type) {
    case AlertType.MEDICATION_REMINDER:
      return 'MedicationAlert';
    case AlertType.APPOINTMENT_REMINDER:
      return 'AppointmentAlert';
    case AlertType.FEEDING_OVERDUE:
      return 'FeedingAlert';
    case AlertType.HEALTH_CHECK:
      return 'HealthAlert';
    default:
      return 'GenericAlert';
  }
}

// ============================================================================
// Example 6: Handle Voice Acknowledgment
// ============================================================================

export function handleVoiceAcknowledgment(transcription: string): boolean {
  const acknowledgmentPhrases = [
    'okay',
    'ok',
    'got it',
    'done',
    'acknowledged',
    'thanks',
    'thank you',
    'alright',
    'sure'
  ];

  const normalizedTranscription = transcription.toLowerCase().trim();
  
  if (acknowledgmentPhrases.some(phrase => normalizedTranscription.includes(phrase))) {
    // Get the most recent alert and acknowledge it
    const pending = proactiveAlertManager.getPendingAlerts();
    if (pending.length > 0) {
      // Acknowledge the most recent one (assuming it was just triggered)
      const recentAlert = pending[pending.length - 1];
      proactiveAlertManager.acknowledgeAlert(recentAlert.id);
      console.log(`Acknowledged alert: ${recentAlert.id}`);
      return true;
    }
  }

  return false;
}

// ============================================================================
// Example 7: Batch Schedule Daily Medication Reminders
// ============================================================================

export function scheduleDailyMedicationReminders(
  petId: string,
  petName: string,
  medications: Array<{
    name: string;
    dosage: string;
    times: string[]; // e.g., ['09:00', '21:00']
  }>
): void {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  medications.forEach(medication => {
    medication.times.forEach(timeStr => {
      const [hours, minutes] = timeStr.split(':').map(Number);
      const scheduledTime = new Date(today);
      scheduledTime.setHours(hours, minutes, 0, 0);

      // Only schedule if time is in the future
      if (scheduledTime > new Date()) {
        scheduleMedicationReminder(
          petId,
          petName,
          medication.name,
          medication.dosage,
          scheduledTime
        );
      }
    });
  });
}

// ============================================================================
// Example 8: Get Alert Summary
// ============================================================================

export function getAlertSummary(): {
  total: number;
  byType: Record<AlertType, number>;
  byPriority: Record<string, number>;
  nextAlert: ProactiveAlert | null;
} {
  const pending = proactiveAlertManager.getPendingAlerts();

  const byType: Record<AlertType, number> = {
    [AlertType.MEDICATION_REMINDER]: 0,
    [AlertType.APPOINTMENT_REMINDER]: 0,
    [AlertType.FEEDING_OVERDUE]: 0,
    [AlertType.HEALTH_CHECK]: 0
  };

  const byPriority: Record<string, number> = {
    low: 0,
    normal: 0,
    high: 0
  };

  pending.forEach(alert => {
    byType[alert.type]++;
    byPriority[alert.priority]++;
  });

  // Find next alert (earliest scheduled time)
  const nextAlert = pending.length > 0
    ? pending.reduce((earliest, current) =>
        current.scheduledTime < earliest.scheduledTime ? current : earliest
      )
    : null;

  return {
    total: pending.length,
    byType,
    byPriority,
    nextAlert
  };
}

// ============================================================================
// Example 9: Cancel All Alerts for a Pet
// ============================================================================

export function cancelAllAlertsForPet(petId: string): void {
  const pending = proactiveAlertManager.getPendingAlerts();
  const petAlerts = pending.filter(alert => alert.petId === petId);

  petAlerts.forEach(alert => {
    proactiveAlertManager.cancelAlert(alert.id);
  });

  console.log(`Cancelled ${petAlerts.length} alerts for pet ${petId}`);
}

// ============================================================================
// Example 10: Reschedule Alert
// ============================================================================

export function rescheduleAlert(alertId: string, newTime: Date): void {
  const pending = proactiveAlertManager.getPendingAlerts();
  const alert = pending.find(a => a.id === alertId);

  if (alert) {
    // Cancel existing alert
    proactiveAlertManager.cancelAlert(alertId);

    // Schedule new alert with updated time
    const updatedAlert: ProactiveAlert = {
      ...alert,
      scheduledTime: newTime
    };

    proactiveAlertManager.scheduleAlert(updatedAlert);
    console.log(`Rescheduled alert ${alertId} to ${newTime}`);
  }
}
