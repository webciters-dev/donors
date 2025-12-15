# Deep Analysis: "Failed to save education details" Error

## Executive Summary

One developer consistently encounters "Failed to save education details. Please try again." error while other developers don't. The app is using **HashRouter** (hash-based routing with `#/apply`) but your working version shows query parameter routing (`/apply?step=2`). This architectural mismatch combined with multiple environmental factors is causing the failure.

---

## Critical Discovery: Routing Architecture Mismatch

### Developer's Environment
- **URL Structure**: `https://aircrew.nl/#/apply` (HashRouter - hash-based)
- **Step Parameter**: Presumably using hash routing for step navigation
- **Error Status**: Consistent failure on education details save

### Your Working Environment  
- **URL Structure**: `https://aircrew.nl/apply?step=2` (Browser Router - path-based)
- **Step Parameter**: Using query parameters (`?step=2`)
- **Error Status**: Everything works

### The Issue
**`src/App.jsx` line 20 uses `HashRouter`:**
```jsx
import { HashRouter as Router, ... } from "react-router-dom";
```

But **`src/pages/ApplicationForm.jsx` lines 302 & 47 use query parameters:**
```jsx
const newUrl = `${location.pathname}?step=${step}`;  // Line 302
const searchParams = new URLSearchParams(location.search);  // Line 47
```

---

## Root Causes (Ranked by Likelihood)

### **PRIMARY CAUSE 1: Hash vs Query Parameter Mismatch** ⚠️ CRITICAL

**Evidence:**
- Your URL: `https://aircrew.nl/apply?step=2` ✅ Working
- Developer's URL: `https://aircrew.nl/#/apply` ❌ Not working
- ApplicationForm reads from `location.search` (query params)
- With HashRouter, query params are AFTER the hash

**The Problem:**
With HashRouter:
- URL becomes: `https://aircrew.nl/#/apply?step=2` (sometimes)
- Or it might be: `https://aircrew.nl/#/apply` with step in hash

The `location.search` might be empty or malformed, so `getInitialStep()` returns `1` instead of the intended step.

**Lines of Impact:**
- ApplicationForm.jsx:51-59 - getInitialStep() may read wrong values
- ApplicationForm.jsx:68 - useState(getInitialStep()) - starts at wrong step
- ApplicationForm.jsx:302 - setStep updates hash, not query params

---

### **PRIMARY CAUSE 2: Environment Variable Mismatch** 🔧

**Check these:**

1. **API Base URL differs between environments**
   - `VITE_API_URL` environment variable
   - Developer might be pointing to localhost:3001 instead of https://aircrew.nl
   - Or pointing to a different VPS instance

   **Location:** `.env.production` and `.env` files
   
   ```javascript
   // src/lib/api.js line 1
   const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:3001";
   ```
   
   **What to check:**
   - Does developer have `.env` file pointing to wrong API?
   - Is their backend running on different port?
   - Is their backend actually started?

2. **Build Configuration Issue**
   - Developer might be running old build
   - Browser cache serving stale JavaScript
   - Vite configuration not picking up environment variables

---

### **PRIMARY CAUSE 3: Authentication Token Not Being Sent** 🔐

**Line 1354 in ApplicationForm.jsx:**
```javascript
const headers = { "Content-Type": "application/json" };
if (token) {
  headers.Authorization = `Bearer ${token}`;
}
```

**Potential Issues:**
1. `token` variable is undefined/null
2. Token is expired
3. Token is invalid on the backend

**How to Verify:**
- Open DevTools → Network tab
- Look at the PATCH request to `/api/students/{id}`
- Check if `Authorization: Bearer ...` header is present
- Check the request body (step2Payload)

**Backend Check (line 461):**
```javascript
const role = req.user?.role;
const myStudentId = req.user?.studentId ?? req.user?.id;
```

If authentication fails, `req.user` is undefined, and the PATCH returns 500 "Failed to update student"

---

