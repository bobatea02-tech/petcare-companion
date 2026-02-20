# AudioFeedbackController

## Overview

The AudioFeedbackController provides visual and auditory feedback for voice interactions in the JoJo Voice Assistant. It manages animated state indicators, real-time waveform visualization, feedback sounds, and avatar animations.

## Features

- **Visual State Indicators**: Distinct animations for listening, processing, speaking, and idle states
- **Real-time Waveform Visualization**: Uses Web Audio API to visualize voice input and TTS output
- **Feedback Sounds**: Plays audio cues for wake word detection, command acceptance, errors, and processing
- **Avatar Animation**: Animated JoJo avatar with mouth movements synchronized to speech
- **Accessibility**: Visual indicators for hearing-impaired users

## Requirements Validated

- **1.2**: Audio feedback (chime) within 200ms of wake word detection
- **1.3**: Visual indicator when JoJo is listening
- **10.1**: Animated listening indicator (pulsing microphone icon)
- **10.2**: Processing indicator during command processing
- **10.3**: Animated avatar with mouth movements synchronized to speech
- **10.4**: Real-time voice waveform when user is speaking
- **10.5**: Waveform visualization of TTS output

## Usage

### Basic Usage

```typescript
import { createAudioFeedbackController, FeedbackSound } from '@/services/voice/audioFeedbackController';

// Create controller instance
const controller = createAudioFeedbackController();

// Show listening state
controller.showListening();

// Play wake word detection sound
await controller.playFeedbackSound(FeedbackSound.WAKE_WORD_DETECTED);

// Show processing state
controller.showProcessing();

// Show speaking state with audio stream
controller.showSpeaking(audioStream);

// Return to idle
controller.showIdle();

// Cleanup when done
controller.cleanup();
```

### React Component Usage

```typescript
import { AudioFeedbackDisplay } from '@/components/voice/AudioFeedbackDisplay';
import { createAudioFeedbackController } from '@/services/voice/audioFeedbackController';

function VoiceAssistant() {
  const controller = createAudioFeedbackController();

  return (
    <AudioFeedbackDisplay 
      controller={controller}
      showWaveform={true}
      showAvatar={true}
    />
  );
}
```

### Subscribe to State Changes

```typescript
// Subscribe to state changes
const unsubscribe = controller.onStateChange((state) => {
  console.log('State changed to:', state);
});

// Unsubscribe when done
unsubscribe();
```

### Subscribe to Waveform Updates

```typescript
// Subscribe to waveform data updates
const unsubscribe = controller.onWaveformUpdate((data) => {
  // data is a Float32Array containing waveform samples
  console.log('Waveform data:', data);
});

// Unsubscribe when done
unsubscribe();
```

## API Reference

### AudioFeedbackController Interface

#### Methods

##### `showListening(): void`
Shows the listening indicator with pulsing animation.

##### `showProcessing(): void`
Shows the processing/thinking indicator with spinner animation.

##### `showSpeaking(audioStream?: MediaStream): void`
Shows the speaking indicator with waveform visualization. Optionally accepts an audio stream for real-time waveform display.

##### `showIdle(): void`
Returns to idle state and stops all animations.

##### `updateWaveform(audioData: Float32Array): void`
Updates the waveform visualization with new audio data.

##### `playFeedbackSound(sound: FeedbackSound): Promise<void>`
Plays a feedback sound. Returns a promise that resolves when the sound finishes playing.

##### `animateAvatar(state: AvatarState): void`
Animates the JoJo avatar to match the specified state.

##### `getCurrentState(): AvatarState`
Returns the current avatar state.

##### `cleanup(): void`
Cleans up resources including audio context, event listeners, and audio elements.

##### `onStateChange(callback: (state: AvatarState) => void): () => void`
Subscribes to state change events. Returns an unsubscribe function.

##### `onWaveformUpdate(callback: (data: Float32Array) => void): () => void`
Subscribes to waveform update events. Returns an unsubscribe function.

### Enums

#### FeedbackSound

```typescript
enum FeedbackSound {
  WAKE_WORD_DETECTED = "chime",
  COMMAND_ACCEPTED = "success",
  ERROR = "error",
  PROCESSING = "thinking"
}
```

#### AvatarState

```typescript
enum AvatarState {
  IDLE = "idle",
  LISTENING = "listening",
  THINKING = "thinking",
  SPEAKING = "speaking"
}
```

## AudioFeedbackDisplay Component

### Props

```typescript
interface AudioFeedbackDisplayProps {
  controller?: AudioFeedbackController;  // Optional external controller
  className?: string;                     // Additional CSS classes
  showWaveform?: boolean;                 // Show waveform visualization (default: true)
  showAvatar?: boolean;                   // Show animated avatar (default: true)
}
```

### Features

- **Animated Avatar**: Circular avatar with state-specific colors and animations
- **Pulsing Ring**: Visual indicator for listening state
- **State Label**: Text label showing current state
- **Waveform Canvas**: Real-time waveform visualization using HTML5 Canvas
- **Simple Bars**: Alternative visualization for states without waveform
- **Responsive**: Adapts to different screen sizes
- **Dark Mode**: Supports dark mode styling

## Implementation Details

### Web Audio API Integration

The controller uses the Web Audio API for:
- Creating audio context for sound generation
- Analyzing audio streams with AnalyserNode
- Generating waveform data with getFloatTimeDomainData()
- Playing feedback sounds with fallback tone generation

### Animation

- Uses requestAnimationFrame for smooth waveform animation
- Framer Motion for React component animations
- CSS animations for pulsing and rotating effects

### Performance

- Efficient waveform rendering with canvas
- Cleanup of animation frames and audio resources
- Reusable audio elements for feedback sounds
- Optimized FFT size (2048) for waveform analysis

## Audio Files

The controller expects the following audio files in the `/sounds/` directory:

- `chime.mp3` - Wake word detection sound
- `success.mp3` - Command accepted sound
- `error.mp3` - Error sound
- `thinking.mp3` - Processing sound

If audio files are not available, the controller falls back to generating simple tones using the Web Audio API.

## Browser Compatibility

- Requires Web Audio API support (all modern browsers)
- Requires MediaStream API for audio stream visualization
- Tested on Chrome, Firefox, Safari, and Edge

## Accessibility

- Visual indicators provide feedback for hearing-impaired users
- State labels provide text description of current state
- Color-coded states for quick visual recognition
- Keyboard accessible when integrated with voice controls

## Testing

See the property tests in the tasks document:
- Property 29: UI state feedback completeness
- Property 30: Real-time waveform visualization

## Future Enhancements

- Custom avatar images/animations
- Configurable colors and themes
- Additional feedback sounds
- Lip-sync animation based on phonemes
- 3D avatar with Three.js
- Haptic feedback for mobile devices
