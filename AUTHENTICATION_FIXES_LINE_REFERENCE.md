# Authentication Fixes - Line-by-Line Reference

## Quick Navigation Guide

Use this guide to locate each fix in your codebase.

---

## File 1: `src/lib/tokenUtils.js` (NEW FILE)

**Location:** `c:\projects\donor\src\lib\tokenUtils.js`
**Status:** Created from scratch
**Size:** ~80 lines
**Key Functions:**
- Line 7: `decodeToken(token)` - Decode JWT without verification
- Line 21: `isTokenExpired(token)` - Check expiration ⭐ MAIN FUNCTION
- Line 31: `getTokenExpirationTime(token)` - Get expiration timestamp
- Line 41: `isTokenExpiringSoon(token, minutes)` - Warn before expiration
- Line 53: `getEmailFromToken(token)` - Extract email claim
- Line 59: `getRoleFromToken(token)` - Extract role claim  
- Line 65: `getUserIdFromToken(token)` - Extract user ID claim

**What to Look For:**
- Regex pattern: `/exp/` (expiration field)
- Key logic: `payload.exp <= currentTimeInSeconds`

---

## File 2: `src/lib/apiClient.js` (NEW FILE)

**Location:** `c:\projects\donor\src\lib\apiClient.js`
**Status:** Created from scratch
**Size:** ~80 lines
**Key Functions:**
- Line 17: `setGlobalLogoutCallback(callback)` - Wire logout
- Line 30: `apiFetch(path, options)` - Enhanced fetch ⭐ MAIN FUNCTION
- Line 37: Token expiration check BEFORE request
- Line 51: 401 response handling AFTER request
- Line 68: `handleUnauthorized()` - Clear auth and redirect

**What to Look For:**
- Regex pattern: `/401|unauthorized/i`
- Key logic: `handleUnauthorized()` calls
- Redirect: `window.location.href = "/#/login"`

---

## File 3: `src/lib/AuthContext.jsx` (MODIFIED)

**Location:** `c:\projects\donor\src\lib\AuthContext.jsx`
**Status:** Enhanced with token validation
**Lines Modified:** 6-17 (imports + new useEffect)
**Total Size:** ~50 lines

### Changes:
```
Line 1:  import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
Line 2:  import { isTokenExpired } from "./tokenUtils";  // ✅ NEW IMPORT

Lines 13-24: ✅ NEW useEffect (TOKEN VALIDATION ON MOUNT)
  // Validate token on app load (fix for persistent expired tokens)
  useEffect(() => {
    if (!token) return;
    
    if (isTokenExpired(token)) {
      console.warn("[AUTH] Stored token is expired. Clearing authentication.");
      localStorage.removeItem("auth_token");
      localStorage.removeItem("auth_user");
      setToken("");
      setUser(null);
    }
  }, []); // Run once on app mount
```

**What to Look For:**
- Regex: `isTokenExpired\(`
- Regex: `"Stored token is expired"`
- The `useEffect` with empty dependency array `[]`

---

## File 4: `src/pages/ResetPassword.jsx` (MODIFIED)

**Location:** `c:\projects\donor\src\pages\ResetPassword.jsx`
**Status:** Enhanced with logout and validation
**Lines Modified:** 1-40 (imports + useEffect update)
**Total Size:** ~120 lines

