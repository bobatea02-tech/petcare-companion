# Wake Word Detection Setup Guide

## Problem
The "Hey JoJo" wake word is not responding because the Porcupine wake word detection service is not configured.

## Current Status
- ❌ Wake word detection is running in **simulation mode** (doesn't actually listen for "Hey JoJo")
- ❌ Missing Porcupine access key
- ❌ Missing Porcupine Web SDK package

## Solution

### Step 1: Get Porcupine Access Key

1. Go to https://console.picovoice.ai/
2. Sign up for a free account (free tier includes 3 wake word models)
3. Create a new access key
4. Copy the access key

### Step 2: Install Porcupine Web SDK

Navigate to the frontend directory and install the package:

```bash
cd Voice-Pet-Care-assistant-/frontend
npm install @picovoice/porcupine-web
```

### Step 3: Configure Environment Variable

Add your Porcupine access key to `Voice-Pet-Care-assistant-/frontend/.env`:

```env
VITE_PORCUPINE_ACCESS_KEY=your-actual-access-key-here
```

**Note:** Replace `your-actual-access-key-here` with the key you got from Picovoice Console.

### Step 4: Train Custom Wake Word (Optional but Recommended)

For best results with "Hey JoJo":

1. Go to https://console.picovoice.ai/
2. Navigate to "Porcupine" → "Wake Words"
3. Create a custom wake word model for "Hey JoJo"
4. Download the `.ppn` model file
5. Place it in `Voice-Pet-Care-assistant-/frontend/public/models/`
6. Update the wake word detector to use your custom model

### Step 5: Restart Development Server

After making these changes:

```bash
# Stop the current dev server (Ctrl+C)
# Restart it
npm run dev
```

### Step 6: Test Wake Word Detection

1. Open the app in your browser
2. Enable "Hands-free Mode" in the JoJo voice assistant settings
3. Say "Hey JoJo" clearly
4. The assistant should activate and show "Listening..."

## Troubleshooting

### Wake word still not working?

**Check microphone permissions:**
- Browser must have microphone access
- Check browser console for permission errors

**Check console logs:**
- Open browser DevTools (F12)
- Look for `[WakeWordDetector]` messages
- Should see "Porcupine mode enabled" (not "Development mode - using simulation")

**Verify environment variable:**
```bash
# In frontend directory
echo $VITE_PORCUPINE_ACCESS_KEY
```

**Check Porcupine package:**
```bash
# In frontend directory
npm list @picovoice/porcupine-web
```

### Alternative: Use Manual Activation

If you don't want to set up Porcupine right now, you can:
1. Click the JoJo button (sparkle icon) at bottom-right
2. Click the microphone button to start listening
3. Speak your command
4. JoJo will process and respond

## How It Works

### With Porcupine (Production Mode)
1. Continuous audio monitoring in background
2. Detects "Hey JoJo" wake word
3. Activates voice recognition automatically
4. Low CPU usage (<5%)
5. Works hands-free

### Without Porcupine (Simulation Mode - Current)
1. No real wake word detection
2. Random activation (0.1% probability per audio frame)
3. Essentially non-functional for real use
4. Manual button press required

## Cost

Porcupine offers:
- **Free Tier**: 3 wake word models, unlimited usage
- **Paid Tiers**: More models and features

For this app, the free tier is sufficient.

## Next Steps

After setup:
1. Test wake word detection thoroughly
2. Adjust sensitivity if needed (in code: `setSensitivity(0.7)`)
3. Train custom model for better accuracy
4. Consider adding multiple wake phrases

## Support

- Porcupine Documentation: https://picovoice.ai/docs/porcupine/
- Porcupine Console: https://console.picovoice.ai/
- GitHub Issues: Report issues in the project repository
