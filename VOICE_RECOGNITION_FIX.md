# Voice Recognition Not Detecting Voice - Troubleshooting Guide

## Common Issues and Solutions

### 1. Microphone Permissions
The most common issue is that the browser doesn't have permission to access your microphone.

**How to Fix:**
1. Click the microphone icon in the browser's address bar (usually shows a camera/microphone icon)
2. Select "Allow" for microphone access
3. Refresh the page
4. Try clicking the microphone button again

**Chrome/Edge:**
- Go to `chrome://settings/content/microphone`
- Make sure "Ask before accessing" is enabled
- Check that localhost:5173 is not blocked

**Firefox:**
- Go to `about:preferences#privacy`
- Scroll to "Permissions" → "Microphone"
- Make sure the site is allowed

### 2. No Microphone Detected
**Check if your microphone is working:**
1. Open Windows Sound Settings (Right-click speaker icon → Sounds → Recording tab)
2. Speak into your microphone and check if the green bars move
3. Make sure the correct microphone is set as default
4. Test microphone in another app (e.g., Voice Recorder)

### 3. Browser Compatibility
The voice recognition uses Web Speech API which works best in:
- ✅ Chrome/Edge (Chromium-based) - Best support
- ✅ Safari (macOS/iOS)
- ⚠️ Firefox - Limited support
- ❌ Internet Explorer - Not supported

### 4. HTTPS Requirement
Web Speech API requires HTTPS in production, but localhost should work fine.

### 5. Background Noise
If the microphone is working but not detecting speech:
- Speak clearly and closer to the microphone
- Reduce background noise
- Check microphone sensitivity in Windows settings

## Testing Voice Recognition

### Quick Test:
1. Open the voice assistant page
2. Click the microphone button (should turn red when listening)
3. Say "Hello JoJo"
4. You should see your words appear as you speak

### Browser Console Test:
Open browser console (F12) and run:
```javascript
const recognition = new (window.SpeechRecognition || window.webkitSpeechRecognition)();
recognition.onresult = (e) => console.log('Heard:', e.results[0][0].transcript);
recognition.start();
// Now speak into your microphone
```

## Current Implementation Details

### Voice Recognition Settings:
- **Language**: en-US (English - United States)
- **Continuous**: false (stops after detecting speech)
- **Interim Results**: true (shows text as you speak)
- **Timeout**: 60 seconds (stops listening after 1 minute of silence)
- **Max Alternatives**: 3 (considers multiple interpretations)

### Visual Indicators:
- 🔴 Red dot in header = Listening
- 🟢 Green dot = Idle
- 🔵 Blue pulsing = Speaking/Processing

### Error Messages:
The app will show specific error messages for:
- No speech detected
- Microphone not found
- Permission denied
- Network errors
- Service not available

## Debugging Steps

1. **Check Browser Console** (F12 → Console tab)
   - Look for any red error messages
   - Check for permission errors

2. **Check Microphone Permissions**
   - Look for microphone icon in address bar
   - Click it to see permission status

3. **Test Microphone**
   - Open Windows Sound Settings
   - Speak and watch for green bars

4. **Try Different Browser**
   - Chrome/Edge usually work best
   - Safari on Mac also works well

5. **Check Network**
   - Web Speech API requires internet connection
   - Check if you're online

## Known Limitations

1. **Internet Required**: Web Speech API uses Google's servers for recognition
2. **Privacy**: Your voice is sent to Google for processing
3. **Language**: Currently set to English only
4. **Timeout**: Stops listening after 60 seconds of silence
5. **Browser Support**: Works best in Chrome/Edge

## Advanced Troubleshooting

### Reset Browser Permissions:
1. Go to `chrome://settings/content/siteDetails?site=http://localhost:5173`
2. Reset all permissions
3. Refresh the page
4. Grant microphone permission when prompted

### Check Windows Privacy Settings:
1. Open Settings → Privacy → Microphone
2. Make sure "Allow apps to access your microphone" is ON
3. Make sure "Allow desktop apps to access your microphone" is ON
4. Scroll down and ensure your browser is allowed

### Disable Browser Extensions:
Some extensions can block microphone access:
1. Try opening in Incognito/Private mode
2. If it works there, disable extensions one by one to find the culprit

## Getting Help

If none of these solutions work, please provide:
1. Browser name and version
2. Operating system
3. Error messages from browser console (F12)
4. Screenshot of microphone permissions
5. Whether microphone works in other apps

## Code Implementation

The voice recognition is implemented in:
- `frontend/src/hooks/useVoiceAssistant.ts` - Main hook
- `frontend/src/services/voice/voiceRecognitionEngine.ts` - Recognition engine
- `frontend/src/pages/VoiceAssistant.tsx` - UI integration

The implementation uses the native Web Speech API with proper error handling and timeout management.
