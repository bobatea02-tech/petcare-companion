# 🔐 Authentication Fix for Voice Assistant

## Problem

The voice assistant requires authentication (login) to work. The **401 Unauthorized** error means you need to log in first.

## Quick Fix

### Option 1: Log In Through UI (Recommended)

1. **Open the app:**
   ```
   http://localhost:5173
   ```

2. **Click "Login" or "Sign Up"**

3. **Create an account or log in:**
   - Email: `test@example.com`
   - Password: `password123`

4. **Go to Voice Assistant:**
   ```
   http://localhost:5173/voice-assistant/1
   ```

5. **Now it should work!**

### Option 2: Use Demo Mode (No Login Required)

If you want to test without authentication, you can use the browser test page:

```
http://localhost:5173/test-voice-synthesis.html
```

This tests voice synthesis without requiring backend authentication.

### Option 3: Create Test User via API

Use this curl command to create a test user:

```bash
curl -X POST http://localhost:8000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "password123",
    "first_name": "Test",
    "last_name": "User"
  }'
```

Then log in:

```bash
curl -X POST http://localhost:8000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "password123"
  }'
```

Copy the `access_token` from the response and save it in browser localStorage:

```javascript
// In browser console (F12):
localStorage.setItem('token', 'YOUR_ACCESS_TOKEN_HERE');
```

## What Was Fixed

### 1. API Client (`frontend/src/lib/api.ts`)
- ✅ Added authentication check in `jojoChat` method
- ✅ Returns friendly error message if not logged in
- ✅ Prevents unnecessary API calls without token

### 2. Voice Assistant Page (`frontend/src/pages/VoiceAssistant.tsx`)
- ✅ Added authentication check on component mount
- ✅ Redirects to login if not authenticated
- ✅ Shows friendly error message
- ✅ Speaks error message for better UX
- ✅ Handles 401 errors gracefully

## How It Works Now

### Before (Error):
```
User speaks → API call → 401 Unauthorized → Error
```

### After (Fixed):
```
User opens page → Check auth → Not logged in → Redirect to login
                                              ↓
                                    User logs in → Token saved
                                              ↓
                                    User speaks → API call with token → Success!
```

## Testing

### 1. Test Without Login
1. Clear localStorage: `localStorage.clear()`
2. Open voice assistant: `http://localhost:5173/voice-assistant/1`
3. **Expected:** Redirected to login page with message

### 2. Test With Login
1. Log in through UI
2. Open voice assistant: `http://localhost:5173/voice-assistant/1`
3. Click microphone and speak
4. **Expected:** Voice response works!

### 3. Test Session Expiry
1. Log in
2. Clear token: `localStorage.removeItem('token')`
3. Try to speak
4. **Expected:** Error message and redirect to login

## Error Messages

### User Not Logged In
- **Toast:** "Authentication Required - Please log in to use the voice assistant"
- **Voice:** "Please log in to use the voice assistant. I'm redirecting you to the login page."
- **Action:** Redirects to `/login` after 2 seconds

### Session Expired
- **Toast:** "Authentication Required - Your session has expired. Please log in again."
- **Voice:** "Your session has expired. Please log in again."
- **Action:** Redirects to `/login` after 2 seconds

## Console Logs

### Not Authenticated:
```
🔊 Voice Response Debug: {
  error: "Please log in to use the voice assistant"
}
⚠️ Redirecting to login...
```

### Authenticated:
```
✅ Token found: eyJ0eXAiOiJKV1QiLCJhbGc...
🔊 Voice Response Debug: {
  speak_response: true,
  response: "Hi there! I'm JoJo..."
}
✅ Speaking response now...
```

## Quick Login Script

Create a test user and log in automatically:

```javascript
// Run in browser console (F12)
async function quickLogin() {
  // Register
  const registerResponse = await fetch('http://localhost:8000/api/v1/auth/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: 'test@example.com',
      password: 'password123',
      first_name: 'Test',
      last_name: 'User'
    })
  });
  
  // Login
  const loginResponse = await fetch('http://localhost:8000/api/v1/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: 'test@example.com',
      password: 'password123'
    })
  });
  
  const data = await loginResponse.json();
  localStorage.setItem('token', data.access_token);
  console.log('✅ Logged in successfully!');
  location.reload();
}

quickLogin();
```

## Troubleshooting

### Still Getting 401 Error?

1. **Check token exists:**
   ```javascript
   console.log(localStorage.getItem('token'));
   ```

2. **Check token is valid:**
   ```javascript
   const token = localStorage.getItem('token');
   fetch('http://localhost:8000/api/v1/jojo/health', {
     headers: { 'Authorization': `Bearer ${token}` }
   }).then(r => r.json()).then(console.log);
   ```

3. **Clear and re-login:**
   ```javascript
   localStorage.clear();
   // Then log in again through UI
   ```

### Token Expired?

Tokens expire after a certain time. Just log in again:
1. Go to login page
2. Enter credentials
3. New token will be saved automatically

### Backend Not Running?

Make sure backend is running:
```bash
cd Voice-Pet-Care-assistant-
python -m uvicorn app.main:app --reload
```

Check backend health:
```
http://localhost:8000/api/v1/health
```

## Summary

The voice assistant now:
- ✅ Checks authentication before making API calls
- ✅ Redirects to login if not authenticated
- ✅ Shows friendly error messages
- ✅ Speaks error messages for better UX
- ✅ Handles session expiry gracefully
- ✅ Provides clear feedback to users

**Just log in and the voice assistant will work perfectly!** 🎉

---

**Quick Start:**
1. Open `http://localhost:5173`
2. Click "Sign Up" or "Login"
3. Create account or use existing
4. Go to Voice Assistant
5. Start speaking!

**Status:** ✅ FIXED - Authentication Required
**Next Step:** Log in to use voice assistant
