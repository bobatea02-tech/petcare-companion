# JoJo Voice Assistant Services

This directory contains the core infrastructure for the JoJo Voice Assistant system.

## Overview

The voice assistant infrastructure provides:

1. **Wake Word Detection** - Porcupine Web SDK for "Hey JoJo" activation
2. **Text-to-Speech** - ElevenLabs API with quota tracking
3. **Response Caching** - IndexedDB-based cache for TTS responses
4. **Type Definitions** - Comprehensive TypeScript interfaces

## Directory Structure

```
src/services/voice/
├── types.ts                    # TypeScript interfaces for all components
├── elevenLabsClient.ts         # ElevenLabs API client with quota tracking
├── responseCacheManager.ts     # IndexedDB cache for TTS responses
├── wakeWordDetector.ts         # Porcupine wake word detection
├── index.ts                    # Main export file
└── README.md                   # This file
```

## Components

### 1. Type Definitions (`types.ts`)

Comprehensive TypeScript interfaces for:
- Wake Word Detection
- Voice Recognition
- Voice Activity Detection
- Intent Parsing
- Context Management
- Command Routing
- Dashboard Actions
- Response Composition
- TTS Engine
- Response Cache
- Audio Feedback
- Proactive Alerts
- Voice Sessions
- Usage Tracking

### 2. ElevenLabs Client (`elevenLabsClient.ts`)

**Features:**
- Text-to-speech synthesis using ElevenLabs API
- Streaming audio for low latency (<2s)
- Quota tracking (10,000 chars/month free tier)
- Automatic usage statistics management
- Response caching integration

**Requirements Addressed:**
- 3.1: Use ElevenLabs API for natural speech
- 3.6: Track character usage below 10,000 chars/month

**Configuration:**
Set the ElevenLabs API key in your `.env` file:
```
VITE_ELEVENLABS_API_KEY=your_api_key_here
```

**Usage:**
```typescript
import { elevenLabsClient } from '@/services/voice';

// Synthesize speech
const audio = await elevenLabsClient.synthesize('Hello, how can I help you?', {
  voice: 'rachel',
  useCache: true
});

// Get usage stats
const stats = await elevenLabsClient.getUsageStats();
console.log(`Used ${stats.percentageUsed}% of monthly quota`);
```

### 3. Response Cache Manager (`responseCacheManager.ts`)

**Features:**
- IndexedDB-based persistent storage
- LRU (Least Recently Used) eviction policy
- Maximum 100 cached entries
- Cache statistics tracking
- Preloading common responses

**Requirements Addressed:**
- 3.4: Cache frequently used responses
- 15.1: Store TTS audio with response text as key
- 15.2: Retrieve from cache instead of API
- 15.5: Max 100 entries with LRU eviction

**Usage:**
```typescript
import { responseCacheManager } from '@/services/voice';

// Store audio in cache
await responseCacheManager.store(text, audioBuffer);

// Retrieve from cache
const cachedAudio = await responseCacheManager.get(text);

// Get cache statistics
const stats = responseCacheManager.getStats();
console.log(`Cache has ${stats.entryCount} entries`);
```

### 4. Wake Word Detector (`wakeWordDetector.ts`)

**Features:**
- Continuous audio monitoring in hands-free mode
- Web Worker for background processing
- Low CPU usage (<5%)
- Configurable sensitivity threshold

**Requirements Addressed:**
- 1.1: Activate within 500ms of wake word detection
- 1.5: Continuously monitor in hands-free mode

**Current Status:**
⚠️ **Placeholder Implementation** - The current implementation is a placeholder.

**To Complete Implementation:**

1. Install Porcupine Web SDK:
```bash
npm install @picovoice/porcupine-web
```

2. Get Porcupine Access Key:
   - Sign up at https://console.picovoice.ai/
   - Create a new access key
   - Add to `.env`: `VITE_PORCUPINE_ACCESS_KEY=your_key`

3. Train Custom Wake Word:
   - Use Picovoice Console to train "Hey JoJo" wake word
   - Download the `.ppn` model file
   - Place in `public/models/hey-jojo.ppn`

4. Update `wakeWordDetector.ts` with actual Porcupine integration

**Usage:**
```typescript
import { wakeWordDetector } from '@/services/voice';

// Initialize
await wakeWordDetector.initialize('Hey JoJo');

// Set callback
wakeWordDetector.onWakeWordDetected(() => {
  console.log('Wake word detected!');
  // Start voice recognition
});

// Start listening
wakeWordDetector.startListening();

// Stop listening
wakeWordDetector.stopListening();
```

## Environment Variables

Add these to your `.env` file:

```env
# ElevenLabs API Configuration
VITE_ELEVENLABS_API_KEY=your_elevenlabs_api_key

# Porcupine Wake Word Detection (when implemented)
VITE_PORCUPINE_ACCESS_KEY=your_porcupine_access_key
```

## Quota Management

The system automatically tracks ElevenLabs API usage:

- **Free Tier Limit:** 10,000 characters/month
- **Warning Threshold:** 8,000 characters (80%)
- **Behavior at 80%:** Prioritize cached responses, shorten new responses
- **Behavior at 100%:** Fall back to text-only mode

Usage statistics are stored in `localStorage` and reset monthly.

## Testing

Property-based tests are defined in the tasks document:

- **Property 9:** Response caching round-trip
- **Property 10:** TTS quota management

Unit tests should cover:
- API error handling
- Cache eviction
- Quota exhaustion fallback
- Wake word detection latency

## Next Steps

After completing Task 1, the following tasks will build on this infrastructure:

- **Task 2:** Implement wake word detection system (complete Porcupine integration)
- **Task 3:** Implement voice recognition engine (Web Speech API)
- **Task 4:** Implement voice activity detection
- **Task 11:** Implement TTS engine with ElevenLabs (integrate with this client)
- **Task 12:** Implement response caching system (integrate with this cache)

## Dependencies

Current dependencies (already in package.json):
- None (uses browser APIs)

Required for full implementation:
- `@picovoice/porcupine-web` - Wake word detection
- `@picovoice/web-voice-processor` - Audio processing utilities

## Browser Compatibility

- **IndexedDB:** All modern browsers
- **Web Audio API:** All modern browsers
- **MediaDevices API:** Requires HTTPS (except localhost)
- **Web Workers:** All modern browsers

## Security Considerations

1. **API Keys:** Never commit API keys to version control
2. **Microphone Access:** Requires user permission
3. **HTTPS Required:** Microphone access requires HTTPS in production
4. **Quota Limits:** Implement proper quota management to avoid service disruption

## Performance

- **Wake Word Detection:** <5% CPU usage
- **TTS Latency:** <2 seconds to first audio
- **Cache Lookup:** <50ms
- **Memory Usage:** ~10MB for 100 cached responses

## Troubleshooting

### ElevenLabs API Errors

- Check API key is set correctly
- Verify quota hasn't been exceeded
- Check network connectivity

### Cache Issues

- Clear IndexedDB: `responseCacheManager.clear()`
- Check browser storage quota
- Verify IndexedDB is supported

### Wake Word Detection Issues

- Ensure microphone permission granted
- Check audio input device is working
- Verify Porcupine access key is valid
- Test with different sensitivity thresholds

## References

- [ElevenLabs API Documentation](https://docs.elevenlabs.io/)
- [Porcupine Wake Word Engine](https://picovoice.ai/platform/porcupine/)
- [IndexedDB API](https://developer.mozilla.org/en-US/docs/Web/API/IndexedDB_API)
- [Web Audio API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API)
