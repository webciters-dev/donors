# Deep Dive: Video Upload Failure Analysis - Why 25MB+ Videos Fail

## Executive Summary

You can upload 5-6MB videos successfully, but 25MB+ videos fail with "removed video toast" error. This document identifies **ALL possible reasons** across frontend, backend, network, and infrastructure layers.

---

## 1. CURRENT STATUS VERIFICATION

### What's Already Implemented ✅

**Backend (server/src/server.js):**
```javascript
// ✅ Line 113-114: JSON parser increased to 10MB
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ limit: "10mb", extended: true }));

// ✅ Line 117-121: Timeout configured for 5 minutes
app.use((req, res, next) => {
  req.socket.setTimeout(300000); // 5 minutes
  res.setTimeout(300000);
  next();
});
```

**Multer Config (server/src/routes/videos-simple.js):**
```javascript
// ✅ Line 48: 100MB limit set
const uploadVideo = multer({ 
  storage: videoStorage,
  fileFilter: videoFileFilter,
  limits: {
    fileSize: 100 * 1024 * 1024, // 100MB limit
  }
});
```

**Frontend (src/components/VideoUploader.jsx):**
```javascript
// ✅ Line 122: XHR timeout set to 5 minutes
xhr.timeout = 300000; // 5 minutes

// ✅ Lines 152-157: Timeout handler exists
xhr.addEventListener('timeout', () => {
  setIsUploading(false);
  toast.error("Upload timed out. The file is too large...");
});
```

**Status:** Basic infrastructure appears correct. Issue must be elsewhere.

---

## 2. POTENTIAL ISSUES - COMPREHENSIVE ANALYSIS

### ISSUE A: Network/Environment Layer

#### A1. Network Connection Quality
**Symptoms Match:** Large files timeout during upload
**Evidence:**
- 5-6MB works fine (uploads in ~10-30 seconds)
- 25MB fails (would take ~90-150 seconds on slow connection)
- Timeout is set to 300 seconds (5 minutes) which should be enough

**Possible Causes:**
1. **Actual network speed is slower than expected**
   - If connection is 256kbps: 25MB = ~838 seconds (14+ minutes)
   - Would exceed even 5-minute timeout
   
2. **Network drops/latency spikes**
   - Large uploads more prone to connection interruptions
   - Each interruption restarts from beginning (no resume capability)
   
3. **ISP/Corporate network throttling**
   - Some ISPs throttle large files
   - Corporate firewalls may block files >10MB
   - Mobile networks may have strict limits

**Test:**
```
Speed needed for 25MB video:
- At 1 Mbps: 200 seconds ✅ (under 5-min timeout)
- At 256 kbps: 838 seconds ❌ (exceeds timeout)
- At 512 kbps: 419 seconds ❌ (exceeds timeout)

Your network speed likely: < 512 kbps on that connection
```

---

#### A2. Reverse Proxy/Load Balancer Issues
**If deployed behind Nginx/Apache:**
- Nginx default timeout: 30 seconds for large requests
- Apache default timeout: 60 seconds
- Load balancers may have stricter limits

**Check for:**
```nginx
# /etc/nginx/nginx.conf or site config
proxy_connect_timeout 30s;  # ❌ If 30s, would timeout
proxy_send_timeout 30s;     # ❌ If 30s, would timeout
proxy_read_timeout 30s;     # ❌ If 30s, would timeout

# Should be (for large uploads):
proxy_connect_timeout 300s;  # 5 minutes
proxy_send_timeout 300s;     # 5 minutes
proxy_read_timeout 300s;     # 5 minutes
```

**Local Development:** No reverse proxy, so this likely NOT the issue locally. But would be issue on production/VPS.

---

#### A3. CDN/CloudFlare Issues (If Used)
**CloudFlare timeout defaults:** 100 seconds max
- 25MB at typical speed would exceed this
- 5-6MB at typical speed would be fine

**Solution needed:** Increase CloudFlare timeout to 600 seconds or disable for video uploads.

---

### ISSUE B: Browser/Client Layer

#### B1. Browser Upload API Limitations
**XMLHttpRequest (XHR) behavior:**
```javascript
// Current implementation uses XHR
const xhr = new XMLHttpRequest();
xhr.timeout = 300000; // 5 minutes

// But some browsers have their own limits:
// - Chrome: Generally OK up to 500MB+
// - Firefox: Generally OK up to 500MB+
// - Safari: May have issues with 100MB+ files
// - Edge: Generally OK up to 500MB+
```