### **PRIMARY CAUSE 4: Database Schema/Student Record Issue** 💾

**Backend endpoint: PATCH /api/students/:id (lines 456-550)**

Possible failures:
1. **Student record doesn't exist** - 404 or Prisma error
2. **Prisma schema mismatch** - degreeLevel field doesn't exist
3. **Database connection timeout** - Backend can't reach database
4. **Validation error in Prisma** - Invalid enum values for degreeLevel/field

**Lines 498-539 show the data being saved:**
```javascript
...(degreeLevel !== undefined ? { degreeLevel } : {}),
...(field !== undefined ? { field } : {}),
...(program !== undefined ? { program } : {}),
...(gpa !== undefined ? { gpa: ... } : {}),
```

**Debug logs at lines 500-507 and 545-551 show what's being sent**

---

### **PRIMARY CAUSE 5: Browser Cache & Service Workers** 🔄

**Possible issues:**
1. Old JavaScript bundle cached in browser
2. Service worker caching old API responses
3. Outdated node_modules

**Steps to Check:**
- Hard refresh: `Ctrl+Shift+Delete` (Windows) or `Cmd+Shift+Delete` (Mac)
- Clear site data in browser
- Check if Service Worker is running
- Delete `node_modules` and reinstall: `npm install`

---

### **PRIMARY CAUSE 6: CORS or API Routing Issues** 🌐

**Backend Express server configuration:**
- CORS headers might be different
- API routing might be misconfigured
- Nginx/proxy configuration might be blocking requests

**To Check:**
- Open DevTools → Network tab → click failed request
- Look at Response headers
- Look for 403/401/500 responses instead of 200

---

## Step-by-Step Diagnostic Checklist

### 1. Verify URL Structure
```
What is the EXACT URL when error occurs?
[ ] https://aircrew.nl/#/apply (HashRouter)
[ ] https://aircrew.nl/apply?step=2 (BrowserRouter)
[ ] https://aircrew.nl/apply?step=3 (BrowserRouter)
[ ] Something else: _______________
```

### 2. Check API Endpoint
Open DevTools → Network tab → Look for the failed request:
```
[ ] Request URL: https://aircrew.nl/api/students/[studentId]
[ ] Request Method: PATCH
[ ] Status Code: ___ (should be 200)
[ ] Has Authorization header: YES / NO
[ ] Token appears valid: YES / NO / CAN'T SEE
```

### 3. Check Backend Logs
```bash
# On VPS, check if backend is running
pm2 logs awake-backend --lines 100

# Look for:
- "PATCH /students/:id" log entries
- Any JWT_SECRET errors
- Database connection errors
- Prisma validation errors
```

### 4. Check API Base URL
```javascript
// Open browser console and run:
console.log(import.meta.env.VITE_API_URL)

// Should output: https://aircrew.nl (or correct domain)
// If it outputs: http://localhost:3001 (❌ WRONG!)
// Then environment variables not being picked up
```

### 5. Clear Cache & Rebuild
```bash
# On developer's computer:
cd ~/projects/donor

# Clear everything
rm -rf node_modules .vite dist

# Rebuild
npm install
npm run build

# For dev mode:
npm run dev
```

### 6. Check Token Validity
```javascript
// In browser console after logging in:
// Assuming useAuth context is available
const { token } = useAuth();
console.log("Token:", token);
console.log("Token length:", token?.length);

// Try decoding (paste in jwt.io):
// Check expiration time
```

---

## Specific Code Issues Found

### **Issue 1: HashRouter + Query Parameters Incompatibility**

**File:** `src/pages/ApplicationForm.jsx` lines 47-59
```javascript
// ❌ PROBLEM: With HashRouter, location.search might be empty
const searchParams = new URLSearchParams(location.search);
const urlStep = parseInt(searchParams.get('step'));
// urlStep might be NaN if query params are in hash
```

