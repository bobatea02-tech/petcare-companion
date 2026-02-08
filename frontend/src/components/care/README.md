# Care Tracking and Medication Management Components

This directory contains all UI components for the PawPal care tracking and medication management features.

## Components

### MedicationCard
Displays medication information with dosage, frequency, and quantity tracking. Shows refill alerts when medication quantity is low.

**Props:**
- `medication`: Medication object
- `onLog`: Callback when logging a dose
- `onViewDetails`: Callback to view full medication details

**Features:**
- Visual pill bottle icon
- Progress bar for quantity tracking
- Refill alert badge
- Quick log button
- Animated interactions

### MedicationDetailModal
Modal dialog showing complete medication information including administration instructions.

**Props:**
- `medication`: Medication object or null
- `isOpen`: Boolean to control modal visibility
- `onClose`: Callback to close modal

**Features:**
- Full medication details
- Dosage and frequency information
- Administration instructions
- Start/end dates
- Quantity tracking

### FeedingScheduleCard
Displays feeding schedule with interactive checkboxes for each scheduled time.

**Props:**
- `schedule`: FeedingSchedule object
- `onLogFeeding`: Callback when logging a feeding
- `className`: Optional CSS classes

**Features:**
- Food bowl icon
- Interactive checkboxes for scheduled times
- Progress tracking for daily completion
- Animated completion states

### ReminderCard
Shows upcoming or active reminders with notification styling.

**Props:**
- `reminder`: Reminder object
- `onDismiss`: Callback to dismiss reminder
- `onMarkRead`: Callback to mark as read
- `className`: Optional CSS classes

**Features:**
- Type-specific icons and colors
- Unread indicator
- Time-based display (relative time)
- Paw print accent
- Dismiss and mark read actions

### DailyCareChecklist
Interactive checklist for daily care tasks with progress tracking.

**Props:**
- `tasks`: Array of CareTask objects
- `onToggleTask`: Callback when toggling task completion
- `className`: Optional CSS classes

**Features:**
- Task type icons (medication, feeding, grooming, etc.)
- Progress bar for overall completion
- Completion timestamps
- Celebration animation when all tasks complete
- Scheduled time display

### MedicationHistory
Searchable and filterable history of medication administration logs.

**Props:**
- `logs`: Array of MedicationLog objects
- `medicationNames`: Map of medication IDs to names
- `className`: Optional CSS classes

**Features:**
- Search by medication name or notes
- Filter by time period (today, week, month, all)
- Chronological display
- Administrator tracking
- Notes display

### QuickLogButtons
Quick action buttons for common care activities.

**Props:**
- `onLogMedication`: Callback for quick medication log
- `onLogFeeding`: Callback for quick feeding log
- `onLogActivity`: Callback for activity logging
- `className`: Optional CSS classes

**Features:**
- Large touch-friendly buttons
- Visual feedback on tap
- Activity type icons
- Success confirmation animation

## Usage Example

```tsx
import {
  MedicationCard,
  MedicationDetailModal,
  FeedingScheduleCard,
  ReminderCard,
  DailyCareChecklist,
  MedicationHistory,
  QuickLogButtons,
} from '@/components/care'

function CarePage() {
  const [selectedMedication, setSelectedMedication] = useState(null)

  return (
    <div>
      <MedicationCard
        medication={medication}
        onLog={handleLogMedication}
        onViewDetails={setSelectedMedication}
      />

      <MedicationDetailModal
        medication={selectedMedication}
        isOpen={!!selectedMedication}
        onClose={() => setSelectedMedication(null)}
      />

      <FeedingScheduleCard
        schedule={schedule}
        onLogFeeding={handleLogFeeding}
      />

      <ReminderCard
        reminder={reminder}
        onDismiss={handleDismiss}
        onMarkRead={handleMarkRead}
      />

      <DailyCareChecklist
        tasks={tasks}
        onToggleTask={handleToggleTask}
      />

      <MedicationHistory
        logs={logs}
        medicationNames={medicationNames}
      />

      <QuickLogButtons
        onLogMedication={handleQuickLog}
        onLogFeeding={handleQuickLog}
        onLogActivity={handleActivityLog}
      />
    </div>
  )
}
```

## Design System

All components follow the PawPal design system:

- **Colors**: Warm oranges (primary), playful blues (secondary), soft greens (accent)
- **Icons**: Pet-themed icons (paw prints, pill bottles, food bowls, bells)
- **Animations**: Smooth transitions using Framer Motion
- **Accessibility**: Keyboard navigation, ARIA labels, semantic HTML
- **Responsive**: Mobile-first design with touch-friendly interactions

## API Integration

Components are designed to work with the PawPal backend API:

- `POST /care/medications/{id}/log` - Log medication dose
- `POST /care/feeding/{id}/log` - Log feeding
- `PATCH /care/tasks/{id}` - Update task completion
- `GET /care/medications` - Fetch medications
- `GET /care/feeding` - Fetch feeding schedules
- `GET /notifications` - Fetch reminders

## Testing

Each component has corresponding Storybook stories for visual testing and documentation.

Run Storybook:
```bash
npm run storybook
```

## Requirements Validation

This implementation satisfies the following requirements:

- **5.1**: Medication tracking with dosage, frequency, and refill monitoring
- **5.2**: 15-minute advance reminders for medications and feeding
- **5.3**: Automated notification scheduling
- **5.4**: Medication refill alerts with threshold monitoring
- **5.5**: Feeding schedule management with recurring patterns
- **5.6**: Historical logging of medication and feeding activities

## Future Enhancements

- Medication photo upload
- Barcode scanning for medication entry
- Calendar view for feeding schedules
- Export care logs to PDF
- Integration with veterinary clinic systems
- Push notification support
- Offline mode with sync
