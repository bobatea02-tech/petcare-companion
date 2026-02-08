# Care Tracking UI Components - Visual Guide

## Component Overview

This guide provides a visual description of all care tracking components built for PawPal.

## 1. Medication Card

**Visual Description:**
```
┌─────────────────────────────────────────────┐
│  💊  Heartgard Plus        [Refill Needed]  │
│      1 tablet • Monthly                     │
│                                             │
│      Quantity Remaining            8 doses  │
│      ████████░░░░░░░░░░░░░░░░░░░░░         │
│                                             │
│      [  Log Dose  ]  [ Details ]           │
└─────────────────────────────────────────────┘
```

**Features:**
- Pill bottle icon (changes color when refill needed)
- Medication name and dosage
- Visual progress bar for quantity
- Refill alert badge (yellow background)
- Action buttons with hover effects

## 2. Medication Detail Modal

**Visual Description:**
```
┌─────────────────────────────────────────────┐
│  Medication Details                    [X]  │
├─────────────────────────────────────────────┤
│  ┌─────────────────────────────────────┐   │
│  │  💊  Heartgard Plus                 │   │
│  │      Active Medication              │   │
│  └─────────────────────────────────────┘   │
│                                             │
│  Dosage: 1 tablet    Frequency: Monthly    │
│  Start: Jan 01, 2024  End: Dec 31, 2024    │
│  Current: 8 doses    Threshold: 3 doses    │
│                                             │
│  Administration Instructions:               │
│  ┌─────────────────────────────────────┐   │
│  │ Give with food on the first of      │   │
│  │ each month                          │   │
│  └─────────────────────────────────────┘   │
│                                             │
│              [    Close    ]                │
└─────────────────────────────────────────────┘
```

## 3. Feeding Schedule Card

**Visual Description:**
```
┌─────────────────────────────────────────────┐
│  🍖  Dry Kibble                             │
│      1 cup • Twice daily                    │
│                                             │
│      ☐ 8:00 AM                             │
│      ☑ 6:00 PM                             │
│                                             │
│      Today's Progress              1 / 2    │
│      ████████████░░░░░░░░░░░░░░░░          │
└─────────────────────────────────────────────┘
```

**Features:**
- Food bowl icon
- Interactive checkboxes
- Progress bar updates in real-time
- Smooth animations on check/uncheck

## 4. Reminder Card

**Visual Description:**
```
┌─────────────────────────────────────────────┐
│ 🔔 💊 Apoquel Due              in 15 minutes│
│                                          🐾 │
│ Time to give Apoquel (16mg) - morning dose  │
│                                             │
│ [ Mark as Read ]  [ Dismiss ]              │
└─────────────────────────────────────────────┘
```

**Features:**
- Bell icon with pulse animation for unread
- Type-specific emoji and colors
- Relative time display
- Paw print accent
- Colored left border (medication=orange, feeding=green, etc.)

## 5. Daily Care Checklist

**Visual Description:**
```
┌─────────────────────────────────────────────┐
│  🐾 Daily Care Checklist    Feb 07, 2024   │
├─────────────────────────────────────────────┤
│  Today's Progress              2 / 4        │
│  ████████████░░░░░░░░░░░░░░░░░░░░          │
│                                             │
│  ☑ 💊 Give Apoquel - Morning               │
│     16mg with breakfast                     │
│     ⏰ 8:00 am  ✓ Completed at 8:05 am     │
│                                             │
│  ☑ 🍖 Morning Feeding                      │
│     1 cup dry kibble                        │
│     ⏰ 8:00 am  ✓ Completed at 8:05 am     │
│                                             │
│  ☐ 💊 Give Apoquel - Evening               │
│     16mg with dinner                        │
│     ⏰ 6:00 pm                              │
│                                             │
│  ☐ 🍖 Evening Feeding                      │
│     1 cup dry kibble                        │
│     ⏰ 6:00 pm                              │
└─────────────────────────────────────────────┘
```

**Features:**
- Overall progress bar
- Task type emojis
- Strikethrough for completed tasks
- Completion timestamps
- Celebration animation when all complete

## 6. Medication History

**Visual Description:**
```
┌─────────────────────────────────────────────┐
│  💊 Medication History                      │
├─────────────────────────────────────────────┤
│  🔍 Search medications or notes...          │
│                                             │
│  [ All ] [ Today ] [ This Week ] [ Month ]  │
│                                             │
│  Showing 12 entries                         │
│                                             │
│  ┌─────────────────────────────────────┐   │
│  │ • Apoquel    Feb 07, 2024 • 8:05 am │   │
│  │   Administered by: John Doe         │   │
│  │   ┌───────────────────────────────┐ │   │
│  │   │ Given with breakfast          │ │   │
│  │   └───────────────────────────────┘ │   │
│  └─────────────────────────────────────┘   │
│                                             │
│  ┌─────────────────────────────────────┐   │
│  │ • Apoquel    Feb 06, 2024 • 6:10 pm │   │
│  │   Administered by: Jane Doe         │   │
│  └─────────────────────────────────────┘   │
└─────────────────────────────────────────────┘
```

