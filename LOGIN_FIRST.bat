@echo off
echo ========================================
echo Voice Assistant - Login Required
echo ========================================
echo.
echo The voice assistant requires authentication!
echo.
echo You need to LOG IN first before using the voice assistant.
echo.
echo ========================================
echo Quick Steps:
echo ========================================
echo.
echo 1. Open your browser to:
echo    http://localhost:5173
echo.
echo 2. Click "Sign Up" or "Login"
echo.
echo 3. Create an account:
echo    - Email: test@example.com
echo    - Password: password123
echo    - Name: Test User
echo.
echo 4. After login, go to Voice Assistant:
echo    http://localhost:5173/voice-assistant/1
echo.
echo 5. Now you can use voice commands!
echo.
echo ========================================
echo Why This Is Needed:
echo ========================================
echo.
echo The voice assistant needs to:
echo   - Save your conversation history
echo   - Track your question quota
echo   - Access your pet information
echo   - Personalize responses
echo.
echo All of this requires authentication!
echo.
echo ========================================
echo Alternative: Test Without Login
echo ========================================
echo.
echo If you just want to test voice synthesis:
echo    http://localhost:5173/test-voice-synthesis.html
echo.
echo This tests voice output without backend.
echo.
echo ========================================
echo Quick Login Script:
echo ========================================
echo.
echo Open browser console (F12) and run:
echo.
echo   async function quickLogin() {
echo     const response = await fetch('http://localhost:8000/api/v1/auth/register', {
echo       method: 'POST',
echo       headers: { 'Content-Type': 'application/json' },
echo       body: JSON.stringify({
echo         email: 'test@example.com',
echo         password: 'password123',
echo         first_name: 'Test',
echo         last_name: 'User'
echo       })
echo     });
echo     const loginResponse = await fetch('http://localhost:8000/api/v1/auth/login', {
echo       method: 'POST',
echo       headers: { 'Content-Type': 'application/json' },
echo       body: JSON.stringify({
echo         email: 'test@example.com',
echo         password: 'password123'
echo       })
echo     });
echo     const data = await loginResponse.json();
echo     localStorage.setItem('token', data.access_token);
echo     location.reload();
echo   }
echo   quickLogin();
echo.
echo ========================================
echo Press any key to open login page...
pause >nul
start http://localhost:5173/login