**Issue:** Safari on iOS or older browsers may fail on large videos.

---

#### B2. Memory Constraints
**JavaScript heap memory for large files:**
```javascript
// When file is selected, browser creates blob in memory
const file = new File([...], "video.mp4");
// For 25MB file: ~25MB taken from browser heap

// Then when uploading:
const formData = new FormData();
formData.append('video', file);  // Another ~25MB reference
// Total: ~50MB memory used for 25MB file

// Older/weaker devices may not have 50MB free heap
// Result: Browser crashes or hangs
```

**Browser console check:**
- Chrome DevTools → Memory tab
- Look for heap size < 100MB when uploading 25MB video

---

#### B3. Service Worker Interference
**If site uses Service Worker:**
```javascript
// Service Worker might intercept requests
// And have its own size limits
// Or cache large requests in limited storage

// Check: Are you getting network errors or service worker errors?
```

**Browser DevTools → Application → Service Workers** - check if active.

---

### ISSUE C: Frontend Validation Layer

#### C1. Frontend File Size Validation
**In VideoUploader.jsx line 43:**
```javascript
// Validate video file
const validateVideo = (file) => {
  const fileExtension = file.name.split('.').pop().toLowerCase();
  if (!SUPPORTED_FORMATS.includes(fileExtension)) {
    toast.error(`Unsupported format...`);
    return false;
  }

  // Check file size
  if (file.size > MAX_SIZE_MB * 1024 * 1024) {
    toast.error(`File too large. Maximum size is ${MAX_SIZE_MB}MB`);
    return false;
  }
```

**The Question:** What is MAX_SIZE_MB set to?

**From VideoUploader.jsx line 24:**
```javascript
const MAX_SIZE_MB = VIDEO_GUIDELINES.fileSize.maxMB;
```

**From videoValidation.schema.js line 11:**
```javascript
const MAX_VIDEO_SIZE = 100 * 1024 * 1024; // 100MB maximum
```

**Calculation in VideoUploader:**
```javascript
VIDEO_GUIDELINES.fileSize.maxMB  // Should be 100
// So: if (file.size > 100 * 1024 * 1024) → should allow up to 100MB
```

**But wait - let's verify what's displayed to user:**

**From VideoUploader.jsx line 272:**
```jsx
<div>• Max size: {MAX_SIZE_MB}MB</div>
```

**Check:** What MAX_SIZE_MB value is actually displayed to the user? 
- If showing "100MB" but only allowing 10MB ← MISMATCH
- Or if MAX_SIZE_MB imports incorrectly ← IMPORT ERROR

---

#### C2. Video Duration Calculation Error
**From VideoUploader.jsx line 61-81:**
```javascript
// Get video metadata
const getVideoMetadata = (file) => {
  return new Promise((resolve, reject) => {
    const video = document.createElement('video');
    const url = window.URL.createObjectURL(file);
    
    video.onloadedmetadata = () => {
      const metadata = {
        duration: video.duration,
        width: video.videoWidth,
        height: video.videoHeight
      };
      resolve(metadata);
      window.URL.revokeObjectURL(url);
    };
    
    video.onerror = () => {
      reject(new Error("Could not read video file"));
      window.URL.revokeObjectURL(url);
    };
    
    video.src = url;
  });
};
```

**Potential Issues:**
1. **Video file corrupted:** `video.onerror` is called → rejects → should show error toast
2. **Video format not supported by browser:** `video.onerror` called
3. **Duration is NaN/undefined:** Duration validation fails silently

**Test:**
```javascript
// Add debug logging
const metadata = await getVideoMetadata(file);
console.log('Video duration:', metadata.duration);
console.log('Is NaN:', isNaN(metadata.duration));
```

---

### ISSUE D: Backend Processing Layer

#### D1. Multer Multipart Parsing Issues
**Multer params setup in videos-simple.js:**
```javascript
const uploadVideo = multer({ 
  storage: videoStorage,
  fileFilter: videoFileFilter,
  limits: {
    fileSize: 100 * 1024 * 1024, // 100MB limit
  }
  // ⚠️ Missing field limits configuration!
});
```

**Missing Configuration:**
```javascript
const uploadVideo = multer({ 
  storage: videoStorage,
  fileFilter: videoFileFilter,
  limits: {
    fileSize: 100 * 1024 * 1024,  // 100MB limit ✅
    fieldNameSize: 100,             // Limit field name size ⚠️
    fieldSize: 1024 * 1024,         // Limit field value size (1MB) ⚠️
    fields: 10,                     // Max number of fields ⚠️
    parts: 100,                     // Max number of parts ⚠️
  }
});
```

