# Proactive Alert Manager

## Overview

The Proactive Alert Manager handles automated voice notifications for reminders and important events without user request. It manages scheduling, triggering, queuing, and acknowledgment of alerts for medication, appointments, feeding, and health checks.

## Features

- **Alert Scheduling**: Schedule alerts for future times
- **Automatic Triggering**: Checks every minute for due alerts
- **Priority-Based Processing**: High-priority alerts are processed first
- **User Activity Detection**: Queues alerts when user is inactive
- **Persistent Storage**: Alerts survive page refreshes via localStorage
- **Voice Acknowledgment**: Alerts can be acknowledged via voice commands

## Alert Types

```typescript
enum AlertType {
  MEDICATION_REMINDER = "medication",
  APPOINTMENT_REMINDER = "appointment",
  FEEDING_OVERDUE = "feeding",
  HEALTH_CHECK = "health"
}
```

## Usage

### Basic Setup

```typescript
import { proactiveAlertManager } from './services/voice/proactiveAlertManager';

// Register callback for when alerts trigger
proactiveAlertManager.onAlert(async (alert) => {
  // Speak the alert message
  await ttsEngine.synthesize(alert.message);
  
  // Display visual notification
  showNotification(alert);
});
```

### Scheduling Alerts

```typescript
// Schedule a medication reminder
proactiveAlertManager.scheduleAlert({
  id: 'med-123',
  type: AlertType.MEDICATION_REMINDER,
  petId: 'pet-456',
  message: "It's time to give Buddy his medication",
  scheduledTime: new Date('2024-03-15T09:00:00'),
  priority: 'high',
  visualData: {
    medicationName: 'Heartgard',
    dosage: '1 tablet'
  },
  requiresAcknowledgment: true
});

// Schedule an appointment reminder (24 hours before)
const appointmentTime = new Date('2024-03-16T14:00:00');
const reminderTime = new Date(appointmentTime.getTime() - 24 * 60 * 60 * 1000);

proactiveAlertManager.scheduleAlert({
  id: 'appt-789',
  type: AlertType.APPOINTMENT_REMINDER,
  petId: 'pet-456',
  message: "Reminder: Buddy has a vet appointment tomorrow at 2 PM",
  scheduledTime: reminderTime,
  priority: 'normal',
  visualData: {
    clinic: 'Mumbai Pet Clinic',
    reason: 'Annual checkup'
  },
  requiresAcknowledgment: true
});
```

### Triggering Alerts Immediately

```typescript
// Trigger an alert right away (bypasses scheduling)
await proactiveAlertManager.triggerAlert({
  id: 'urgent-001',
  type: AlertType.HEALTH_CHECK,
  petId: 'pet-456',
  message: "Emergency: Buddy's health score has dropped significantly",
  scheduledTime: new Date(),
  priority: 'high',
  visualData: {
    healthScore: 45,
    previousScore: 85
  },
  requiresAcknowledgment: true
});
```

### Acknowledging Alerts

```typescript
// When user says "okay", "got it", "done", etc.
proactiveAlertManager.acknowledgeAlert('med-123');
```

### Canceling Alerts

```typescript
// Cancel a scheduled alert
proactiveAlertManager.cancelAlert('appt-789');
```

### Getting Pending Alerts

```typescript
// Get all scheduled alerts
const pending = proactiveAlertManager.getPendingAlerts();
console.log(`${pending.length} alerts pending`);
```

## Integration with Voice Assistant

```typescript
// In your voice assistant component
useEffect(() => {
  // Register alert handler
  proactiveAlertManager.onAlert(async (alert) => {
    // Show visual indicator
    setCurrentAlert(alert);
    
    // Compose response
    const response = responseComposer.composeResponse(
      {
        success: true,
        data: alert.visualData,
        message: alert.message,
        visualComponent: 'AlertNotification',
        requiresFollowUp: alert.requiresAcknowledgment,
        followUpPrompt: 'Say "okay" to acknowledge'
      },
      contextManager.getContext()
    );
    
    // Speak the alert
    const audio = await ttsEngine.synthesize(response.text);
    playAudio(audio);
    
    // Show visual feedback
    audioFeedbackController.showSpeaking(audioStream);
  });
  
  return () => {
    proactiveAlertManager.destroy();
  };
}, []);
```

