@echo off
REM Wake Word Detection Setup Script for Windows
REM This script helps set up Porcupine wake word detection for "Hey JoJo"

echo ========================================
echo Wake Word Detection Setup
echo ========================================
echo.

REM Check if we're in the right directory
if not exist "frontend" (
    echo ERROR: Please run this script from the Voice-Pet-Care-assistant- directory
    pause
    exit /b 1
)

echo Step 1: Installing Porcupine Web SDK...
echo.
cd frontend
call npm install @picovoice/porcupine-web
if errorlevel 1 (
    echo ERROR: Failed to install Porcupine package
    pause
    exit /b 1
)
echo ✓ Porcupine package installed successfully
echo.

echo Step 2: Checking environment configuration...
echo.
if not exist ".env" (
    echo Creating .env file...
    echo VITE_API_URL=http://localhost:8000 > .env
    echo VITE_API_BASE_URL=http://localhost:8000/api >> .env
    echo. >> .env
)

REM Check if VITE_PORCUPINE_ACCESS_KEY already exists
findstr /C:"VITE_PORCUPINE_ACCESS_KEY" .env >nul 2>&1
if errorlevel 1 (
    echo Adding VITE_PORCUPINE_ACCESS_KEY placeholder to .env...
    echo. >> .env
    echo # Porcupine Wake Word Detection >> .env
    echo # Get your access key from https://console.picovoice.ai/ >> .env
    echo VITE_PORCUPINE_ACCESS_KEY=your-porcupine-access-key-here >> .env
    echo ✓ Environment variable placeholder added
) else (
    echo ✓ VITE_PORCUPINE_ACCESS_KEY already exists in .env
)
echo.

cd ..

echo ========================================
echo Setup Complete!
echo ========================================
echo.
echo IMPORTANT: You still need to:
echo.
echo 1. Get a Porcupine access key:
echo    - Go to https://console.picovoice.ai/
echo    - Sign up for a free account
echo    - Create an access key
echo.
echo 2. Update the .env file:
echo    - Open: Voice-Pet-Care-assistant-/frontend/.env
echo    - Replace "your-porcupine-access-key-here" with your actual key
echo.
echo 3. Restart your development server:
echo    - Stop the current server (Ctrl+C)
echo    - Run: npm run dev
echo.
echo 4. Test wake word detection:
echo    - Enable "Hands-free Mode" in JoJo settings
echo    - Say "Hey JoJo" clearly
echo.
echo For detailed instructions, see: WAKE_WORD_SETUP.md
echo.
pause
