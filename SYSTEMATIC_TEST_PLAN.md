# Systematic End-to-End Testing Plan

## Goal
Reproduce the exact issues reported and identify root causes before making fixes.

---

## Test Environment Setup

**Local Machine Testing:**
- Start backend: `npm run dev` (or PM2)
- Start frontend: `npm run dev` (Vite)
- Clear browser cache before each test
- Use Chrome DevTools for debugging

---

## Issue #1: Photo Vanishing After Login/Logout

### Test Scenario: Complete Photo Lifecycle

**Prerequisite Setup:**
```bash
# Terminal 1: Backend
cd c:\projects\donor
npm run dev

# Terminal 2: Frontend (new terminal)
cd c:\projects\donor
npm run dev
```

### Step 1: Register New Student Account
1. Open browser: `http://localhost:5173`
2. Click "Register as Student"
3. Fill form:
   - Email: `testphoto@test.com`
   - Password: `TestPass123!`
   - Complete reCAPTCHA
4. Submit
5. **Verify:** Registration successful, redirected to StudentProfile

### Step 2: Upload Non-PNG Photo
1. On StudentProfile page
2. Upload photo (use WebP or PNG format, NOT JPG)
   - Can use any image file, just ensure it's NOT JPG
   - Example: `test-image.webp` or `test-image.png`
3. **Verify:** Photo displays in the "Current Photo" section
4. **Important:** Open DevTools (F12) → Network tab
   - Look for photo request: Should see request to `/uploads/photos/...`
   - Check response: Should be image data
   - Check Content-Type header: Should be `image/jpeg`
5. **Record:** Photo URL shown in Network tab (e.g., `http://localhost:3001/uploads/photos/student-photo-1703068145293-5671.jpg`)

### Step 3: Refresh Page (First Refresh)
1. Press F5 or Ctrl+R (normal refresh, not hard refresh)
2. **Expected:** Photo should still display
3. **DevTools:** Check if new request is made to load photo
4. **Verify:** Photo displays correctly

### Step 4: Hard Refresh (Clear Cache)
1. Press Ctrl+Shift+R (hard refresh - clears cache)
2. **Expected:** Photo should still display
3. **DevTools:** Observe network requests
4. **Verify:** Photo displays after hard refresh

### Step 5: Logout
1. Click logout button
2. Wait for redirect to login page
3. **Verify:** Logged out successfully

### Step 6: Login Again (THE CRITICAL TEST)
1. Click "Login as Student"
2. Enter:
   - Email: `testphoto@test.com`
   - Password: `TestPass123!`
3. Submit
4. **CRITICAL OBSERVATION:**
   - Does photo display? YES/NO
   - If NO: This is where it vanishes
5. **DevTools:** Check:
   - Network tab for photo requests
   - Any 404 errors?
   - What URL was requested?
   - What was the response?
6. **Record findings:**
   - Photo visible: YES/NO
   - If NO, copy exact error from DevTools

### Step 7: Refresh After Login
1. Press F5
2. **Expected:** Photo should display (or stay vanished if already vanished)
3. **Verify:** Behavior consistent

### Step 8: Hard Refresh After Login
1. Press Ctrl+Shift+R
2. **Expected:** Photo should display (or stay vanished if already vanished)
3. **Verify:** Behavior consistent

---

## Issue #2: Video Duration Warning Toast

### Test Scenario: Video Upload with Different Durations

**Prerequisite:** Logged in as student from Issue #1 test

### Step 1: Prepare Test Videos
Need 3 test videos:
1. **Short video:** 45 seconds (within 30-120 range, below 60-90 recommendation)
2. **Perfect video:** 75 seconds (within 60-90 recommendation)
3. **Long video:** 110 seconds (within 30-120 range, above 60-90 recommendation)

**How to create test videos:**
```bash
# Using FFmpeg (if available)
ffmpeg -f lavfi -i color=c=blue:s=320x240:d=45 -f lavfi -i sine=f=440:d=45 video-45sec.mp4
ffmpeg -f lavfi -i color=c=green:s=320x240:d=75 -f lavfi -i sine=f=440:d=75 video-75sec.mp4
ffmpeg -f lavfi -i color=c=red:s=320x240:d=110 -f lavfi -i sine=f=440:d=110 video-110sec.mp4
```

### Step 2: Upload 45-Second Video
1. On StudentProfile page
2. Upload `video-45sec.mp4`
3. **OBSERVATION:**
   - What toast messages appear?
   - WHEN do they appear (during upload or after)?
   - What exactly does the toast say?
4. **Record:** Exact toast message and timing

### Step 3: Wait for Upload to Complete
1. Wait for "Video uploaded successfully" message
2. **Observe:** All toasts that appeared
3. **Record:** Sequence of toasts

### Step 4: Upload 75-Second Video
1. Replace video with `video-75sec.mp4`
2. **Repeat observations from Step 2-3**
3. **Record:** Toast sequence

### Step 5: Upload 110-Second Video
1. Replace video with `video-110sec.mp4`
2. **Repeat observations from Step 2-3**
3. **Record:** Toast sequence

### Step 6: Analyze Toast Patterns
- Are warnings shown DURING upload or AFTER?
- For 45-sec video: What message appears?
- For 75-sec video: What message appears?
- For 110-sec video: What message appears?

---

## Data Collection

### For Issue #1 (Photo):
| Step | Expected | Actual | DevTools Finding | Status |
|------|----------|--------|------------------|--------|
| Upload photo | Displays | ? | URL: ? | ? |
| Refresh page | Displays | ? | 404? | ? |
| Logout | - | OK | - | ? |
| Login again | Displays | ? | URL: ? | ✅/❌ |
| After hard refresh | Displays | ? | URL: ? | ? |

### For Issue #2 (Video):
| Video | Duration | Toast #1 | Toast #1 Timing | Toast #2 | Toast #2 Timing | Status |
|-------|----------|----------|-----------------|----------|-----------------|--------|
| 45-sec | 45s | ? | During/After | ? | During/After | ? |
| 75-sec | 75s | ? | During/After | ? | During/After | ? |
| 110-sec | 110s | ? | During/After | ? | During/After | ? |

---

## Root Cause Hypotheses

### Photo Issue - Possibilities:
1. **URL Construction Bug:** Component builds wrong URL format
2. **Browser Cache Issue:** Cache prevents reload with new photoUrl
3. **Authentication Issue:** After login, photo endpoint requires different headers
4. **Database Issue:** photoUrl not being returned by `/api/students/me` after login
5. **Static Serving Issue:** Express.static not configured correctly for `/uploads`

### Video Issue - Possibilities:
1. **Toast Called Too Early:** Warning triggered before upload completes
2. **Multiple Toast Calls:** Both warning AND success shown
3. **Incorrect Duration:** Duration check happens at wrong time
4. **Toast Library Issue:** Multiple toasts stacking unexpectedly

---

## Next Steps After Testing

1. **Collect exact data** from both tests
2. **Identify root cause** based on findings
3. **Make targeted fix** only to the problematic code
4. **Re-test** to verify fix works
5. **Deploy** only after verification