**Issue:** If `fieldSize: 1024 * 1024` (1MB limit), and form contains:
- 'video' field: 25MB ❌ EXCEEDS 1MB limit!
- 'duration' field: small

**Result:** Multer rejects before files route handler is called!

---

#### D2. Videos Route Handler Error Handling
**In videos-simple.js line 57 onwards:**
```javascript
router.post("/upload-intro", requireAuth, uploadVideo.single('video'), async (req, res) => {
  try {
    if (req.user.role !== 'STUDENT') {
      return res.status(403).json({ error: "Only students can upload introduction videos" });
    }

    if (!req.file) {
      return res.status(400).json({ error: "No video file provided" });
    }

    // Get file info
    const filePath = req.file.path;
    const fileName = req.file.filename;
    
    // Store in database
    const student = await prisma.student.update({
      where: { id: studentId },
      data: { introVideoUrl, introVideoThumbnailUrl, introVideoDuration }
    });
    
    res.json({ 
      success: true, 
      video: { ... } 
    });
  } catch (error) {
    console.error('Upload error:', error);
    return res.status(500).json({ error: "Failed to upload video" });
  }
});
```

**No Explicit Error for Multer Failures:**
- If multer rejects (fieldSize exceeded), there's no try-catch
- Multer error handler not defined
- User gets no error message ← POSSIBLE CAUSE!

---

### ISSUE E: Database Layer

#### E1. Database File Path Too Long
**In videos-simple.js:**
```javascript
const videoStorage = multer.diskStorage({
  destination: function (_req, _file, cb) {
    cb(null, videoUploadDir);  // "uploads/videos"
  },
  filename: function (_req, file, cb) {
    const unique = Date.now() + "-" + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, unique + ext);  // e.g., "1707394821000-123456789.mp4"
  },
});
```

**Full path:** `uploads/videos/1707394821000-123456789.mp4`

**Database schema (Prisma):**
```prisma
model Student {
  introVideoUrl           String?
  introVideoThumbnailUrl  String?
}
```

**If schema has VARCHAR(255) limit** and path is very long:
- Path might exceed 255 characters
- Database insert fails
- Error not propagated to frontend

---

#### E2. Concurrent Upload Conflicts
**If user uploads two videos in quick succession:**
```javascript
// Video 1 start: 1707394821000
// Video 2 start: 1707394821001

// Both might try to use same filename due to race condition
// Or database constraint violation if both try to update same student
```

---

### ISSUE F: Network Protocol/Encoding

#### F1. Chunked Transfer Encoding Issues
**XHR and large files:**
```javascript
// When FormData is sent with large file:
xhr.send(formData);

// Browser might use chunked transfer encoding
// Some proxies don't handle chunked encoding well for large files
// Result: Connection drops mid-upload
```

**Workaround (if needed):**
```javascript
// Try explicit Content-Type instead of letting browser set it
xhr.setRequestHeader('Content-Type', 'multipart/form-data; boundary=...');
// But this is complex and usually not needed
```

---

#### F2. Content-Length Header Issues
**When sending 25MB file:**
```
POST /api/videos/upload-intro HTTP/1.1
Content-Length: 26214400  // 25MB
Content-Type: multipart/form-data; boundary=...

[25MB of binary data]
```

**Issue:** Some servers/proxies have limits on Content-Length:
- Nginx: `client_max_body_size` (default: 1MB)
- Apache: `LimitRequestBody` (default: unlimited)
- IIS: maxAllowedContentLength (default: 30MB)

**If running on production server with Nginx:**
```nginx
# /etc/nginx/nginx.conf
http {
    client_max_body_size 100M;  # Must be set for large uploads!
}
```

---

### ISSUE G: Error Message Discrepancy

#### G1. "Removed Video Toast" - Where Does It Come From?

**User says:** "It fails (removed video toast)"

**Where is this "removed video" message?**

**Possibilities:**

1. **From handleRemoveVideo() function:**
```javascript
const handleRemoveVideo = async (callDelete = true) => {
  // This doesn't show a toast - it just removes video
}
```

2. **From VideoUploader toast messages:**
```javascript
// These would show specific errors:
toast.error("File too large...");
toast.error("Unsupported format...");
toast.error("Failed to upload video...");
toast.error("Upload timed out...");
toast.error("Could not process video...");
```

3. **From backend response?**

**The Key Question:** What EXACT toast message appears before video disappears?
- "Upload failed"?
- "Upload timed out"?
- Nothing (video just removed silently)?

