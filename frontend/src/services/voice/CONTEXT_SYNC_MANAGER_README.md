# Context Sync Manager

**Feature:** jojo-voice-assistant-enhanced  
**Requirements:** 20.2, 20.5  
**Properties:** 63, 64

## Overview

The ContextSyncManager provides bidirectional synchronization between manual Dashboard interactions and voice command context. It ensures that voice and manual interactions stay in sync, enabling seamless transitions between interaction modes.

## Key Features

### 1. Manual Interaction → Context Updates (Requirement 20.2, Property 63)

When users interact manually with the Dashboard (clicking, typing, navigating), the ContextSyncManager updates the Context_Memory so voice commands are aware of the current state.

**Supported Manual Interactions:**
- Navigation (page changes, route transitions)
- Pet selection (clicking on a pet card)
- Data entry (logging feeding, medication, weight, etc.)
- View changes (switching between dashboard views)

### 2. Voice Command → Real-time View Updates (Requirement 20.5, Property 64)

When voice commands modify data, the ContextSyncManager ensures all Dashboard views displaying that data reflect the changes in real-time.

**Supported Data Changes:**
- Create operations (new appointments, medications, etc.)
- Update operations (modifying existing data)
- Delete operations (removing data)

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Manual Interactions                       │
│  (Navigation, Pet Selection, Data Entry, View Changes)      │
└─────────────────────┬───────────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────────────┐
│              ContextSyncManager                              │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  Event Listeners & Handlers                          │  │
│  │  - Navigation Listener                               │  │
│  │  - Pet Selection Handler                             │  │
│  │  - Data Entry Handler                                │  │
│  │  - View Change Handler                               │  │
│  └──────────────────────────────────────────────────────┘  │
│                          │                                   │
│                          ▼                                   │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  Context Manager Integration                         │  │
│  │  - Update current page                               │  │
│  │  - Set active pet                                    │  │
│  │  - Add entities                                      │  │
│  │  - Track intents                                     │  │
│  └──────────────────────────────────────────────────────┘  │
│                          │                                   │
│                          ▼                                   │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  Data Change Notification                            │  │
│  │  - Broadcast to all view listeners                   │  │
│  │  - Real-time updates                                 │  │
│  │  - Cross-view synchronization                        │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────┬───────────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────────────┐
│                  Dashboard Views                             │
│  (Health Records, Appointments, Medications, Feeding, etc.) │
└─────────────────────────────────────────────────────────────┘
```

## Usage

### Initialization

```typescript
import { ContextManager } from './contextManager';
import { ContextSyncManager } from './contextSyncManager';

// Create context manager
const contextManager = new ContextManager('/');

// Create sync manager
const syncManager = new ContextSyncManager(contextManager);

// Initialize sync manager
syncManager.initialize();
```

### Manual Interaction Tracking

#### Navigation

```typescript
// Track navigation to a page
syncManager.handleNavigation('/appointments');

// Track navigation with parameters
syncManager.handleNavigation('/pet/123', { petId: '123' });
```

#### Pet Selection

```typescript
// Track pet selection
syncManager.handlePetSelection('123', 'Buddy');

// This updates:
// - Active pet in context
// - Pet entity in recent entities
// - Intent history
```

#### Data Entry

```typescript
// Track manual data entry
const feedingData = {
  amount: 2,
  unit: 'cups',
  foodType: 'dry food',
  time: new Date(),
};

syncManager.handleDataEntry('feeding', '123', feedingData);
```

#### View Changes

```typescript
// Track view changes
syncManager.handleViewChange('health-dashboard', { petId: '123' });
```

### Voice Command Data Updates

#### Notify Data Changes

```typescript
// Notify all views of a data change from voice command
syncManager.notifyDataChange(
  'appointment',      // Entity type
  '456',              // Entity ID
  'create',           // Change type
  {                   // Changed data
    date: new Date(),
    clinic: 'Pet Clinic',
    reason: 'Checkup',
  }
);
```

#### Subscribe to Data Changes

```typescript
// Subscribe to data changes in a view component
const unsubscribe = syncManager.onDataChange((event) => {
  console.log('Data changed:', event);
  
  // Update view based on change
  if (event.entityType === 'appointment') {
    refreshAppointments();
  }
});

// Unsubscribe when component unmounts
unsubscribe();
```

### Event Listeners

#### Subscribe to Dashboard Events

```typescript
import { DashboardEventType } from './contextSyncManager';

// Listen for navigation events
const unsubscribe = syncManager.addEventListener(
  DashboardEventType.NAVIGATION,
  (event) => {
    console.log('Navigation:', event.data.page);
  }
);

// Unsubscribe
unsubscribe();
```

#### Available Event Types

- `DashboardEventType.NAVIGATION` - Page navigation
- `DashboardEventType.PET_SELECTION` - Pet selection
- `DashboardEventType.DATA_ENTRY` - Manual data entry
- `DashboardEventType.DATA_MODIFICATION` - Voice command data changes
- `DashboardEventType.VIEW_CHANGE` - View changes

### Cross-Tab Synchronization

```typescript
// Persist active pet for cross-tab sync
syncManager.persistActivePet('Buddy');

// Clear persisted active pet
syncManager.clearPersistedActivePet();

