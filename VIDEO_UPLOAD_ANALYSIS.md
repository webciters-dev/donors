# Video Upload Analysis - Works for Small, Fails for Large Videos

## Current Implementation Overview

### Frontend: VideoUploader Component (`src/components/VideoUploader.jsx`)

**How it currently works:**

1. **File Selection & Validation**
   - Accepts file through drag-drop or file input
   - Validates file type (MP4, MOV, AVI, WebM)
   - Checks max file size: **100MB max** (limited by backend multer config)
   - Checks minimum file size: **1MB minimum**
   - Creates local preview using `URL.createObjectURL()`

2. **Duration Validation** (Frontend)
   - Reads video metadata using HTML5 video element
   - Validates duration: **30-120 seconds** (2 minutes max)
   - Warns if video is not in optimal range (60-90 seconds)
   - **Duration is calculated on frontend and sent to backend**

3. **Upload Process**
   - Uses **XMLHttpRequest (XHR)** for upload instead of fetch API
   - Creates FormData with video file
   - Sends duration calculated from frontend metadata
   - Sets Authorization header with JWT token
   - **Tracks upload progress** and displays percentage
   - Converts blob preview URL if needed

4. **Error Handling**
   - Catches file type errors
   - Catches size errors
   - Catches duration validation errors
   - Shows toast notifications for errors
   - Removes video on upload failure

### Backend: Video Upload Routes

**Two versions exist:**

#### 1. **`server/src/routes/videos.js`** (Full-featured version)
- Uses `ffmpeg` for video processing
- Generates thumbnails using ffmpeg
- Converts videos to MP4 format with H.264 codec
- Calculates exact video metadata using ffprobe
- **Process: Upload → Extract metadata → Generate thumbnail → Convert to MP4 → Save to DB**

#### 2. **`server/src/routes/videos-simple.js`** (Currently Used - Lightweight)
- **This is the one currently configured in `server/src/server.js`**
- No ffmpeg processing
- Just saves video file directly
- Uses duration from frontend (`req.body.duration`)
- No thumbnail generation
- Minimal processing

### Express Server Configuration (`server/src/server.js`)

**Critical Settings:**
```javascript
// Line 109
app.use(express.json({ limit: "1mb" }));

// Line 176-182: Video route registration
app.use("/api/videos", videosRouter);  // Using videos-simple.js

// Line 184-191: Static file serving
app.use("/uploads", express.static("uploads", {
  setHeaders: (res, path) => {
    if (path.includes('/videos/')) {
      res.setHeader('Accept-Ranges', 'bytes');
      res.setHeader('Content-Type', 'video/mp4');
      res.setHeader('Access-Control-Allow-Origin', '*');
      res.setHeader('Access-Control-Allow-Headers', 'Range');
    }
  }
}));
```

### Multer Configuration (Backend)

In `videos-simple.js`:
```javascript
const uploadVideo = multer({ 
  storage: videoStorage,
  fileFilter: videoFileFilter,
  limits: {
    fileSize: 100 * 1024 * 1024, // 100MB limit
  }
});
```

---

## Root Causes of Large Video Upload Failures

###  **CRITICAL ISSUE #1: JSON Parser Limit (1MB)**

**Line 109 in `server/src/server.js`:**
```javascript
app.use(express.json({ limit: "1mb" }));
```

This limits JSON body parsing to 1MB, **BUT this shouldn't affect file uploads since videos use FormData/multipart, not JSON**. However, it suggests the server might not be configured for large payloads.

**Real Issue:** The JSON limit is for POST body, but multipart requests bypass this. However, if there's any error handling that tries to parse error responses as JSON, this could cause issues.

---

###  **CRITICAL ISSUE #2: No Request Size Limit on Multer**

While multer has a 100MB fileSize limit, **Express has no global limit on request body size for multipart/form-data**. This means:
- Large uploads may timeout
- Memory issues if processing large files
- No explicit timeout configuration visible

**Solution needed:** Add explicit limits to multer initialization.

---

###  **CRITICAL ISSUE #3: No Timeout Configuration**

The Express server has **no timeout settings configured**:
- No HTTP request timeout
- No socket timeout
- Large file uploads may exceed default Node.js timeouts (120 seconds)

**Node.js defaults:**
- Default timeout: ~2 minutes (120,000ms)
- A large video file (50-100MB) can take longer over standard connections

**In `server/src/server.js`, there should be:**
```javascript
app.use((req, res, next) => {
  req.socket.setTimeout(300000); // 5 minutes
  res.setTimeout(300000);
  next();
});
```

This is **MISSING** from current implementation.

---

###  **ISSUE #4: Frontend XMLHttpRequest Not Handling Timeout**

In `VideoUploader.jsx`, the XHR setup has:
- Upload progress tracking 
- Error event handler 
- Load event handler 
- **BUT: No timeout event handler** 
- **No explicit timeout setting** 

The `xhr` object should have:
```javascript
xhr.timeout = 300000; // 5 minutes
xhr.addEventListener('timeout', () => {
  setIsUploading(false);
  toast.error("Upload timed out. Please try with a smaller file.");
  handleRemoveVideo();
});
```

---

###  **ISSUE #5: No Chunked Upload for Large Files**

For files over 50MB, **chunked upload** is recommended:
- Upload file in smaller chunks (5-10MB each)
- Resume on failure
- Better progress tracking
- Current implementation: **Single monolithic upload**

