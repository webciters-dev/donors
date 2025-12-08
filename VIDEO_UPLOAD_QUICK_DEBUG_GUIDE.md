# VIDEO UPLOAD ISSUE - QUICK TEST & DEBUG GUIDE

## 🎯 Quick Summary of Problem & Fix

**Problem:** 25MB+ video uploads fail, but 5-6MB works fine

**Root Cause:** Multer configuration missing field-size limits, causing silent failures on large multipart form data

**Fix Applied:** 
1. ✅ Added fieldSize limit (100MB) to Multer config
2. ✅ Added error handler middleware for Multer errors
3. ✅ Added detailed logging on frontend and backend
4. ✅ Improved error messages shown to user

---

## 🧪 IMMEDIATE TESTING

### Step 1: Create Test Video Files (Sizes 5MB to 100MB)

```bash
# Create a 5MB test video (should already work)
ffmpeg -f lavfi -i color=c=blue:s=320x240:d=1 -f lavfi -i sine=f=1000:d=1 test_5mb.mp4

# Create a 25MB test video (was failing, should now work)
ffmpeg -f lavfi -i color=c=red:s=640x480:d=5 -f lavfi -i sine=f=1000:d=5 test_25mb.mp4

# Create a 50MB test video (may timeout on slow connection)
ffmpeg -f lavfi -i color=c=green:s=1280x720:d=10 -f lavfi -i sine=f=1000:d=10 test_50mb.mp4

# Create a 100MB test video (maximum allowed size)
ffmpeg -f lavfi -i color=c=yellow:s=1920x1080:d=20 -f lavfi -i sine=f=1000:d=20 test_100mb.mp4
```

Or use any existing video files you have.

---

### Step 2: Test Upload with Browser DevTools Open

**Setup:**
1. Open browser DevTools (F12)
2. Go to Console tab
3. Go to Network tab (have both visible)
4. Navigate to student application profile page

**Test Sequence:**

#### Test 2a: Upload 5MB Video
1. Click "Upload Video"
2. Select `test_5mb.mp4`
3. Watch Network tab:
   - Should see POST to `/api/videos/upload-intro`
   - Status: 200 OK ✅
4. Watch Console:
   - Should see: `✅ Video upload successful: {...}`
5. Watch Toast:
   - Should show: "Video uploaded successfully!"

**Expected Result:** ✅ Success

---

#### Test 2b: Upload 25MB Video
1. Click "Upload Video"
2. Select `test_25mb.mp4`
3. Watch Network tab:
   - Should see POST to `/api/videos/upload-intro`
   - Status: 200 OK ✅ (was failing before fix)
4. Watch Console:
   - Should see: `✅ Video upload successful: {...}` (NEW - showing detailed success)
5. Watch Toast:
   - Should show: "Video uploaded successfully!" (was showing "removed video" before)

**Expected Result:** ✅ Success (previously failed, now works)

---

#### Test 2c: Upload 100MB Video
1. Click "Upload Video"
2. Select `test_100mb.mp4`
3. Watch Network tab:
   - Should see POST in progress for a while
   - Status depends on connection:
     - Fast connection: 200 OK ✅
     - Slow connection: Timeout or error
4. Watch Console for errors if any
5. Watch Toast for messages

**Expected Result:** 
- Fast network: ✅ Success
- Slow network: ⚠️ Timeout (normal for slow connection)

---

#### Test 2d: Upload 150MB Video (Over Limit)
1. Try to select `test_150mb.mp4` (if you create one larger than 100MB)
2. Should get error: "File too large. Maximum size is 100MB"

**Expected Result:** ❌ Proper error message

---

### Step 3: Check Console Logs

**In Browser Console (F12 → Console tab):**

Looking for successful upload:
```
✅ Video upload successful: {
  url: "uploads/videos/...",
  thumbnailUrl: "uploads/videos/...",
  duration: 5,
  uploadedAt: "2025-12-07T..."
}
```

Looking for error:
```
🎥 XHR Upload Error: {
  status: 413,
  statusText: "Payload Too Large",
  response: "Form field too large..."
}
```

Or:
```
🎥 XHR Upload Error: {
  status: 0,
  statusText: "timeout",
  responseText: ""
}
```

---

### Step 4: Check Server Logs

**If running locally (npm run dev):**
```
Terminal showing server logs
Look for: 🎥 Video Upload Attempt:
```

Example:
```
🎥 Video Upload Attempt: {
  studentId: 'student-uuid',
  studentRole: 'STUDENT',
  fileReceived: true,
  fileName: 'test_25mb.mp4',
  fileSize: 26214400,
  fileSizeMB: '25.00MB',
  contentType: 'video/mp4',
  duration: 5
}
```

Or if error:
```
❌ Video upload error: {
  message: 'File too large',
  code: 'LIMIT_FILE_SIZE',
  statusCode: 413,
  stack: '...'
}
```

**If running on VPS (PM2):**
```bash
pm2 logs
# or
pm2 logs [app-name]

# Look for: 🎥 Video Upload Attempt
```

---

## 🐛 TROUBLESHOOTING