### Changes:
```
Line 1:  import { useState, useEffect } from "react";
Line 2:  import { Card } from "@/components/ui/card";
Line 3:  import { Button } from "@/components/ui/button";
Line 4:  import { Input } from "@/components/ui/input";
Line 5:  import { toast } from "sonner";
Line 6:  import { useNavigate, useParams } from "react-router-dom";
Line 7:  import { API } from "@/lib/api";
Line 8:  import { useAuth } from "@/lib/AuthContext";         // ✅ NEW
Line 9:  import { decodeToken } from "@/lib/tokenUtils";      // ✅ NEW

Line 12: const { logout } = useAuth();  // ✅ NEW

Lines 20-44: ✅ MODIFIED useEffect (ADDED LOGOUT + VALIDATION)
  useEffect(() => {
    console.log(' ResetPassword useEffect - token:', token);
    if (!token) {
      console.log(' No token found, redirecting to forgot-password');
      toast.error("Invalid reset link. Please request a new password reset.");
      navigate("/forgot-password");
      return;  // ✅ NEW
    }

    // ✅ NEW: Validate reset token format
    const resetTokenPayload = decodeToken(token);
    if (!resetTokenPayload) {
      console.error('[AUTH] Reset token is malformed');
      toast.error("Invalid reset link. Please request a new password reset.");
      setValidToken(false);
      return;
    }

    // ✅ NEW: Clear any existing auth state
    console.log('[AUTH] Processing password reset - clearing session for isolation');
    logout();
  }, [token, navigate, logout]);  // ✅ ADDED logout to dependencies
```

**What to Look For:**
- Regex: `useAuth\(\)`
- Regex: `decodeToken`
- Regex: `"clearing session for isolation"`
- Call to: `logout()`

---

## File 5: `src/pages/ForgotPassword.jsx` (MODIFIED)

**Location:** `c:\projects\donor\src\pages\ForgotPassword.jsx`
**Status:** Enhanced with logout call
**Lines Modified:** 1-30 (imports + logout call)
**Total Size:** ~110 lines

### Changes:
```
Line 1:  import { useState } from "react";
Line 2:  import { Card } from "@/components/ui/card";
Line 3:  import { Button } from "@/components/ui/button";
Line 4:  import { Input } from "@/components/ui/input";
Line 5:  import { toast } from "sonner";
Line 6:  import { Shield } from "lucide-react";
Line 7:  import { API } from "@/lib/api";
Line 8:  import RecaptchaProtection from "@/components/RecaptchaProtection";
Line 9:  import { useAuth } from "@/lib/AuthContext";  // ✅ NEW

Line 12: const { logout } = useAuth();  // ✅ NEW

Lines 25-30: ✅ NEW (LOGOUT CALL IN SUBMIT)
  async function submit(e, executeRecaptcha) {
    e.preventDefault();
    if (!email) {
      toast.error("Please enter your email.");
      return;
    }
    try {
      setBusy(true);

      // ✅ NEW: Clear any existing auth to prevent token confusion
      console.log('[AUTH] Password reset requested - clearing session for security');
      logout();

      // ️ reCAPTCHA Protection - Get verification token
```

**What to Look For:**
- Regex: `useAuth\(\)`
- Regex: `"Password reset requested"`
- Call to: `logout()`
- Location: First line inside try block

---

## File 6: `src/App.jsx` (MODIFIED)

**Location:** `c:\projects\donor\src\App.jsx`
**Status:** Enhanced with logout callback initialization
**Lines Modified:** 1 (import) + 120 (new useEffect)
**Total Size:** ~437 lines

### Changes:

#### Top of File (Line 1):
```javascript
// BEFORE:
import React, { useState } from "react";

// AFTER:
import React, { useState, useEffect } from "react";  // ✅ ADDED useEffect
```

#### After other imports (around line 48):
```javascript
import { setGlobalLogoutCallback } from "@/lib/apiClient";  // ✅ NEW IMPORT
```

#### In Shell Function (around line 118-125):
```javascript
function Shell() {
  const [disburseOpen, setDisburseOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();  // ✅ ADDED logout to destructuring

  // ✅ NEW: Set global logout callback for API client to use on 401
  useEffect(() => {
    setGlobalLogoutCallback(logout);
  }, [logout]);

  const active = keyFromPath(location.pathname);
```

**What to Look For:**
- Regex: `setGlobalLogoutCallback`
- Regex: `"Set global logout callback"`
- The new `useEffect` hook in Shell component
- Added `logout` to destructuring from `useAuth()`

---

## Finding All Changes

### Quick Search Strategy

**To find all authentication changes:**

