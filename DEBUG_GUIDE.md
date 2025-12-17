# Step-by-Step Debugging Guide

## Before Starting Tests

### Prerequisites
1. **Backend running:** `npm run dev` or `npm start`
2. **Frontend running:** `npm run dev` (in separate terminal)
3. **DevTools open:** F12 in Chrome
4. **Clear browser data:** Settings → Privacy → Clear browsing data → All time

---

## Test Execution Instructions

### Phase 1: Photo Upload Test

**Time to complete:** ~10 minutes

```
1. Go to http://localhost:5173
2. Register new student (testphoto@test.com)
3. In StudentProfile page:
   - Find "Upload Photo" section
   - Select a PNG or WebP file (NOT JPG)
   - Click upload
   - Wait for success message
   
4. CHECK POINT #1:
   - Can you see the photo displayed?
   - Look at browser console (F12)
   - Look at Network tab
   - What photo URL is shown in Network requests?
   
5. Refresh page (F5)
   - Photo still there?
   
6. Hard refresh (Ctrl+Shift+R)
   - Photo still there?
   - Check Network tab for photo request
   - Is there a 404 error?
   
7. Logout (click logout button)

8. Login again (testphoto@test.com / TestPass123!)

9. CHECK POINT #2 - THIS IS THE CRITICAL ONE:
   - Photo visible after login? YES/NO
   - If NO: This is the bug!
   - In DevTools Network tab:
     - Look for requests to /uploads/photos/...
     - Check the response: Is it image data or HTML error?
     - Copy the exact URL from the request
     - Copy any error messages
```

**What to document:**
- Photo URL format at each step
- Any 404 errors
- Any console errors
- When photo disappears (if it does)

### Phase 2: Video Upload Test

**Time to complete:** ~15 minutes

You need test videos. If you don't have them, use this quick method:

```
Option 1: Use any existing video file, then trim it:
- Open any video in VLC
- Tools → Crop (or similar)
- Save as video-45sec.mp4, video-75sec.mp4, video-110sec.mp4

Option 2: Use online converter to create test files

Option 3: Use dummy files:
ffmpeg -f lavfi -i color=c=blue:s=320x240:d=45 -f lavfi -i sine=440:d=45 video-45sec.mp4
```

**Test execution:**
```
1. Logged in as student

2. Find "Video Upload" section

3. Upload video-45sec.mp4
   - WATCH the screen carefully
   - RECORD every toast message that appears
   - RECORD WHEN it appears (during upload or after)
   - Example: 
     * "Uploading..." (immediately)
     * "Video is shorter than recommended..." (when?)
     * "Video uploaded successfully!" (when?)

4. Upload video-75sec.mp4
   - Repeat observation
   - Record toast sequence

5. Upload video-110sec.mp4
   - Repeat observation
   - Record toast sequence
```

**What to document:**
- Toast messages in order
- Exact wording
- When each appeared (during upload or after)

---

## Reporting Template

After completing tests, fill out this template:

```
### Photo Issue Test Results

**Photo Upload:**
- File type uploaded: [PNG/WebP/other]
- Photo displayed after upload: YES/NO
- Photo URL in DevTools: [copy exact URL]
- Response Content-Type: [image/jpeg or other]

**After Page Refresh:**
- Photo still visible: YES/NO

**After Hard Refresh:**
- Photo still visible: YES/NO

**After Logout/Login:**
- Photo visible: YES/NO
- Network request for photo: YES/NO
- 404 error: YES/NO
- Error message (if any): [copy console error]

**Hypothesis:**
[Based on findings, what do you think is the cause?]


### Video Upload Test Results

**45-second video:**
- Toast #1: "[message]" - Appeared during: upload/after upload
- Toast #2: "[message]" - Appeared during: upload/after upload
- Total toasts: [number]

**75-second video:**
- Toast #1: "[message]" - Appeared during: upload/after upload
- Toast #2: "[message]" - Appeared during: upload/after upload
- Total toasts: [number]

**110-second video:**
- Toast #1: "[message]" - Appeared during: upload/after upload
- Toast #2: "[message]" - Appeared during: upload/after upload
- Total toasts: [number]

**Hypothesis:**
[Based on findings, what do you think is the cause?]
```

---

## Important Notes

1. **Don't skip DevTools:** The Network tab is crucial for finding the photo issue
2. **Screenshot everything:** Take screenshots of:
   - Photo displayed/not displayed
   - Network requests
   - Console errors
   - Each toast message
3. **Be precise:** "It doesn't work" is not useful - we need exact details
4. **Take your time:** This testing will take 20-30 minutes, but it will give us the exact root cause

---

## After Testing

Once you complete the tests:
1. Share the filled-out reporting template
2. Share any screenshots
3. I will identify the exact root cause
4. I will make a surgical fix to only that code
5. We test again to verify the fix works
6. Only THEN do we deploy

This is the systematic approach that should have been done from the start.