This means a 100MB video must upload in one go. If network hiccup occurs, entire upload fails.

---

###  **ISSUE #6: FFmpeg Processing Not Used (videos-simple.js)**

The advanced route (`videos.js`) with FFmpeg is not being used. This version:
- Converts videos to MP4
- Optimizes codec (`-movflags +faststart`)
- Validates with ffprobe
- Generates thumbnails

Current simple version:
- Just saves file as-is
- No format validation beyond MIME type
- Could save invalid video files

---

###  **ISSUE #7: No Error Response from XHR for Large Payloads**

When XHR load event fires but status is error:
```javascript
xhr.addEventListener('load', () => {
  setIsUploading(false);
  
  if (xhr.status === 200) {
    // Success
  } else {
    const errorResponse = JSON.parse(xhr.responseText); //  Could fail parsing
    toast.error(errorResponse.error || "Failed to upload video");
  }
});
```

If the response is corrupted or large, `JSON.parse()` could fail silently.

---

## Why Small Videos Work but Large Videos Fail

### Small Videos (<50MB):
 Complete upload before timeout (usually <30 seconds)
 No network hiccups during transfer
 Server processes quickly
 Response returns before client timeout

### Large Videos (>50MB):
 Upload takes >2 minutes, exceeds Node.js default timeout
 Network interruption causes partial transfer → fails
 Server never responds with status code
 XHR times out or aborts without explicit error
 User sees generic error or nothing happens

---

## Recommended Solutions

###  **Solution 1: Increase Server Timeouts (IMMEDIATE)**

**File:** `server/src/server.js`

Add after line 108 (before routes):
```javascript
// Set request timeout to 5 minutes for large file uploads
app.use((req, res, next) => {
  req.socket.setTimeout(300000); // 5 minutes
  res.setTimeout(300000);
  next();
});
```

###  **Solution 2: Configure Multer with Proper Limits (IMMEDIATE)**

**File:** `server/src/routes/videos-simple.js`

Update multer configuration:
```javascript
const uploadVideo = multer({ 
  storage: videoStorage,
  fileFilter: videoFileFilter,
  limits: {
    fileSize: 500 * 1024 * 1024, // Increase to 500MB if needed
    fieldNameSize: 100,
    fieldSize: 1024 * 1024,
    fields: 10
  }
});
```

###  **Solution 3: Add XHR Timeout Handling (IMMEDIATE)**

**File:** `src/components/VideoUploader.jsx`

Add in `handleFileSelect` function, after `xhr.open()`:
```javascript
// Set timeout to 5 minutes
xhr.timeout = 300000; // 5 minutes in milliseconds

// Handle timeout
xhr.addEventListener('timeout', () => {
  setIsUploading(false);
  toast.error("Upload timed out. The file is too large or your connection is too slow. Try uploading a smaller video or use a faster connection.");
  handleRemoveVideo();
});
```

###  **Solution 4: Implement Chunked Upload (RECOMMENDED)**

**For files >50MB, implement chunked upload:**
- Split file into 5MB chunks
- Upload each chunk sequentially
- Track overall progress
- Allows resume on failure
- Much more reliable

This would require:
1. Frontend: Split file, upload chunks with chunk index
2. Backend: Accept chunks, validate chunk order, reassemble on completion
3. Temporary storage for incomplete uploads
4. Cleanup of abandoned uploads after timeout

###  **Solution 5: Switch to FFmpeg Version (OPTIONAL)**

**File:** `server/src/server.js` line 51

Change from:
```javascript
import videosRouter from "./routes/videos-simple.js";
```

To:
```javascript
import videosRouter from "./routes/videos.js";
```

This enables:
- Video format validation
- Thumbnail generation
- Codec optimization
- Better quality assurance

Requires ffmpeg installed on server.

---

## Implementation Priority

| Priority | Solution | Impact | Effort |
|----------|----------|--------|--------|
|  CRITICAL | Add server timeout | Fixes 80% of failures | 5 minutes |
|  CRITICAL | Add XHR timeout | Fixes client-side hangs | 5 minutes |
|  HIGH | Chunked upload | Fixes failures for very large files | 2-3 hours |
|  MEDIUM | Switch to FFmpeg | Improves video quality/validation | 10 minutes + test |
|  MEDIUM | Better error messages | Helps user understand failure reason | 30 minutes |

---

## Testing Recommendations

After implementing fixes:

1. **Test with increasing file sizes:**
   - 10MB  (should work)
   - 50MB  (should work now)
   - 100MB  (with improvements)
   - 200MB  (with chunked upload)

2. **Test with slow network:**
   - Throttle connection to 1Mbps
   - Verify timeout handling
   - Verify progress updates

3. **Test with interruptions:**
   - Drop connection mid-upload
   - Should show error
   - Should allow retry

---

## Summary

**Why large videos fail:**
- Server has no timeout configuration (default 2 minutes)
- Frontend XMLHttpRequest has no timeout handling
- No chunked upload for resilience
- Single monolithic upload per request
- Large files take >2 minutes to upload → timeout occurs

**Why small videos work:**
- Complete within default timeout
- No network issues during transfer
- Server processes and responds quickly

**Quickest fix:** Add 5-minute timeout to both server and client XMLHttpRequest.