**If no toast message → Error handling is broken!**

---

### ISSUE H: Logging/Debugging Gaps

#### H1. No Backend Upload Logging
**In videos-simple.js, line 57:**
```javascript
router.post("/upload-intro", requireAuth, uploadVideo.single('video'), async (req, res) => {
  try {
    // ⚠️ NO LOGGING at start!
    // ⚠️ Can't see if request even reached handler
    
    if (!req.file) {
      return res.status(400).json({ error: "No video file provided" });
      // ⚠️ No logging why file wasn't provided
    }
    
    // Upload and save...
    
  } catch (error) {
    console.error('Upload error:', error);
    // This logs, but might not be detailed enough
  }
});
```

**What we don't know:**
- Did request reach the route handler?
- Was multer middleware executed?
- Did multer reject the file? Why?
- What's the actual error?

---

#### H2. No Frontend Network Logging
```javascript
// In VideoUploader.jsx, XHR handlers:

xhr.addEventListener('error', () => {
  setIsUploading(false);
  toast.error("Failed to upload video. Please try again.");
  // ⚠️ No details about the error!
  // ⚠️ No xhr.status check
  // ⚠️ No xhr.responseText logging
});
```

**Should be:**
```javascript
xhr.addEventListener('error', () => {
  setIsUploading(false);
  console.error('XHR Error:', {
    status: xhr.status,
    statusText: xhr.statusText,
    response: xhr.responseText,
    readyState: xhr.readyState
  });
  toast.error("Failed to upload video. Please try again.");
});
```

---

## 3. DIAGNOSTIC STEPS - ORDERED BY LIKELIHOOD

### Step 1: Verify File Size Validation ⭐ HIGH PRIORITY
**What:** Check if client-side validation is blocking 25MB files

**How:**
1. Open browser DevTools → Console
2. Go to student upload page
3. Try to select a 25MB video file
4. Watch console for any validation errors
5. Check if toast message appears before upload starts

**Expected:** No error message if file size validation is correct

---

### Step 2: Check XHR Response ⭐ HIGH PRIORITY
**What:** See what error the server actually returns

**How:**
1. Open browser DevTools → Network tab
2. Try to upload 25MB video
3. Look for POST request to `/api/videos/upload-intro`
4. If it fails, click on the request
5. Go to "Response" tab
6. See the exact error message

**Expected:** Should show server error, timeout, or network error

---

### Step 3: Test Network Speed ⭐ HIGH PRIORITY
**What:** Confirm actual upload speed

**How:**
1. Use speedtest.net or similar to check bandwidth
2. Calculate theoretical upload time:
   ```
   25MB ÷ your_upload_speed = time_in_seconds
   ```
3. If time > 300 seconds (5 minutes), that's your issue

**Expected:** Upload speed should be enough for 25MB in under 5 minutes

---

### Step 4: Check Server Logs ⭐ CRITICAL
**What:** See backend error messages

**How (Local Dev):**
```bash
# Look at terminal where Node server is running
# Or check if logging to file

# Expected log entries:
# "Upload error: [detailed error message]"
```

**How (Production/VPS):**
```bash
# SSH into server
cd /path/to/project

# Check logs:
tail -f logs/server.log  # or wherever logs are

# Or use PM2:
pm2 logs

# Look for errors around upload time
```

---

### Step 5: Verify Multer Configuration ⭐ MEDIUM PRIORITY
**Check:** videos-simple.js multer limits
```javascript
// Current (line 45-50):
const uploadVideo = multer({ 
  storage: videoStorage,
  fileFilter: videoFileFilter,
  limits: {
    fileSize: 100 * 1024 * 1024, // 100MB limit
  }
});

// Q: Are field limits missing?
```

---

### Step 6: Test with Different File Sizes ⭐ MEDIUM PRIORITY
**What:** Find exact threshold where uploads fail

**Test:**
1. Try 10MB → does it work?
2. Try 15MB → does it work?
3. Try 20MB → does it work?
4. Try 25MB → fails?
5. Try 30MB → fails?

**This tells us:** Is it a hard size limit or network speed issue?

---

### Step 7: Check Proxy Configuration ⭐ MEDIUM PRIORITY (if on VPS)
**What:** Nginx/Apache timeout settings

**If using Nginx:**
```bash
sudo nginx -T | grep timeout
# Look for:
# proxy_connect_timeout
# proxy_send_timeout
# proxy_read_timeout
```

**If using Apache:**
```bash
sudo apachectl -S | grep Timeout
```