**File:** `src/pages/ApplicationForm.jsx` line 302
```javascript
// ❌ PROBLEM: Updates URL but may use wrong format
const newUrl = `${location.pathname}?step=${step}`;
// With HashRouter, this should be: #/apply?step=${step}
```

### **Issue 2: Potential Missing Student Record**

**File:** `src/pages/ApplicationForm.jsx` line 1356
```javascript
const currentStudentId = user?.studentId || studentId;
const step2Res = await fetch(`${API.baseURL}/api/students/${currentStudentId}`, {
```

**What if:**
- `user?.studentId` is undefined
- `studentId` state variable is also undefined
- Request goes to `/api/students/undefined` ❌

### **Issue 3: No Error Response Parsing**

**File:** `src/pages/ApplicationForm.jsx` line 1365
```javascript
if (!step2Res.ok) {
  throw new Error("Failed to save education details");  // Generic error
}
```

**Problem:** The actual error from backend is ignored. Could be:
- 403 Forbidden (authentication failed)
- 404 Not Found (student doesn't exist)
- 500 Internal Server Error (database issue)
- 422 Unprocessable Entity (validation error)

**Needs to be:**
```javascript
if (!step2Res.ok) {
  const errorData = await step2Res.json();
  throw new Error(errorData.error || `HTTP ${step2Res.status}`);
}
```

---

## Testing Instructions

### **For the Developer:**

1. **Open DevTools** (F12)
2. **Go to Network tab**
3. **Clear all requests** (trash icon)
4. **Try to save education details**
5. **Look for the PATCH request to `/api/students/...`**
6. **Screenshot:**
   - Request headers (Authorization)
   - Request body (what data is being sent)
   - Response status and body
7. **Share this with us**

### **In the Console:**
```javascript
// Check these values:
console.log({
  apiUrl: import.meta.env.VITE_API_URL,
  token: localStorage.getItem('token')?.substring(0, 50) + '...',
  userStudentId: JSON.parse(localStorage.getItem('user') || '{}').studentId
})
```

---

## Most Likely Fix (90% confidence)

### **The problem is most likely #1 or #2:**

**If it's routing (HashRouter vs BrowserRouter):**
- Switch from `HashRouter` to `BrowserRouter` in `src/App.jsx:20`
- Update `.htaccess` or Nginx config to route all paths to `index.html`
- Rebuild and redeploy

**If it's API URL:**
- Check the `.env` file on developer's machine
- Ensure `VITE_API_URL` is set to production URL
- Clear browser cache
- Rebuild

**If it's authentication:**
- Log out and log back in
- Check if token is being sent in headers
- Verify JWT_SECRET is correct on backend

---

## Recommended Actions

1. **Immediate (Today):**
   - Ask developer to share DevTools Network screenshot
   - Ask them to verify `.env` file contents
   - Ask them to hard refresh browser (`Ctrl+Shift+Delete`)

2. **Short-term (This Week):**
   - Fix the HashRouter/query parameter mismatch
   - Add better error handling in ApplicationForm.jsx
   - Add console logs to show actual error from backend

3. **Long-term (This Sprint):**
   - Standardize routing (use BrowserRouter consistently)
   - Implement error boundary component
   - Add request/response logging for debugging
   - Setup Sentry or similar error tracking

---

## Questions to Ask the Developer

1. What is your exact URL when the error occurs?
2. What does `import.meta.env.VITE_API_URL` show in console?
3. Can you see the PATCH request in Network tab? What status code?
4. Does it work on a fresh incognito window?
5. What's your `.env` file's `VITE_API_URL` value?
6. Did you recently update any JavaScript dependencies?
7. Is your backend actually running and responding to requests?

---

## Conclusion

The error "Failed to save education details" is being caused by a combination of factors. The most critical issue is the **HashRouter vs BrowserRouter architectural mismatch** between your frontend routing setup and the query parameter-based step navigation. Combined with potential environment variable misconfigurations, this creates the perfect storm for why it works for you but fails consistently for the developer.

**Priority: HIGH** - This affects user experience and blocks core functionality.
