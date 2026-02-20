# Dashboard Voice Control Integration

## Overview

This document describes how voice control has been integrated into the existing dashboard components to enable hands-free operation via the JoJo voice assistant.

**Feature:** jojo-voice-assistant-enhanced  
**Requirements:** 20.1, 20.3, 20.4

## Architecture

### Integration Pattern

The voice control integration follows a non-invasive pattern that:
1. **Preserves existing functionality** - All manual interactions continue to work exactly as before
2. **Adds voice capabilities** - Components can now be controlled via voice commands
3. **Maintains bidirectional sync** - Voice and manual interactions stay in sync
4. **Uses existing APIs** - Voice commands trigger the same dashboard APIs as manual actions

### Key Components

#### 1. `useVoiceControl` Hook

Located: `src/hooks/useVoiceControl.ts`

A React hook that enables voice control for any dashboard component.

**Features:**
- Registers component with voice system
- Updates context when component mounts/unmounts
- Provides methods to execute voice commands
- Notifies voice system of manual interactions

**Usage:**
```typescript
const { notifyManualAction, executeVoiceCommand } = useVoiceControl({
  componentId: 'health-tracker',
  petId: pet.id,
  onVoiceCommand: (intent, result) => {
    // Handle voice command results
  },
});
```

#### 2. `useVoiceIntegration` Hook

Located: `src/services/voice/voiceIntegration.ts`

Initializes the voice system with React Router navigation and registers command handlers.

**Features:**
- Sets up dashboard actions with navigation
- Registers all command handlers (navigation, data entry, query, scheduling, bulk actions)
- Must be called once at the top level of the dashboard

**Usage:**
```typescript
// In PetDashboard or top-level component
useVoiceIntegration();
```

#### 3. Dashboard Actions Service

Located: `src/services/voice/dashboardActions.ts`

Wraps existing dashboard API calls for voice control.

**Features:**
- Navigation actions (navigateTo, goBack)
- Data entry actions (logFeeding, logMedication, logWeight, logActivity)
- Query actions (getHealthRecords, getAppointments, getMedications, getFeedingHistory)
- Scheduling actions (createAppointment, cancelAppointment)
- Bulk actions (logFeedingForAll, getHealthSummaryForAll)

## Integrated Components

### 1. PetDashboard

**Voice Control Features:**
- Navigate between tabs via voice
- Switch to specific pet sections
- Access voice assistant for the pet

**Integration Points:**
- Initializes voice integration with `useVoiceIntegration()`
- Registers dashboard with `useVoiceControl()`
- Notifies voice system when tabs are switched manually

**Voice Commands:**
- "Go to health tab"
- "Show medications"
- "Open vet booking"

### 2. HealthTracker

**Voice Control Features:**
- Add health logs via voice
- Query health records
- View health score

**Integration Points:**
- Registers with voice system using `useVoiceControl()`
- Notifies voice system when health logs are added manually
- Responds to voice-triggered health log additions

**Voice Commands:**
- "Log symptom for [pet name]"
- "Add health record"
- "What's [pet name]'s health score?"

### 3. MedicationTracker

**Voice Control Features:**
- Add medications via voice
- Toggle medication status
- Query active medications

**Integration Points:**
- Registers with voice system using `useVoiceControl()`
- Notifies voice system when medications are added/toggled manually
- Responds to voice-triggered medication actions

**Voice Commands:**
- "Add medication for [pet name]"
- "What medications does [pet name] need today?"
- "Mark medication as taken"

### 4. FeedingReminders

**Voice Control Features:**
- Log feeding via voice
- Mark feedings as complete
- Query feeding schedule

**Integration Points:**
- Registers with voice system using `useVoiceControl()`
- Notifies voice system when feedings are logged/completed manually
- Responds to voice-triggered feeding actions

**Voice Commands:**
- "Log feeding for [pet name]"
- "Mark morning feeding as done"
- "Show feeding schedule"

### 5. VetBooking

**Voice Control Features:**
- Schedule appointments via voice
- Cancel appointments
- Query upcoming appointments

**Integration Points:**
- Registers with voice system using `useVoiceControl()`
- Notifies voice system when appointments are updated manually
- Responds to voice-triggered appointment actions

