# HandsFreeModeManager

## Overview

The `HandsFreeModeManager` service manages hands-free mode state, preferences, and lifecycle for the JoJo voice assistant. It provides mode toggle with persistent preference storage, inactivity timeout management, and wake word detector lifecycle control.

## Features

- **Mode Toggle**: Enable/disable hands-free mode with a single call
- **Persistent Preferences**: Automatically saves and restores user preference across sessions
- **Inactivity Timeout**: Prompts user after 30 minutes of inactivity
- **Activity Tracking**: Monitors user activity to reset inactivity timer
- **Wake Word Lifecycle**: Manages wake word detector start/stop automatically
- **Event Callbacks**: Notifies listeners of mode changes and inactivity timeouts

## Requirements

Implements the following requirements:
- **13.1**: Enable/disable wake word detector based on hands-free mode
- **13.2**: Stop monitoring when hands-free mode is disabled
- **13.3**: Display persistent indicator when active
- **13.4**: Ask user if they want to continue after 30 minutes of inactivity
- **13.5**: Provide toggle button for enabling/disabling
- **13.6**: Remember user preference across sessions

## Usage

### Basic Setup

```typescript
import { createHandsFreeModeManager } from '@/services/voice/handsFreeMode Manager';
import { createWakeWordDetector } from '@/services/voice/wakeWordDetector';

// Create instances
const wakeWordDetector = createWakeWordDetector();
const handsFreeManager = createHandsFreeModeManager();

// Initialize with wake word detector
await handsFreeManager.initialize(wakeWordDetector);
```

### Enable/Disable Hands-Free Mode

```typescript
// Enable hands-free mode
await handsFreeManager.enable();
// Wake word detector is now listening

// Disable hands-free mode
handsFreeManager.disable();
// Wake word detector is now stopped

// Toggle mode
await handsFreeManager.toggle();
```

### Check Mode State

```typescript
// Check if currently enabled
const isEnabled = handsFreeManager.isEnabled();

// Get saved preference
const preference = handsFreeManager.getPreference();
```

### Listen for Mode Changes

```typescript
// Register callback for mode changes
handsFreeManager.onModeChange((enabled) => {
  console.log(`Hands-free mode ${enabled ? 'enabled' : 'disabled'}`);
  updateUI(enabled);
});
```

### Handle Inactivity Timeout

```typescript
// Register callback for inactivity timeout
handsFreeManager.onInactivityTimeout(async () => {
  // Show dialog asking if user wants to continue
  const shouldContinue = await showInactivityDialog();
  
  // Return true to continue, false to disable
  return shouldContinue;
});
```

### Track User Activity

```typescript
// Track activity to reset inactivity timer
window.addEventListener('mousemove', () => {
  handsFreeManager.trackActivity();
});

window.addEventListener('keydown', () => {
  handsFreeManager.trackActivity();
});

// Get time since last activity
const timeSinceActivity = handsFreeManager.getTimeSinceLastActivity();
console.log(`Inactive for ${timeSinceActivity}ms`);
```

### Cleanup

```typescript
// Cleanup when component unmounts
handsFreeManager.cleanup();
```

## Integration with VoiceAssistant Component

The `VoiceAssistant` component integrates the `HandsFreeModeManager` to provide a complete hands-free experience:

```typescript
import { createHandsFreeModeManager } from '@/services/voice/handsFreeMode Manager';
import { HandsFreeModeToggle, HandsFreeModeIndicator, InactivityDialog } from '@/components/voice';

function VoiceAssistant() {
  const [handsFreeMode, setHandsFreeMode] = useState(false);
  const [showInactivityDialog, setShowInactivityDialog] = useState(false);
  const handsFreeManagerRef = useRef<HandsFreeModeManager | null>(null);

  useEffect(() => {
    // Initialize manager
    const manager = createHandsFreeModeManager();
    handsFreeManagerRef.current = manager;

    // Initialize with wake word detector
    await manager.initialize(wakeWordDetector);

    // Listen for mode changes
    manager.onModeChange((enabled) => {
      setHandsFreeMode(enabled);
    });

    // Handle inactivity timeout
    manager.onInactivityTimeout(async () => {
      setShowInactivityDialog(true);
      return new Promise((resolve) => {
        // Dialog will resolve this promise
        window.__inactivityPromiseResolve = resolve;
      });
    });

    // Track user activity
    const trackActivity = () => manager.trackActivity();
    window.addEventListener('mousemove', trackActivity);
    window.addEventListener('keydown', trackActivity);

    return () => {
      manager.cleanup();
      window.removeEventListener('mousemove', trackActivity);
      window.removeEventListener('keydown', trackActivity);
    };
  }, []);

  return (
    <>
      {/* Toggle button */}
      <HandsFreeModeToggle
        isEnabled={handsFreeMode}
        onToggle={() => handsFreeManagerRef.current?.toggle()}
      />

      {/* Mode indicator */}
      <HandsFreeModeIndicator isEnabled={handsFreeMode} />

      {/* Inactivity dialog */}
      <InactivityDialog
        isOpen={showInactivityDialog}
        onContinue={() => {
          setShowInactivityDialog(false);
          handsFreeManagerRef.current?.trackActivity();
          window.__inactivityPromiseResolve?.(true);
        }}
        onDisable={() => {
          setShowInactivityDialog(false);
          handsFreeManagerRef.current?.disable();
          window.__inactivityPromiseResolve?.(false);
        }}
      />
    </>
  );
}
```

