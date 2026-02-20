# Smart Reminders & Notifications

This module implements the Smart Reminders & Notifications feature for the pet care application.

## Components

### NotificationCenter
A slide-out panel that displays all notifications with read/dismiss functionality.

**Usage:**
```tsx
import { NotificationCenter } from '@/components/notifications';

function App() {
  return (
    <div>
      {/* Add to your navigation bar or header */}
      <NotificationCenter />
    </div>
  );
}
```

### NotificationPermissionPrompt
A card that prompts users to enable Web Push notifications.

**Usage:**
```tsx
import { NotificationPermissionPrompt } from '@/components/notifications';

function App() {
  return (
    <div>
      <NotificationPermissionPrompt
        onPermissionGranted={(subscription) => {
          console.log('Notifications enabled:', subscription);
        }}
        onPermissionDenied={() => {
          console.log('Notifications denied');
        }}
      />
    </div>
  );
}
```

## Service

### NotificationService
Manages all notification functionality including Web Push API integration, reminder scheduling, and predictive alerts.

**Usage:**
```tsx
import { notificationService } from '@/services/NotificationService';

// Schedule medication reminder
notificationService.scheduleMedicationReminder(
  {
    id: 'med-1',
    petId: 'pet-1',
    name: 'Heartgard',
    quantity: 5,
    dailyDosage: 1,
  },
  'Buddy'
);

// Schedule vaccination reminder
notificationService.scheduleVaccinationReminder(
  {
    id: 'vac-1',
    petId: 'pet-1',
    name: 'Rabies',
    dueDate: new Date('2024-02-15'),
  },
  'Buddy'
);

// Schedule grooming reminder
notificationService.scheduleGroomingReminder(
  {
    id: 'groom-1',
    petId: 'pet-1',
    type: 'Bath',
    scheduledTime: new Date('2024-01-20T10:00:00'),
  },
  'Buddy'
);

// Schedule birthday reminder
notificationService.scheduleBirthdayReminder({
  id: 'pet-1',
  name: 'Buddy',
  birthday: new Date('2020-01-15'),
});

// Analyze patterns for predictive alerts
const alerts = notificationService.analyzePatternsForAlerts(
  'pet-1',
  'Buddy',
  {
    healthScoreTrend: [
      { date: new Date('2024-01-10'), score: 85 },
      { date: new Date('2024-01-11'), score: 82 },
      { date: new Date('2024-01-12'), score: 78 },
      { date: new Date('2024-01-13'), score: 75 },
      { date: new Date('2024-01-14'), score: 72 },
      { date: new Date('2024-01-15'), score: 68 },
      { date: new Date('2024-01-16'), score: 65 },
    ],
    medicationLogs: [
      { date: new Date('2024-01-10'), taken: true },
      { date: new Date('2024-01-11'), taken: false },
      { date: new Date('2024-01-12'), taken: true },
      { date: new Date('2024-01-13'), taken: false },
      { date: new Date('2024-01-14'), taken: true },
      { date: new Date('2024-01-15'), taken: false },
      { date: new Date('2024-01-16'), taken: true },
    ],
  }
);

// Get all notifications
const notifications = await notificationService.getNotifications();

// Get notifications for specific pet
const petNotifications = await notificationService.getNotifications('pet-1');

// Mark notification as read
await notificationService.markAsRead('notification-id');

// Delete notification
await notificationService.deleteNotification('notification-id');
```

## Features

### Web Push API Integration
- Requests notification permission from users
- Subscribes to push notifications
- Sends Web Push notifications when permission is granted
- Falls back to in-app notifications when permission is denied

### Reminder Scheduling
- **Medication Reminders**: Alerts when medication supply falls below 7 days
- **Vaccination Reminders**: Alerts 14 days before vaccination due date
- **Grooming Reminders**: Alerts 24 hours before scheduled grooming
- **Birthday Reminders**: Celebrates pet birthdays on the day

### Predictive Alerts
Analyzes patterns to generate proactive health alerts:
- **Declining Health Score**: Detects 7+ day declining trend
- **Missed Medications**: Alerts after 2+ missed doses in a week
- **Reduced Activity**: Detects 50%+ reduction in exercise over 5 days
- **Weight Changes**: Alerts on 10%+ weight change in 30 days

### Notification Storage
- Stores all notifications in IndexedDB
- Persists across browser sessions
- Supports filtering by pet ID
- Tracks read/unread status

### Retry Logic
- Automatically retries failed push notifications
- Uses exponential backoff (1s, 2s, 4s)
- Maximum 3 retry attempts
- Falls back to in-app notifications on failure

## Design System

All components follow the Lovable UI design system:
- **Colors**: Forest (#2D5016), Sage (#8B9D83), Cream (#F5F1E8)
- **Fonts**: Anton for headings, Inter for body text
- **Components**: shadcn/ui components throughout

## Requirements Implemented

This implementation satisfies the following requirements from the spec:

- ✅ **Requirement 2.1**: Predictive health alerts with specific reasoning
- ✅ **Requirement 2.2**: Medication refill reminders (7-day supply threshold)
- ✅ **Requirement 2.3**: Vaccination alerts (14 days before due date)
- ✅ **Requirement 2.4**: Grooming reminders (24 hours before scheduled time)
- ✅ **Requirement 2.5**: Birthday celebration notifications
- ✅ **Requirement 2.6**: Web Push API integration
- ✅ **Requirement 2.7**: Permission storage and push notification enablement
- ✅ **Requirement 2.8**: Notifications include pet name and action required

## Browser Compatibility

- **Web Push API**: Supported in Chrome, Firefox, Edge, Safari 16+
- **IndexedDB**: Supported in all modern browsers
- **Service Workers**: Required for push notifications
- **Fallback**: In-app notifications for unsupported browsers

## Next Steps

To integrate these components into your application:

1. Add `<NotificationCenter />` to your navigation bar or header
2. Add `<NotificationPermissionPrompt />` to your main app component
3. Call notification service methods when relevant events occur (medication logged, appointments scheduled, etc.)
4. Set up a service worker for Web Push notifications (if not already configured)
5. Configure VAPID keys for Web Push in your environment variables

## Testing

Property-based tests for the NotificationService are defined in task 3.2 of the implementation plan. These tests validate:
- Predictive alert generation
- Medication refill reminder timing
- Vaccination alert timing
- Grooming reminder scheduling
- Birthday notification creation
- Notification content completeness