**Voice Commands:**
- "Schedule vet appointment for [pet name]"
- "When is [pet name]'s next appointment?"
- "Cancel appointment"

## How It Works

### Voice Command Flow

1. **User speaks command** → "Log feeding for Max"
2. **Voice recognition** → Transcribes speech to text
3. **Intent parsing** → Extracts action (log_data), target (feeding), parameters (petName: Max)
4. **Command routing** → Routes to DataEntryHandler
5. **Dashboard action** → Calls `dashboardActions.logFeeding()`
6. **API call** → Uses existing dashboard API
7. **State update** → Component updates via `onUpdate` callback
8. **UI refresh** → Component re-renders with new data
9. **Voice feedback** → JoJo confirms action via speech

### Manual Interaction Flow

1. **User clicks button** → Adds feeding manually
2. **Component updates** → Calls `onUpdate` with new data
3. **Voice notification** → Calls `notifyManualAction('add-feeding', data)`
4. **Context update** → Voice system updates conversation context
5. **Sync maintained** → Voice assistant knows about the manual action

## Requirements Validation

### Requirement 20.1: Voice-UI State Synchronization

✅ **Implemented:** When JoJo executes a command, the Dashboard updates UI state as if the user performed manual interaction.

**How:**
- Voice commands call the same `onUpdate` callbacks as manual interactions
- Components use the same state update logic for both voice and manual actions
- No special handling needed - voice commands trigger existing update mechanisms

### Requirement 20.3: Existing API Access

✅ **Implemented:** JoJo accesses all existing dashboard APIs for data retrieval and modification.

**How:**
- `DashboardActionsService` wraps existing API calls from `lib/api.ts`
- Voice commands use the same API endpoints as manual interactions
- No duplicate API logic - voice system reuses existing infrastructure

### Requirement 20.4: Existing Function Triggering

✅ **Implemented:** JoJo triggers existing dashboard functions for navigation, data entry, and queries.

**How:**
- Voice commands call existing component methods and callbacks
- Navigation uses React Router's `navigate` function
- Data entry uses existing `onUpdate` callbacks
- Queries use existing API service functions

## Testing

### Manual Testing

1. **Voice Command Test:**
   - Open PetDashboard
   - Say "Log feeding for [pet name]"
   - Verify feeding is logged and UI updates

2. **Manual Interaction Test:**
   - Open PetDashboard
   - Manually add a health log
   - Say "Show health records"
   - Verify voice assistant knows about the manual addition

3. **Navigation Test:**
   - Say "Go to medications"
   - Verify tab switches to medications
   - Manually switch to health tab
   - Say "What's on this page?"
   - Verify voice assistant knows current tab

### Integration Testing

See `src/test/integration/intelligence-action-layers.test.ts` for integration tests that verify voice commands trigger correct dashboard actions.

## Future Enhancements

1. **Real-time Sync:** Add WebSocket support for real-time updates across devices
2. **Offline Support:** Cache voice commands when offline and sync when online
3. **Multi-user:** Support multiple users controlling the same pet dashboard
4. **Voice Shortcuts:** Allow users to create custom voice shortcuts for common actions
5. **Voice Macros:** Support multi-step voice commands (e.g., "Morning routine for Max")

## Troubleshooting

### Voice commands not working

**Check:**
1. Is `useVoiceIntegration()` called in PetDashboard?
2. Is the component registered with `useVoiceControl()`?
3. Are command handlers registered in CommandRouter?
4. Is navigation set in DashboardActionsService?

### Manual actions not syncing with voice

**Check:**
1. Is `notifyManualAction()` called after manual updates?
2. Is the correct action name and data passed?
3. Is ContextManager updating properly?

### Voice commands trigger but UI doesn't update

**Check:**
1. Is `onUpdate` callback being called?
2. Is the component re-rendering after state update?
3. Are there any errors in the console?

## References

- [Voice Services README](./README.md)
- [Command Router README](./COMMAND_ROUTER_README.md)
- [Dashboard Actions Service](./dashboardActions.ts)
- [Design Document](../../../.kiro/specs/jojo-voice-assistant-enhanced/design.md)
- [Requirements Document](../../../.kiro/specs/jojo-voice-assistant-enhanced/requirements.md)