```bash
# Find all files with changes
grep -r "setGlobalLogoutCallback\|isTokenExpired\|logout\(\)" src/ --include="*.jsx" --include="*.js"

# Find token validation
grep -r "isTokenExpired" src/ --include="*.jsx" --include="*.js"

# Find logout calls
grep -r "logout\(\)" src/pages/ --include="*.jsx"

# Find 401 handling
grep -r "401\|Unauthorized" src/lib/ --include="*.js"
```

### File Change Summary

| File | Type | Lines | Key Change |
|------|------|-------|-----------|
| `src/lib/tokenUtils.js` | NEW | 80 | Token validation functions |
| `src/lib/apiClient.js` | NEW | 80 | 401 handler & auth interception |
| `src/lib/AuthContext.jsx` | MOD | +14 | Token expiration check on mount |
| `src/pages/ResetPassword.jsx` | MOD | +18 | logout() + token validation |
| `src/pages/ForgotPassword.jsx` | MOD | +4 | logout() when requesting reset |
| `src/App.jsx` | MOD | +6 | Initialize logout callback |

---

## Testing These Changes

### Verify Token Validation Works
```javascript
// Open browser console and run:
import { isTokenExpired } from './lib/tokenUtils';

// Test with current token
const token = localStorage.getItem('auth_token');
console.log('Token expired?', isTokenExpired(token));

// Should print: false (if token valid)
// Should print: true (if token expired)
```

### Verify 401 Handling
```javascript
// Look for this in console when 401 occurs:
[API] 401 Unauthorized response from /api/...
// Then redirect should happen
```

### Verify Logout Call
```javascript
// When visiting /reset-password/:token, console should show:
[AUTH] Processing password reset - clearing session for isolation
```

---

## Build & Test Commands

```bash
# Verify syntax is correct
npm run lint

# Build the project
npm run build

# Start dev server
npm run dev

# Run specific test
npm test -- AuthContext

# Check for errors
npm run build --verbose
```

---

## Deployment Verification

After deploying, verify each fix:

1. **Token Expiration Fix:**
   - Login → Change system date forward → Refresh app
   - Expected: Redirect to login ✅

2. **401 Handler Fix:**
   - Manually expire token in localStorage
   - Make API call
   - Expected: Redirect to login ✅

3. **Email Link Isolation Fix:**
   - Login as User A → Click password reset for User B
   - Expected: Session cleared, clean form ✅

4. **Logout Callback Fix:**
   - Check browser console
   - Expected: No errors about undefined logout ✅

---

## Troubleshooting by Location

### Issue: "isTokenExpired is not defined"
- **Check:** `src/lib/tokenUtils.js` exists
- **Check:** `src/lib/AuthContext.jsx` imports it (line 2)
- **Fix:** Ensure tokenUtils.js was created

### Issue: "logout is not defined"
- **Check:** `src/pages/ResetPassword.jsx` line 8 import
- **Check:** `src/pages/ResetPassword.jsx` line 12 destructuring
- **Fix:** Verify useAuth() import and destructuring

### Issue: "setGlobalLogoutCallback is not defined"
- **Check:** `src/lib/apiClient.js` exports it
- **Check:** `src/App.jsx` imports it (line ~48)
- **Fix:** Ensure apiClient.js was created

### Issue: Redirect not working
- **Check:** `src/lib/apiClient.js` line 68 (handleUnauthorized)
- **Check:** window.location.href = "/#/login" present
- **Fix:** Verify redirect URL matches your routing

---

## Line-by-Line Code Review

### Most Critical Lines

1. **`src/lib/AuthContext.jsx` - Line 16:**
   ```javascript
   if (isTokenExpired(token)) {
   ```
   This is where expired tokens are detected ⭐

2. **`src/lib/apiClient.js` - Line 41:**
   ```javascript
   if (res.status === 401) {
   ```
   This is where 401 responses are caught ⭐

3. **`src/pages/ResetPassword.jsx` - Line 34:**
   ```javascript
   logout();
   ```
   This clears auth when processing email links ⭐

4. **`src/App.jsx` - Line 120:**
   ```javascript
   setGlobalLogoutCallback(logout);
   ```
   This connects API layer to auth context ⭐

---

**Use this guide to navigate all changes and verify they're in place** ✅