### Issue: Still Getting "removed video" on 25MB

**Step 1: Check Browser Console**
```
F12 → Console
Upload 25MB video
Look for error logs: 🎥 XHR Upload Error
```

**If you see:**
```
status: 413
statusText: "Payload Too Large"
response: "Form field too large"
```
→ Multer field limit still too low (shouldn't happen - check code was updated)

**If you see:**
```
status: 0
statusText: "timeout"
```
→ Upload taking too long, network is too slow
→ Test with smaller file or faster network

**If you see:**
```
status: 500
response: "Failed to process video..."
```
→ Server error during processing
→ Check server logs with: `npm run dev` or `pm2 logs`

---

### Issue: Upload Works but Takes 5+ Minutes

**Cause:** Slow network connection

**Network Speed Calculation:**
```
Upload time (seconds) = File size (MB) × 8 ÷ Speed (Mbps)

Example:
25MB × 8 ÷ 0.25 Mbps (256kbps) = 800 seconds (13+ minutes!) ❌
25MB × 8 ÷ 1 Mbps = 200 seconds (3+ minutes) ⚠️
25MB × 8 ÷ 5 Mbps = 40 seconds ✅
```

**Solution:**
1. Use faster network (WiFi instead of mobile, broadband instead of satellite)
2. Reduce file size (record video at lower bitrate)
3. Implement chunked upload (future enhancement)

---

### Issue: Upload Fails with HTTP 413 "Payload Too Large"

**Cause:** Likely behind reverse proxy with strict size limits (Nginx, Apache, etc.)

**Check if on VPS/Production:**
```bash
# Check Nginx config
sudo grep -r "client_max_body_size" /etc/nginx/

# Check Apache config
sudo grep -r "LimitRequestBody" /etc/apache2/

# Should have:
# Nginx: client_max_body_size 100M;
# Apache: LimitRequestBody 104857600 (100MB)
```

**If not set or too low, ask your host to increase it.**

---

### Issue: Can See Console Logs Now (Great!) But Still Failing

**Collect Information:**
1. **Screenshot of browser console error** (the 🎥 XHR Upload Error)
2. **Screenshot of server logs** (the ❌ Video upload error)
3. **File size being uploaded** (from console: fileSizeMB)
4. **Network speed** (from speedtest.net)

**Then:**
1. Check VIDEO_UPLOAD_SIZE_ISSUE_DEEP_DIVE.md (Section 3: Diagnostic Steps)
2. Follow Step 7 if behind proxy/VPS

---

## ✅ SUCCESS CHECKLIST

After fixes, you should be able to:

- [ ] Upload 5MB video → Success in <30 seconds
- [ ] Upload 25MB video → Success in <5 minutes
- [ ] Upload 50MB video → Success or timeout (depends on network)
- [ ] Upload 100MB video → Success or timeout (depends on network)
- [ ] Upload 150MB video → Proper error message: "File too large"
- [ ] See detailed success message in console: `✅ Video upload successful`
- [ ] See detailed error info in console if something fails
- [ ] Check server logs see upload details: `🎥 Video Upload Attempt`

---

## 📊 PERFORMANCE METRICS

Track these to understand your connection:

| Metric | Command | Expected |
|--------|---------|----------|
| Upload Speed | speedtest.net | ≥1 Mbps for 25MB in 5 min |
| Server Response | Browser console | ✅ 200 OK or 413/timeout |
| Backend Processing | Server logs | Should have `🎥 Video Upload Attempt` log |
| Database Save | Console success message | Should appear within timeout window |

---

## 🚀 NEXT STEPS IF STILL FAILING

1. **Provide server logs** when upload fails
   ```bash
   npm run dev  # copy terminal output when uploading
   ```

2. **Provide browser console error**
   ```
   F12 → Console → Copy the 🎥 XHR Upload Error object
   ```

3. **Check infrastructure settings** if on VPS
   - Nginx timeout: should be ≥300 seconds
   - Client max body size: should be ≥100MB
   - Load balancer: should have ≥300 second timeout

4. **Implement chunked upload** (if network is fundamentally slow)
   - Splits 100MB into 10 × 10MB chunks
   - More resilient to network interruptions
   - Requires frontend and backend implementation

---

## 💡 KEY INSIGHTS

**Why 5-6MB works but 25MB+ fails:**
- 5MB takes ~40-50 seconds → completes quickly ✅
- 25MB takes ~200+ seconds → may hit various timeouts ❌
- Each layer (client, proxy, server) may have different timeouts

**What we fixed:**
- Multer configuration (backend)
- Error handling (backend)
- Error logging (backend)
- Error logging (frontend)
- Error display (frontend)

**What we didn't fix:**
- Network speed (that's your ISP)
- Proxy timeouts (need server admin)
- Browser memory limits (varies by device)

---

## 📞 SUPPORT

If upload still fails after testing:

1. Collect all diagnostic info above
2. Check VIDEO_UPLOAD_SIZE_ISSUE_DEEP_DIVE.md for detailed analysis
3. Share:
   - Browser console error screenshot
   - Server log errors
   - File size and network speed
   - Whether on local dev or production VPS