**Features:**
- Search bar with icon
- Filter buttons (active state highlighted)
- Scrollable history list
- Notes display in bordered box
- Empty state with icon

## 7. Quick Log Buttons

**Visual Description:**
```
┌─────────────────────────────────────────────┐
│  🐾 Quick Log                               │
│                                             │
│  ┌──────────────────┐  ┌──────────────────┐│
│  │  💊              │  │  🍖              ││
│  │  Medication      │  │  Feeding         ││
│  │  Log a dose      │  │  Log a meal      ││
│  └──────────────────┘  └──────────────────┘│
│                                             │
│  Other Activities                           │
│                                             │
│  ┌────────┐ ┌────────┐ ┌────────┐ ┌──────┐│
│  │🚶 Walk │ │🎾 Play │ │✂️ Groom│ │🛁 Bath││
│  └────────┘ └────────┘ └────────┘ └──────┘│
└─────────────────────────────────────────────┘
```

**Features:**
- Large touch-friendly buttons
- Icon + label + description
- Color-coded by activity type
- Success checkmark animation
- Hover scale effect

## Color Scheme

### Medication (Primary - Orange)
- Background: `#fff7ed` (light orange)
- Border: `#fed7aa` (orange-200)
- Text: `#c2410c` (orange-700)
- Icon: `#f97316` (orange-500)

### Feeding (Accent - Green)
- Background: `#f0fdf4` (light green)
- Border: `#bbf7d0` (green-200)
- Text: `#15803d` (green-700)
- Icon: `#22c55e` (green-500)

### Reminders (Secondary - Blue)
- Background: `#eff6ff` (light blue)
- Border: `#bfdbfe` (blue-200)
- Text: `#1d4ed8` (blue-700)
- Icon: `#3b82f6` (blue-500)

### Alerts (Warning - Yellow)
- Background: `#fef3c7` (light yellow)
- Border: `#fde68a` (yellow-200)
- Text: `#b45309` (yellow-700)
- Icon: `#eab308` (yellow-500)

## Animations

### 1. Checkmark Animation
- Scale from 0 to 1.2 to 1
- Rotate from -45deg to 0deg
- Duration: 300ms

### 2. Progress Bar Fill
- Width transition: 500ms ease-out
- Smooth fill animation

### 3. Card Entrance
- Fade in: opacity 0 to 1
- Slide up: y 20px to 0
- Duration: 300ms

### 4. Button Feedback
- Hover: scale 1.02
- Tap: scale 0.98
- Duration: 150ms

### 5. Pulse (Unread Notifications)
- Bell icon pulses
- Red dot indicator
- 3s infinite loop

## Responsive Behavior

### Desktop (≥1024px)
- 3-column grid layout
- Sidebar for quick actions
- Full-width modals (max 600px)

### Tablet (768px - 1023px)
- 2-column grid layout
- Stacked quick actions
- Medium-width modals

### Mobile (<768px)
- Single column layout
- Full-width cards
- Bottom sheet modals
- Touch-optimized buttons (min 44px)

## Accessibility Features

1. **Keyboard Navigation**
   - Tab through all interactive elements
   - Enter/Space to activate buttons
   - ESC to close modals

2. **Screen Reader Support**
   - ARIA labels on all icons
   - Semantic HTML structure
   - Status announcements

3. **Visual Indicators**
   - Focus rings on interactive elements
   - High contrast text
   - Color + icon for status (not color alone)

4. **Touch Targets**
   - Minimum 44x44px touch areas
   - Adequate spacing between buttons
   - Large tap zones

## Integration with Backend

Each component is designed to work with the PawPal backend API:

```typescript
// Example API calls
await apiClient.post('/care/medications/1/log')
await apiClient.get('/care/medications')
await apiClient.patch('/care/tasks/1', { completed: true })
await apiClient.get('/notifications')
```

## Performance Optimizations

1. **Lazy Loading**
   - Components load on demand
   - Images lazy load

2. **Memoization**
   - React.memo for expensive components
   - useMemo for computed values

3. **Virtual Scrolling**
   - For long medication history lists
   - Renders only visible items

4. **Debouncing**
   - Search input debounced (300ms)
   - Prevents excessive API calls

## Browser Support

- Chrome/Edge: Latest 2 versions
- Firefox: Latest 2 versions
- Safari: Latest 2 versions
- Mobile Safari: iOS 14+
- Chrome Mobile: Latest

## Summary

All components are:
- ✅ Fully responsive
- ✅ Accessible (WCAG 2.1 AA)
- ✅ Animated with Framer Motion
- ✅ Typed with TypeScript
- ✅ Tested with Jest
- ✅ Documented in Storybook
- ✅ Pet-themed and delightful
- ✅ Ready for backend integration
