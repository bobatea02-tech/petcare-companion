# Voice Module Documentation 🎤

## Overview

The Voice Module provides complete voice interaction capabilities for the PetPal Voice Assistant, including Speech-to-Text (STT) and Text-to-Speech (TTS) functionality.

## Features

### ✅ Speech-to-Text (STT)
- **Manual activation** - User clicks microphone button to start/stop
- **Live transcription** - Shows what user is saying in real-time
- **1-minute timeout** - Automatically stops if no speech detected
- **Error handling** - Clear alerts for permission issues, browser support, etc.

### ✅ Text-to-Speech (TTS)
- **Automatic responses** - Chatbot speaks responses by default
- **Mute/Unmute toggle** - User can disable voice responses
- **Soft, pleasant voice** - Optimized settings (0.9 speed, 1.1 pitch, 0.85 volume)
- **Intelligent voice selection** - Automatically selects best available voice
- **High-quality voices** - Prefers Google, Microsoft, Apple premium voices
- **English language** - en-US voice

### ✅ Visual Feedback
- **Listening state** - Pulsing red circle animation
- **Processing state** - Circular loading spinner
- **Speaking state** - Animated waveform bars
- **Live transcript** - Shows user's speech as they talk

### ✅ Error Handling
- Microphone permission denied → Alert message
- Browser not supported → Alert message
- No speech detected → Timeout alert
- Network errors → Alert message

## File Structure

```
frontend/
├── src/
│   ├── hooks/
│   │   └── useVoiceAssistant.ts       # Main voice logic hook
│   ├── components/
│   │   └── voice/
│   │       ├── VoiceVisualizer.tsx    # Visual animations
│   │       ├── VoiceControls.tsx      # Mic & mute buttons
│   │       ├── VoiceAlert.tsx         # Error alerts
│   │       └── index.ts               # Exports
│   └── pages/
│       └── VoiceAssistant.tsx         # Main voice chat page
```

## Usage

### Basic Implementation

```typescript
import { useVoiceAssistant } from '@/hooks/useVoiceAssistant';

const MyComponent = () => {
  const voice = useVoiceAssistant({
    onTranscript: (text) => {
      console.log('User said:', text);
      // Send to chatbot
    },
    onError: (error) => {
      console.error('Voice error:', error);
    },
    timeout: 60000, // 1 minute
  });

  return (
    <div>
      <button onClick={voice.toggleListening}>
        {voice.isListening ? 'Stop' : 'Start'} Listening
      </button>
      <button onClick={voice.toggleMute}>
        {voice.isMuted ? 'Unmute' : 'Mute'}
      </button>
      {voice.error && <div>{voice.error}</div>}
    </div>
  );
};
```

## Hook API

### `useVoiceAssistant(options)`

**Options:**
```typescript
interface VoiceAssistantOptions {
  onTranscript?: (text: string) => void;  // Called when speech is recognized
  onError?: (error: string) => void;       // Called on errors
  onListeningChange?: (isListening: boolean) => void;
  onSpeakingChange?: (isSpeaking: boolean) => void;
  language?: string;                       // Default: 'en-US'
  timeout?: number;                        // Default: 60000 (1 minute)
}
```

**Returns:**
```typescript
interface VoiceAssistantReturn {
  isListening: boolean;        // Currently listening to user
  isSpeaking: boolean;         // Currently speaking response
  isMuted: boolean;            // Voice responses muted
  transcript: string;          // Live transcript text
  error: string | null;        // Current error message
  isSupported: boolean;        // Browser supports voice
  startListening: () => void;  // Start listening
  stopListening: () => void;   // Stop listening
  toggleListening: () => void; // Toggle listening
  speak: (text: string) => void; // Speak text
  stopSpeaking: () => void;    // Stop speaking
  toggleMute: () => void;      // Toggle mute
  clearError: () => void;      // Clear error message
}
```

## Components

### VoiceVisualizer

Shows different animations based on voice state.

```typescript
<VoiceVisualizer state="listening" | "processing" | "speaking" | "idle" />
```

**States:**
- `listening` - Pulsing red circle
- `processing` - Loading spinner
- `speaking` - Animated waveform
- `idle` - Nothing shown

### VoiceControls