// Sync from current Dashboard state
syncManager.syncFromDashboard();
```

### Monitoring

```typescript
// Get sync status
const status = syncManager.getSyncStatus();
console.log('Initialized:', status.initialized);
console.log('Event listeners:', status.eventListenerCount);
console.log('Data change listeners:', status.dataChangeListenerCount);
console.log('Active pet:', status.activePet);
console.log('Current page:', status.currentPage);
```

## Integration with React Components

### Example: Pet Selection Component

```typescript
import { useEffect } from 'react';
import { syncManager } from './services/voice';

function PetCard({ pet }) {
  const handleClick = () => {
    // Track manual pet selection
    syncManager.handlePetSelection(pet.id, pet.name);
    
    // Navigate to pet profile
    navigate(`/pet/${pet.id}`);
  };

  return (
    <div onClick={handleClick}>
      <h3>{pet.name}</h3>
    </div>
  );
}
```

### Example: Appointments View

```typescript
import { useEffect, useState } from 'react';
import { syncManager } from './services/voice';

function AppointmentsView() {
  const [appointments, setAppointments] = useState([]);

  useEffect(() => {
    // Subscribe to data changes
    const unsubscribe = syncManager.onDataChange((event) => {
      if (event.entityType === 'appointment') {
        // Refresh appointments when voice command modifies data
        fetchAppointments();
      }
    });

    return () => unsubscribe();
  }, []);

  return (
    <div>
      {appointments.map(apt => (
        <AppointmentCard key={apt.id} appointment={apt} />
      ))}
    </div>
  );
}
```

### Example: Navigation Tracking

```typescript
import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { syncManager } from './services/voice';

function App() {
  const location = useLocation();

  useEffect(() => {
    // Track navigation for context updates
    syncManager.handleNavigation(location.pathname);
  }, [location]);

  return <Routes>...</Routes>;
}
```

## Testing

### Unit Tests

Run unit tests:
```bash
npm test contextSyncManager.test.ts
```

### Property-Based Tests

Run property-based tests:
```bash
npm test contextSync.property.test.ts
```

**Property 63:** Manual-context bidirectional sync  
*For any manual Dashboard interaction, the Context_Memory should update to reflect the state change for subsequent voice commands*

**Property 64:** Real-time cross-view updates  
*For any data modification via voice command, all Dashboard views displaying that data should reflect the changes in real-time*

## Error Handling

The ContextSyncManager handles errors gracefully:

- **Listener errors:** Errors in event listeners are caught and logged, preventing one listener from breaking others
- **Initialization errors:** Warns if attempting to initialize twice
- **Uninitialized access:** Methods check initialization state

## Performance Considerations

- **Event batching:** Multiple rapid events are handled efficiently
- **Listener management:** Listeners are stored in Sets for O(1) add/remove
- **Memory management:** Automatic cleanup on shutdown
- **Cross-tab sync:** Uses localStorage events for minimal overhead

## Best Practices

1. **Initialize once:** Call `initialize()` once at app startup
2. **Clean up listeners:** Always unsubscribe when components unmount
3. **Use specific event types:** Subscribe only to events you need
4. **Batch updates:** Group related data changes when possible
5. **Test synchronization:** Use property-based tests to verify sync behavior

## Troubleshooting

### Context not updating

**Problem:** Manual interactions don't update voice context

**Solution:** Ensure `syncManager.initialize()` is called and handlers are properly invoked

### Views not updating

**Problem:** Voice command changes don't reflect in views

**Solution:** Verify views are subscribed to data changes via `onDataChange()`

### Cross-tab sync not working

**Problem:** Active pet not syncing across tabs

**Solution:** Use `persistActivePet()` to enable localStorage-based sync

## API Reference

### Methods

#### `initialize(): void`
Initialize the sync manager and set up event listeners

#### `shutdown(): void`
Shutdown the sync manager and remove all listeners

#### `handleNavigation(page: string, params?: Record<string, any>): void`
Track manual navigation event

#### `handlePetSelection(petId: string, petName: string): void`
Track manual pet selection

#### `handleDataEntry(dataType: string, petId: string, data: any): void`
Track manual data entry

#### `handleViewChange(viewName: string, viewData?: any): void`
Track view change event

#### `notifyDataChange(entityType: string, entityId: string, changeType: 'create' | 'update' | 'delete', data: any): void`
Notify all views of a data change from voice command

#### `onDataChange(listener: DataChangeListener): () => void`
Subscribe to data changes, returns unsubscribe function

#### `addEventListener(eventType: DashboardEventType, listener: DashboardEventListener): () => void`
Subscribe to Dashboard events, returns unsubscribe function

#### `getSyncStatus(): SyncStatus`
Get current sync status information

#### `syncFromDashboard(): void`
Manually sync from current Dashboard state

#### `persistActivePet(petName: string): void`
Persist active pet to localStorage

#### `clearPersistedActivePet(): void`
Clear persisted active pet

## Related Components

- **ContextManager:** Manages conversation context and state
- **DashboardActions:** Executes Dashboard operations
- **CommandRouter:** Routes voice commands to handlers
- **IntentParser:** Parses voice commands into intents

## Future Enhancements

- [ ] Conflict resolution for concurrent updates
- [ ] Optimistic UI updates with rollback
- [ ] Offline sync queue
- [ ] Change history tracking
- [ ] Undo/redo support
