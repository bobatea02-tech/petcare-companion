@echo off
echo ========================================
echo Voice Response Testing Script
echo ========================================
echo.
echo This script will help you test voice responses
echo.
echo INSTRUCTIONS:
echo 1. Make sure backend is running (port 8000)
echo 2. Make sure frontend is running (port 5173)
echo 3. Open http://localhost:5173/voice-assistant/1
echo 4. Open browser console (F12)
echo 5. Click microphone and speak
echo.
echo ========================================
echo Expected Console Logs:
echo ========================================
echo.
echo When you speak, you should see:
echo   - 🎤 Voice recognition started
echo   - 🎯 Voice recognition result received
echo   - ✅ Final transcript: "your text"
echo.
echo When JoJo responds, you should see:
echo   - 🔊 Voice Response Debug: {...}
echo   - ✅ Speaking response now...
echo   - 🔊 Starting speech synthesis: ...
echo   - 🎙️ Using voice: ...
echo   - 🗣️ Speech started
echo   - ✅ Speech completed
echo.
echo ========================================
echo Test Commands:
echo ========================================
echo.
echo Try these voice commands:
echo   1. "What's my pet's name?"
echo   2. "Log feeding for Max"
echo   3. "Schedule a vet appointment"
echo   4. "Show me health records"
echo   5. "What's my pet's weight?"
echo.
echo ========================================
echo Troubleshooting:
echo ========================================
echo.
echo If no voice output:
echo   1. Check mute button (should be unmuted)
echo   2. Check browser console for errors
echo   3. Check system volume
echo   4. Try refreshing the page
echo   5. Use Chrome or Edge browser
echo.
echo If voice cuts off:
echo   - This is normal for very long responses
echo   - Check console for "interrupted" (normal)
echo.
echo If delayed response:
echo   - Check network connection
echo   - Wait for voices to load (first time)
echo.
echo ========================================
echo Quick Browser Test:
echo ========================================
echo.
echo Open browser console and run:
echo   const utterance = new SpeechSynthesisUtterance("Test");
echo   window.speechSynthesis.speak(utterance);
echo.
echo If you hear "Test", speech synthesis works!
echo.
echo ========================================
echo Press any key to open documentation...
pause >nul
start VOICE_RESPONSE_FIX.md
start TEST_VOICE_RESPONSES.md