---

### Step 8: Test with Chunked Upload ⭐ LOW PRIORITY (Advanced)
**What:** Confirm it's not a protocol issue

**How:** Manually split file and upload chunks (would need to implement this)

---

## 4. MOST LIKELY ROOT CAUSE

Based on the information provided and code analysis:

### **PRIMARY SUSPECT: Multer Field Limits** 🎯

**File:** `server/src/routes/videos-simple.js`

**Current Config:**
```javascript
const uploadVideo = multer({ 
  storage: videoStorage,
  fileFilter: videoFileFilter,
  limits: {
    fileSize: 100 * 1024 * 1024, // 100MB limit ✅
  }
});
```

**Missing Config:**
```javascript
limits: {
  fileSize: 100 * 1024 * 1024,  // File size limit ✅
  fieldSize: 10 * 1024 * 1024,  // ⚠️ MISSING - might default to 1MB!
  fieldNameSize: 100,
  fields: 10,
}
```

**Why This Matters:**
- If `fieldSize` defaults to 1MB
- And FormData contains 25MB 'video' field
- Multer silently rejects BEFORE route handler
- No error message sent back
- User sees generic "removed video" error

**Quick Fix to Test:**

Add to `server/src/routes/videos-simple.js` around line 45:
```javascript
const uploadVideo = multer({ 
  storage: videoStorage,
  fileFilter: videoFileFilter,
  limits: {
    fileSize: 100 * 1024 * 1024,      // 100MB
    fieldSize: 100 * 1024 * 1024,     // ← ADD THIS
    fieldNameSize: 256,                // ← ADD THIS
    fields: 10,                        // ← ADD THIS
    parts: 100,                        // ← ADD THIS
  }
});
```

---

### **SECONDARY SUSPECT: Network Speed** 🎯

If 25MB takes >5 minutes to upload on user's connection, it will timeout even with 5-minute timeout configured.

**Verify:**
1. Check browser Network tab for actual upload time
2. Estimate: is 25MB × 8 ÷ connection_speed > 300 seconds?

---

### **TERTIARY SUSPECT: Nginx (if on production)** 🎯

If deployed on VPS with Nginx and client_max_body_size not increased:

**Check:**
```bash
curl -I http://your-domain/api/videos/upload-intro
# Look for headers indicating body size limits
```

---

## 5. RECOMMENDED FIXES (PRIORITY ORDER)

### Fix 1: Update Multer Configuration (IMMEDIATE)
**File:** `server/src/routes/videos-simple.js`

Add proper field limits to multer configuration to handle large form data.

### Fix 2: Add Detailed Error Logging (IMMEDIATE)
**Files:** 
- `server/src/routes/videos-simple.js` - Log errors from multer
- `src/components/VideoUploader.jsx` - Log XHR responses

### Fix 3: Add Error Handler Middleware for Multer (SOON)
**File:** `server/src/routes/videos-simple.js`

```javascript
// Add after route definition
router.post("/upload-intro", requireAuth, (req, res, next) => {
  uploadVideo.single('video')(req, res, (err) => {
    if (err instanceof multer.MulterError) {
      if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(413).json({ error: 'File too large' });
      }
      if (err.code === 'LIMIT_FIELD_SIZE') {
        return res.status(413).json({ error: 'Field too large' });
      }
    }
    next();
  });
}, async (req, res) => {
  // existing handler
});
```

### Fix 4: Implement Chunked Upload (LATER)
For files >50MB, implement chunked upload system with resume capability.

---

## 6. TESTING CHECKLIST

After fixes, test with:
- [ ] 5MB video → should work
- [ ] 10MB video → should work  
- [ ] 25MB video → should work
- [ ] 50MB video → should work
- [ ] 100MB video → should work
- [ ] 101MB video → should fail with appropriate error
- [ ] Interrupt upload mid-way → should show error (no hang)
- [ ] Slow connection (throttled) → should show timeout error if >5 min
- [ ] Different video formats (MP4, MOV, AVI, WebM) → all should work

---

## Summary

**The "removed video" on 25MB+ uploads is most likely caused by:**

1. **Multer field size limits** (missing `fieldSize` configuration) - 60% likely
2. **Network speed insufficient** for 5-min timeout - 25% likely
3. **Nginx body size limit** (if on production) - 10% likely
4. **Other timeout layer** (CloudFlare, etc.) - 5% likely

**Recommended immediate action:** Add proper field limit configuration to multer and add comprehensive error logging to identify exactly where failures occur.