## User Activity Detection

The manager automatically detects user activity through:
- Mouse movements
- Keyboard input
- Scrolling
- Touch events

**Active User**: Alerts are triggered immediately
**Inactive User**: Alerts are queued and triggered when user returns

Inactivity threshold: 5 minutes of no interaction

## Alert Queue Behavior

When user is inactive:
1. Due alerts are added to queue
2. Alerts are removed from scheduled list
3. Queue is persisted to localStorage

When user becomes active:
1. Queued alerts are retrieved
2. Alerts are sorted by priority
3. Alerts are triggered one at a time with 2-second delays

## Persistence

Alerts are automatically saved to localStorage:
- Key: `jojo_proactive_alerts`
- Format: JSON array of alert objects
- Survives page refreshes and browser restarts

## Monitoring

The manager checks for due alerts every 60 seconds (1 minute).

To stop monitoring (cleanup):
```typescript
proactiveAlertManager.stopMonitoring();
```

## Example: Medication Reminder Flow

```typescript
// 1. Schedule medication reminder
proactiveAlertManager.scheduleAlert({
  id: `med-${Date.now()}`,
  type: AlertType.MEDICATION_REMINDER,
  petId: pet.id,
  message: `Time to give ${pet.name} their ${medication.name}`,
  scheduledTime: medication.nextDoseTime,
  priority: 'high',
  visualData: {
    medicationName: medication.name,
    dosage: medication.dosage,
    petName: pet.name
  },
  requiresAcknowledgment: true
});

// 2. When time arrives, alert triggers automatically
// 3. JoJo speaks: "Time to give Buddy their Heartgard"
// 4. Visual notification shows medication details
// 5. User says "okay" or "done"
// 6. Alert is acknowledged and removed
```

## Requirements Validation

- ✅ **Requirement 7.1**: Medication reminder triggering
- ✅ **Requirement 7.2**: Appointment alert (24 hours before)
- ✅ **Requirement 7.3**: Feeding overdue notification
- ✅ **Requirement 7.5**: Voice acknowledgment handling
- ✅ **Requirement 7.6**: Alert queuing for inactive users

## Testing

```typescript
import { ProactiveAlertManagerImpl } from './proactiveAlertManager';

describe('ProactiveAlertManager', () => {
  let manager: ProactiveAlertManagerImpl;
  
  beforeEach(() => {
    manager = new ProactiveAlertManagerImpl();
  });
  
  afterEach(() => {
    manager.destroy();
  });
  
  it('should schedule and retrieve alerts', () => {
    const alert = {
      id: 'test-1',
      type: AlertType.MEDICATION_REMINDER,
      petId: 'pet-1',
      message: 'Test alert',
      scheduledTime: new Date(Date.now() + 60000),
      priority: 'normal' as const,
      visualData: {},
      requiresAcknowledgment: true
    };
    
    manager.scheduleAlert(alert);
    const pending = manager.getPendingAlerts();
    
    expect(pending).toHaveLength(1);
    expect(pending[0].id).toBe('test-1');
  });
  
  it('should cancel alerts', () => {
    const alert = {
      id: 'test-2',
      type: AlertType.APPOINTMENT_REMINDER,
      petId: 'pet-1',
      message: 'Test alert',
      scheduledTime: new Date(Date.now() + 60000),
      priority: 'normal' as const,
      visualData: {},
      requiresAcknowledgment: true
    };
    
    manager.scheduleAlert(alert);
    manager.cancelAlert('test-2');
    
    expect(manager.getPendingAlerts()).toHaveLength(0);
  });
});
```

## Performance Considerations

- Checks run every 60 seconds (minimal CPU impact)
- Activity tracking uses passive event listeners
- localStorage writes are throttled
- Alert processing includes 2-second delays to avoid overwhelming user

## Future Enhancements

- Snooze functionality
- Recurring alerts
- Alert history tracking
- Custom alert sounds per type
- Geofencing for location-based alerts