Microphone button and mute toggle.

```typescript
<VoiceControls
  isListening={boolean}
  isMuted={boolean}
  onToggleListening={() => {}}
  onToggleMute={() => {}}
  disabled={boolean}
/>
```

### VoiceAlert

Error message alert.

```typescript
<VoiceAlert
  message={string | null}
  onClose={() => {}}
/>
```

## Browser Support

### Fully Supported
- ✅ Chrome (Desktop & Mobile)
- ✅ Edge (Desktop & Mobile)
- ✅ Safari (Desktop & Mobile)

### Limited Support
- ⚠️ Firefox (Basic support, may have issues)

### Not Supported
- ❌ Internet Explorer
- ❌ Older browsers

## User Flow

1. **User clicks microphone button**
   - Requests microphone permission (first time)
   - Starts listening
   - Shows pulsing red circle

2. **User speaks**
   - Live transcript appears in chat
   - Text updates as user speaks

3. **User stops speaking or clicks button again**
   - Stops listening
   - Shows processing spinner
   - Sends message to chatbot

4. **Chatbot responds**
   - Text response appears in chat
   - If not muted, speaks response
   - Shows waveform animation while speaking

5. **User can:**
   - Click mic again to ask another question
   - Type instead of speaking
   - Mute/unmute voice responses
   - Continue conversation

## Error Messages

| Error | Message | Solution |
|-------|---------|----------|
| No browser support | "Voice features are not supported..." | Use Chrome/Edge/Safari |
| Permission denied | "Microphone permission denied..." | Allow microphone access |
| No speech detected | "No speech detected. Please try again." | Speak louder or check mic |
| Timeout | "Listening timeout - no speech detected for 1 minute." | Click mic button again |
| Network error | "Network error occurred..." | Check internet connection |
| Microphone not found | "Microphone not found..." | Connect microphone |

## Configuration

### Change Timeout

```typescript
const voice = useVoiceAssistant({
  timeout: 30000, // 30 seconds
});
```

### Change Language

```typescript
const voice = useVoiceAssistant({
  language: 'en-GB', // British English
});
```

### Change Speech Rate

Edit `useVoiceAssistant.ts`:
```typescript
utterance.rate = 1.2; // Faster (0.8 = slower, 1.0 = normal, 1.2 = faster)
```

## Testing

### Test Voice Input
1. Open Voice Assistant page
2. Click microphone button
3. Allow microphone permission
4. Speak: "My pet is not eating well"
5. Verify transcript appears
6. Verify message is sent

### Test Voice Output
1. Send a message (voice or text)
2. Wait for chatbot response
3. Verify voice speaks response
4. Verify waveform animation shows

### Test Mute
1. Click mute button (speaker icon)
2. Send a message
3. Verify chatbot doesn't speak
4. Verify text response still appears

### Test Errors
1. Deny microphone permission → See alert
2. Wait 1 minute without speaking → See timeout alert
3. Use unsupported browser → See support alert

## Troubleshooting

### Voice not working?
- Check browser support (use Chrome/Edge/Safari)
- Allow microphone permission
- Check microphone is connected and working
- Try refreshing the page

### Transcript not showing?
- Speak clearly and loudly
- Check microphone volume
- Ensure no background noise
- Try different microphone

### Voice response not playing?
- Check mute button is not enabled
- Check device volume
- Check browser audio permissions
- Try different browser

## Future Enhancements

Potential improvements:
- [ ] Multi-language support (Hindi, Spanish, etc.)
- [ ] Voice selection (different voices)
- [ ] Speed control slider
- [ ] Continuous conversation mode
- [ ] Voice commands (e.g., "stop", "repeat")
- [ ] Offline support
- [ ] Voice activity detection
- [ ] Noise cancellation

## Performance

- **STT Latency**: ~500ms (depends on network)
- **TTS Latency**: Instant (browser-based)
- **Memory Usage**: Minimal (~5MB)
- **Battery Impact**: Moderate (microphone active)

## Security & Privacy

- Microphone permission required
- Speech processed by browser (Web Speech API)
- No audio recorded or stored
- Transcript not saved (unless in chat history)
- HTTPS required for microphone access

---

**Built with ❤️ for PetPal Voice Assistant**