## UI Components

### HandsFreeModeToggle

Toggle switch for enabling/disabling hands-free mode:

```typescript
<HandsFreeModeToggle
  isEnabled={handsFreeMode}
  onToggle={toggleHandsFreeMode}
  showLabel={true}
  showDescription={true}
/>
```

### HandsFreeModeIndicator

Visual indicator showing hands-free mode state:

```typescript
<HandsFreeModeIndicator
  isEnabled={handsFreeMode}
  position="floating"  // or "inline"
  showLabel={true}
/>
```

### InactivityDialog

Dialog shown after 30 minutes of inactivity:

```typescript
<InactivityDialog
  isOpen={showInactivityDialog}
  onContinue={handleContinue}
  onDisable={handleDisable}
  autoDisableTimeout={60}  // seconds
/>
```

## Persistent Storage

The manager uses `localStorage` to persist preferences:

- **Key**: `jojo-hands-free-mode`
- **Value**: `"true"` or `"false"`
- **Key**: `jojo-last-activity`
- **Value**: Timestamp of last activity

Preferences are automatically loaded on initialization and saved on every change.

## Inactivity Timeout

The inactivity timeout works as follows:

1. Timer starts when hands-free mode is enabled
2. Timer resets on any user activity (tracked via `trackActivity()`)
3. After 30 minutes of inactivity, callbacks are notified
4. If callback returns `true`, timer resets and mode continues
5. If callback returns `false`, hands-free mode is disabled
6. If no callback is registered, mode is disabled automatically

## Error Handling

The manager handles errors gracefully:

- **Initialization errors**: Thrown if wake word detector fails to initialize
- **Enable errors**: Thrown if wake word detector fails to start
- **Storage errors**: Logged but don't prevent operation
- **Callback errors**: Logged but don't affect other callbacks

## Testing

Property-based tests validate the manager's behavior:

- **Property 42**: Hands-free mode toggle (Requirements 13.1, 13.2, 13.3)
- **Property 43**: Inactivity timeout (Requirement 13.4)
- **Property 44**: Preference persistence (Requirement 13.6)

## Architecture

```
┌─────────────────────────────────────────┐
│      HandsFreeModeManager               │
│                                         │
│  ┌───────────────────────────────────┐ │
│  │  State Management                 │ │
│  │  - isEnabled                      │ │
│  │  - lastActivityTime               │ │
│  │  - inactivityTimer                │ │
│  └───────────────────────────────────┘ │
│                                         │
│  ┌───────────────────────────────────┐ │
│  │  Persistent Storage               │ │
│  │  - loadPreference()               │ │
│  │  - savePreference()               │ │
│  │  - loadLastActivity()             │ │
│  │  - saveLastActivity()             │ │
│  └───────────────────────────────────┘ │
│                                         │
│  ┌───────────────────────────────────┐ │
│  │  Wake Word Lifecycle              │ │
│  │  - initialize()                   │ │
│  │  - startListening()               │ │
│  │  - stopListening()                │ │
│  └───────────────────────────────────┘ │
│                                         │
│  ┌───────────────────────────────────┐ │
│  │  Inactivity Management            │ │
│  │  - startInactivityTimer()         │ │
│  │  - stopInactivityTimer()          │ │
│  │  - trackActivity()                │ │
│  └───────────────────────────────────┘ │
│                                         │
│  ┌───────────────────────────────────┐ │
│  │  Event Callbacks                  │ │
│  │  - onModeChange()                 │ │
│  │  - onInactivityTimeout()          │ │
│  └───────────────────────────────────┘ │
└─────────────────────────────────────────┘
```

## Best Practices

1. **Always initialize**: Call `initialize()` with wake word detector before using
2. **Track activity**: Set up activity tracking on common user events
3. **Handle inactivity**: Register inactivity callback to show user dialog
4. **Cleanup**: Always call `cleanup()` when component unmounts
5. **Error handling**: Wrap `enable()` and `toggle()` in try-catch blocks
6. **User feedback**: Show toast notifications on mode changes

## Related Components

- `WakeWordDetector`: Managed by this service
- `VoiceAssistant`: Main integration point
- `HandsFreeModeToggle`: UI toggle component
- `HandsFreeModeIndicator`: UI indicator component
- `InactivityDialog`: UI dialog component
