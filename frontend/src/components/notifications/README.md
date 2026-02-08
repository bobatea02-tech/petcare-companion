# PawPal Notifications & Alerts System

## Overview

A comprehensive notification and alert system for the PawPal pet care application, featuring pet-themed UI components, real-time notifications, customizable preferences, and urgent alert modals.

## Components

### 1. NotificationCenter
Central hub for viewing and managing all notifications.

**Features:**
- Categorized notifications (medication, feeding, appointments, health, alerts, info)
- Filter by all/unread/urgent
- Search functionality
- Mark as read/delete individual or all notifications
- Pet-specific notifications with pet names
- Timestamp formatting (relative time)
- Unread count badges

**Usage:**
```tsx
import { NotificationCenter } from '@/components/notifications';

<NotificationCenter
  notifications={notifications}
  onMarkAsRead={handleMarkAsRead}
  onMarkAllAsRead={handleMarkAllAsRead}
  onDelete={handleDelete}
  onClearAll={handleClearAll}
  onNotificationClick={handleClick}
/>
```

### 2. Toast Notifications
Temporary notification popups with pet-themed animations.

**Features:**
- 4 types: success, error, warning, info
- Auto-dismiss with configurable duration
- Progress bar indicator
- Optional action buttons
- Animated paw print decorations
- Slide-in/out animations
- Stackable toasts

**Usage:**
```tsx
import { ToastContainer, useNotifications } from '@/components/notifications';

const { toasts, showSuccess, showError } = useNotifications();

// Show toast
showSuccess('Medication logged!', 'Max received his medication');

// Render container
<ToastContainer toasts={toasts} position="top-right" />
```

### 3. NotificationPreferences
Comprehensive settings interface for notification preferences.

**Features:**
- Channel selection (push, email, SMS)
- Category-based preferences
- Custom timing settings
- Sound customization (5 pet-themed sounds)
- Toggle switches for easy control
- Visual feedback for unsaved changes

**Usage:**
```tsx
import { NotificationPreferences } from '@/components/notifications';

<NotificationPreferences
  preferences={preferences}
  onUpdate={setPreferences}
  onSave={handleSave}
/>
```

### 4. UrgentAlertModal
Full-screen modal for critical alerts requiring immediate attention.

**Features:**
- 3 severity levels (critical, high, medium)
- Animated icons with pulse effects
- Primary and secondary action buttons
- Detailed information display
- Pet-themed decorations
- Prominent call-to-action

**Usage:**
```tsx
import { UrgentAlertModal } from '@/components/notifications';

<UrgentAlertModal
  alert={urgentAlert}
  isOpen={isOpen}
  onClose={handleClose}
/>
```

### 5. NotificationBadge
Badge components for displaying notification counts.

**Features:**
- Multiple variants (primary, danger, warning)
- Size options (sm, md, lg)
- Max count display (e.g., "99+")
- Pulse animation option
- Icon wrapper component
- Inline badge for lists
- Dot indicator for minimal UI

**Usage:**
```tsx
import { NotificationBadge, IconWithBadge } from '@/components/notifications';

<IconWithBadge
  icon={<BellIcon />}
  count={unreadCount}
  pulse={urgentCount > 0}
  variant="danger"
/>
```

### 6. NotificationHistory
Historical view of all notifications with advanced filtering.

**Features:**
- Date range filtering (today, yesterday, week, month, older)
- Type filtering (all notification types)
- Grouped by date ranges
- Delete individual notifications
- Clear entire history
- Results count display

**Usage:**
```tsx
import { NotificationHistory } from '@/components/notifications';

<NotificationHistory
  notifications={notifications}
  onDelete={handleDelete}
  onClearHistory={handleClearHistory}
/>
```

### 7. EmailTemplates
Weekly health report email templates.

**Features:**
- Pet-themed design
- Summary statistics with color-coded cards
- Highlights and concerns sections
- AI insights display
- Upcoming appointments list
- Medication reminders
- Responsive layout

**Usage:**
```tsx
import { WeeklyHealthReportPreview } from '@/components/notifications';

<WeeklyHealthReportPreview
  petName="Max"
  weekStart={startDate}
  weekEnd={endDate}
  summary={summaryData}
  highlights={highlights}
  concerns={concerns}
  upcomingAppointments={appointments}
  medicationsDue={medications}
  aiInsights={insights}
/>
```

## Custom Hooks

### useNotifications
Main hook for managing notifications and toasts.

