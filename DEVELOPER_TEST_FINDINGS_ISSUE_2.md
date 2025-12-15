# Developer Test Findings - ISSUE #2: reCAPTCHA Verification Failed on Student Reply

## Issue Description
**When a student tries to send a reply from the "Reply to Admin" section on the Application Status page, they get a reCAPTCHA verification error.**

The developer reports:
- Student clicks "Reply to Admin"
- Enters their message
- Clicks "Send Reply"  
- Error appears: "reCAPTCHA verification failed - invalid action"

---

## Root Cause Analysis

### The Flow:

1. **Frontend** (`MyApplication.jsx`, line 237-299):
   - User types reply message
   - Calls `sendReply(executeRecaptcha)` function
   - Generates reCAPTCHA token: `await executeRecaptcha('sendReply')` ← **PROBLEM HERE**
   - Sends to `/api/messages` POST endpoint with token

2. **Backend** (`messages.js`, line 71):
   - Endpoint decorated with `requireBasicRecaptcha` middleware
   - Calls `verifyRecaptchaToken(token, clientIP)`
   - Google reCAPTCHA API returns: `{ success: true, action: "sendReply", score: 0.9, ... }`

3. **Verification Check** (`recaptcha.js`, line 153-158):
```javascript
if (result.action && !allowedActions.includes(result.action)) {
  console.warn(`reCAPTCHA invalid action: ${result.action}`);
  return res.status(400).json({ 
    error: 'reCAPTCHA verification failed - invalid action',
    code: 'RECAPTCHA_INVALID_ACTION'
  });
}
```

### The Bug:

The frontend sends action: `'sendReply'`

But the `requireBasicRecaptcha` middleware only allows these actions:
```javascript
allowedActions: ['submit', 'register', 'login', 'reset', 'form', 'createCaseWorker']
```

❌ `'sendReply'` is **NOT** in the allowed list!

---

## Why It Fails:

1. Frontend generates token with action: `'sendReply'`
2. Google returns verification with: `action: 'sendReply'`
3. Backend checks: Is `'sendReply'` in allowed list?
4. Allowed list: `['submit', 'register', 'login', 'reset', 'form', 'createCaseWorker']`
5. ❌ NOT FOUND → Error: "invalid action"

---

## Solution

### FIX: Add 'sendReply' to Allowed Actions List

**File**: `server/src/middleware/recaptcha.js` (Line 181-189)

**Current Code:**
```javascript
export const requireBasicRecaptcha = requireRecaptcha({
  minScore: 0.3,
  allowedActions: ['submit', 'register', 'login', 'reset', 'form', 'createCaseWorker'],
  skipOnMissing: true
});
```

**Fixed Code:**
```javascript
export const requireBasicRecaptcha = requireRecaptcha({
  minScore: 0.3,
  allowedActions: [
    'submit', 
    'register', 
    'login', 
    'reset', 
    'form', 
    'createCaseWorker',
    'sendReply',        // ← ADD THIS
    'sendMessage'       // ← ADD THIS (for consistency)
  ],
  skipOnMissing: true
});
```

---

## Also Check These Actions Used by Frontend:

Search the codebase for `executeRecaptcha(` to find all actions being used:

```
src/pages/MyApplication.jsx:237 → executeRecaptcha('sendReply')
src/pages/ApplicationForm.jsx:424 → executeRecaptcha('registerStudent') 
src/pages/AdminOfficers.jsx:44 → executeRecaptcha('createCaseWorker')
src/pages/AdminApplicationDetail.jsx:? → executeRecaptcha(??)  // Check if used
```

### List of All Frontend Actions That Need to Be Allowed:

1. ✅ `'submit'` - Application submission (already allowed)
2. ✅ `'register'` - Student registration (already allowed)
3. ✅ `'login'` - User login (already allowed)
4. ✅ `'reset'` - Password reset (already allowed)
5. ✅ `'form'` - Generic form action (already allowed)
6. ✅ `'createCaseWorker'` - Create case worker (already allowed)
7. ❌ `'sendReply'` - Student reply to admin (MISSING - PRIORITY)
8. ❌ `'sendMessage'` - General messaging (MISSING)
9. ? `'registerStudent'` - Check if actually sent from frontend

---

## Testing After Fix:

1. **Setup:**
   - Make sure admin has sent a message to student
   - Student should see "Reply to Admin" section

2. **Test Scenario:**
   - [ ] Student logs in
   - [ ] Go to "My Application" / "Application Status"
   - [ ] Scroll to "Reply to Admin" section
   - [ ] Type a test message
   - [ ] Click "Send Reply"
   - [ ] Message should send successfully ✅
   - [ ] No error message
   - [ ] Message appears in conversation thread

3. **Verify in Browser Console:**
   - [ ] No reCAPTCHA errors
   - [ ] Network tab shows POST /api/messages returns 201 Created

---

## Additional Recommendations:

### RECOMMENDATION 1: Make Action Names Consistent
Consider standardizing action names across frontend:

```javascript
// Instead of mixing 'sendReply' and 'sendMessage'
// Use: 'sendMessage' everywhere

// In MyApplication.jsx:
executeRecaptcha('sendMessage')  // instead of 'sendReply'

// In messages.js backend:
// Expects: 'sendMessage'
```

### RECOMMENDATION 2: Add a reCAPTCHA Bypass for Testing
The developer needs to test frequently. The bypass already exists:

```javascript
// In recaptcha.js line 21-29
if (isDevelopment && token === 'development-bypass-token') {
  return { success: true, score: 0.9, ... };
}
```

To use in testing:
1. Set `DEVELOPMENT_MODE=true` in `.env`
2. Frontend can send `recaptchaToken: 'development-bypass-token'`
3. Backend will skip Google API call

### RECOMMENDATION 3: Better Error Messages
When reCAPTCHA fails, show user-friendly message in UI:

```javascript
// Instead of generic "reCAPTCHA verification failed"
// Show specific errors:

if (errorCode === 'RECAPTCHA_INVALID_ACTION') {
  toast.error("Invalid reCAPTCHA action. Please refresh and try again.");
}

if (errorCode === 'RECAPTCHA_LOW_SCORE') {
  toast.error("Verification failed. Please try again later.");
}

if (errorCode === 'RECAPTCHA_MISSING') {
  toast.error("reCAPTCHA verification required. Please enable JavaScript.");
}
```

---

## Implementation Steps:

1. Open `server/src/middleware/recaptcha.js`
2. Find line ~186 (requireBasicRecaptcha definition)
3. Add `'sendReply'` and `'sendMessage'` to `allowedActions` array
4. Restart server: `npm run dev`
5. Test the student reply flow
6. Verify POST /api/messages returns 201 Created

---

## Expected Behavior After Fix:

✅ Student clicks "Reply to Admin"
✅ Types message
✅ Clicks "Send Reply"
✅ reCAPTCHA token generated with action: 'sendReply'
✅ Backend verifies token successfully
✅ Action 'sendReply' found in allowed list ← THIS WAS MISSING
✅ Message POST to /api/messages succeeds (201 Created)
✅ Success toast: "Reply sent successfully!"
✅ Message appears in conversation thread
✅ No error notification

