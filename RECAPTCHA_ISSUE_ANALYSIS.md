# 🔴 reCAPTCHA "Security verification failed" Issue - ROOT CAUSE ANALYSIS

## Issue Screenshot
**URL:** `aircrew.nl/#/apply`
**Error:** "Security verification failed. Please try again."

---

## ROOT CAUSE IDENTIFIED ✅

### Problem: Missing `VITE_RECAPTCHA_SITE_KEY` in Production Frontend Config

**Current State:**
```
/.env.production (WRONG)
├── VITE_API_URL=https://aircrew.nl
└── ❌ MISSING: VITE_RECAPTCHA_SITE_KEY
```

**Required State:**
```
/.env.production (CORRECT)
├── VITE_API_URL=https://aircrew.nl
└── ✅ VITE_RECAPTCHA_SITE_KEY=6LfaDQosAAAAAKt69ylVQkfo5Qa8jhEIRsCSfSkX
```

---

## Technical Breakdown

### 1. Frontend Issue (RecaptchaProtection.jsx)

**Line 6:**
```javascript
const siteKey = import.meta.env.VITE_RECAPTCHA_SITE_KEY;
```

**Current Behavior:**
- Reads `VITE_RECAPTCHA_SITE_KEY` from `.env.production`
- Since the key is **MISSING**, `siteKey` is `undefined`
- The reCAPTCHA script cannot load without a valid site key
- Frontend renders but cannot execute reCAPTCHA
- User sees "Security verification failed" when form submission attempts verification

**The Complete Flow:**

```
User clicks "Create Account & Continue"
        ↓
ApplicationForm.jsx calls executeRecaptcha()
        ↓
RecaptchaProtection.jsx line 61-72 attempts:
    const token = await window.grecaptcha.execute(siteKey, { action });
        ↓
❌ FAILS because:
   - siteKey is undefined (missing from .env.production)
   - window.grecaptcha.execute() receives undefined
   - Google's API rejects the request
        ↓
Error caught in ApplicationForm.jsx line 414-415:
    console.error('reCAPTCHA failed:', recaptchaError)
        ↓
User sees: "Security verification failed. Please try again."
```

### 2. Backend Configuration (Correct)

**server/.env.production (Lines 29-30):**
```
# reCAPTCHA Configuration
RECAPTCHA_SECRET_KEY=6LfaDQosAAAAAG2fpvIHWRc8Fqq479lpL1_-OsW0
```

**Status:** ✅ **CORRECT** - Secret key is present and properly configured for backend verification

**How it's used (server/src/middleware/recaptcha.js):**
- Line 3: `const RECAPTCHA_SECRET_KEY = process.env.RECAPTCHA_SECRET_KEY;`
- Line 35: Sends to Google's API for verification
- Backend is ready to verify tokens IF they arrive

**The Problem:** Backend never receives tokens because frontend can't generate them (missing site key)

### 3. Key Pair Mismatch Explanation

Google reCAPTCHA requires a key pair:

| Key Type | Purpose | Current Status | Location |
|----------|---------|-----------------|----------|
| **Site Key** (Public) | Frontend JavaScript to request tokens | ❌ MISSING | Should be in `/.env.production` |
| **Secret Key** (Private) | Backend verification with Google | ✅ PRESENT | `server/.env.production` |

**The Correct Pair:**
- **Site Key:** `6LfaDQosAAAAAKt69ylVQkfo5Qa8jhEIRsCSfSkX`
- **Secret Key:** `6LfaDQosAAAAAG2fpvIHWRc8Fqq479lpL1_-OsW0`

---

## Solution: Add Missing Frontend Site Key

### Fix #1: Update `/.env.production`

**Add this line:**
```dotenv
VITE_API_URL=https://aircrew.nl
VITE_RECAPTCHA_SITE_KEY=6LfaDQosAAAAAKt69ylVQkfo5Qa8jhEIRsCSfSkX
```

### Fix #2: Rebuild Frontend

After updating `.env.production`, the frontend must be rebuilt:

```bash
npm run build
```

This ensures Vite injects the `VITE_RECAPTCHA_SITE_KEY` into the production build.

### Fix #3: Deploy Updated Build

Copy the rebuilt dist folder to the VPS nginx directory:

```bash
# On VPS
cd ~/projects/donors
npm run build
sudo cp -r dist/* /var/www/aircrew.nl/
sudo nginx -s reload
```

---

## Verification Checklist

After applying the fix:

1. **Check Frontend Config:**
   ```bash
   cat /.env.production | grep VITE_RECAPTCHA
   ```
   Expected output: `VITE_RECAPTCHA_SITE_KEY=6LfaDQosAAAAAKt69ylVQkfo5Qa8jhEIRsCSfSkX`

2. **Check Backend Config:**
   ```bash
   cat server/.env.production | grep RECAPTCHA_SECRET_KEY
   ```
   Expected output: `RECAPTCHA_SECRET_KEY=6LfaDQosAAAAAG2fpvIHWRc8Fqq479lpL1_-OsW0`

3. **Verify Build Process:**
   ```bash
   npm run build
   # Look for: "✓ built in X.XXs" (should complete successfully)
   ```

4. **Test on Production:**
   - Visit `https://aircrew.nl/#/apply`
   - Click "Create Account & Continue"
   - reCAPTCHA should verify without error
   - Form submission should succeed

---

## Why This Happened

The `.env.production` file in the **project root** only had `VITE_API_URL`. This is the frontend environment configuration used by Vite during build time.

The reCAPTCHA site key is needed at **build time** to be embedded into the frontend JavaScript bundle, unlike the backend secret key which is used at **runtime** by Node.js.

**Key Difference:**
- **Frontend keys** (VITE_*) → Injected during build → Hard-coded into JavaScript
- **Backend keys** (Server .env) → Read at runtime → Loaded from Node.js process

---

## Additional Notes

### reCAPTCHA v3 Implementation
The application uses **Google reCAPTCHA v3**, which is invisible to users. The flow is:

1. **Frontend** generates a reCAPTCHA token (requires site key)
2. **Frontend** sends token with form data to backend
3. **Backend** verifies token with Google (requires secret key)
4. **Backend** allows form submission only if reCAPTCHA score > 0.5

With the missing site key, step 1 fails, preventing the entire flow.

### Current reCAPTCHA Keys
These keys are associated with `aircrew.nl` domain and were previously configured in the project. They are safe to redeploy and are already in use on the VPS.