**Features:**
- Add/remove notifications
- Mark as read functionality
- Toast management
- Convenience methods (showSuccess, showError, etc.)
- Unread and urgent counts

**Usage:**
```tsx
import { useNotifications } from '@/components/notifications';

const {
  notifications,
  toasts,
  unreadCount,
  urgentCount,
  addNotification,
  markAsRead,
  showSuccess,
  showError,
} = useNotifications();
```

### useNotificationPermission
Hook for managing browser notification permissions.

**Features:**
- Check permission status
- Request permission
- Show browser notifications
- Support detection

**Usage:**
```tsx
import { useNotificationPermission } from '@/components/notifications';

const {
  permission,
  isSupported,
  isGranted,
  requestPermission,
  showBrowserNotification,
} = useNotificationPermission();
```

### useNotificationSound
Hook for managing notification sounds.

**Features:**
- Enable/disable sounds
- Sound selection
- Play sound on notification

**Usage:**
```tsx
import { useNotificationSound } from '@/components/notifications';

const {
  soundEnabled,
  setSoundEnabled,
  selectedSound,
  setSelectedSound,
  playSound,
} = useNotificationSound();
```

## Notification Types

```typescript
type NotificationType = 'medication' | 'feeding' | 'appointment' | 'health' | 'alert' | 'info';

interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  timestamp: Date;
  read: boolean;
  urgent: boolean;
  petId?: string;
  petName?: string;
  actionUrl?: string;
}
```

## Styling & Animations

### Custom Animations
- **paw-bounce**: Bouncing paw print animation
- **slide-in**: Toast slide-in animation
- **pulse-scale**: Pulsing scale for urgent alerts
- **float**: Floating decoration animation

### Color Coding
- **Medication**: Purple (`#a855f7`)
- **Feeding**: Orange (`#f97316`)
- **Appointment**: Blue (`#3b82f6`)
- **Health**: Green (`#22c55e`)
- **Alert**: Yellow/Red (`#eab308` / `#ef4444`)
- **Info**: Gray (`#6b7280`)

## Accessibility

All components follow WCAG 2.1 AA standards:
- Keyboard navigation support
- ARIA labels and roles
- Screen reader friendly
- Sufficient color contrast
- Focus indicators
- Semantic HTML

## Integration Example

```tsx
'use client';

import { useState } from 'react';
import {
  NotificationCenter,
  ToastContainer,
  UrgentAlertModal,
  useNotifications,
  useNotificationPermission,
} from '@/components/notifications';

export default function MyPage() {
  const {
    notifications,
    toasts,
    unreadCount,
    addNotification,
    markAsRead,
    showSuccess,
  } = useNotifications();

  const { requestPermission } = useNotificationPermission();

  const [urgentAlert, setUrgentAlert] = useState(null);

  return (
    <div>
      <NotificationCenter
        notifications={notifications}
        onMarkAsRead={markAsRead}
        onMarkAllAsRead={() => {}}
        onDelete={() => {}}
        onClearAll={() => {}}
        onNotificationClick={() => {}}
      />

      <ToastContainer toasts={toasts} />

      <UrgentAlertModal
        alert={urgentAlert}
        isOpen={urgentAlert !== null}
        onClose={() => setUrgentAlert(null)}
      />
    </div>
  );
}
```

## Sound Files

Place notification sound files in `/public/sounds/notifications/`:
- `default.mp3` - Default bell sound
- `bark.mp3` - Friendly dog bark
- `meow.mp3` - Gentle cat meow
- `chirp.mp3` - Bird chirp
- `none.mp3` - Silent (empty file)

## Testing

Storybook stories are available for all components:
- `NotificationCenter.stories.tsx`
- `Toast.stories.tsx`

Run Storybook:
```bash
npm run storybook
```

## Requirements Fulfilled

Task 19.14 - Notifications and Alerts UI:
- ✅ Notification center with categorized pet alerts
- ✅ Toast notifications with pet-themed icons and animations
- ✅ SMS/Email preference settings interface with toggles
- ✅ Notification history with filtering and search
- ✅ Urgent alert modals with prominent CTAs
- ✅ Weekly health report email templates
- ✅ Push notification permission requests
- ✅ Notification sound customization
- ✅ Notification badge system for unread alerts

## Next Steps

For task 19.15, implement unit tests:
- Test notification rendering and dismissal
- Test preference settings persistence
- Test notification filtering logic
- Test toast auto-dismiss behavior
- Test urgent alert modal interactions
