# ISSUE ANALYSIS - Photo Vanishing & Video Warning Toast

## Issue #1: Photo Vanishing After Login/Logout

### Root Cause Found
**File:** `src/components/StudentPhoto.jsx`

The issue is in how the component builds the photo URL:

```javascript
// Line 48-51 in StudentPhoto.jsx
const getPhotoUrl = () => {
  if (!student) return null;
  
  if ((size === 'thumbnail' || size === 'small') && student.photoThumbnailUrl) {
    return `${API.baseURL}/${student.photoThumbnailUrl}`;  // ← PROBLEM HERE
  }
  
  if (student.photoUrl) {
    return `${API.baseURL}/${student.photoUrl}`;  // ← AND HERE
  }
  
  return null;
};
```

### The Problem
1. **Database stores:** `photoUrl: "uploads/photos/student-photo-1703068145293-5671.jpg"`
2. **Component constructs:** `${API.baseURL}/${student.photoUrl}`
3. **Result:** `http://localhost:3001/uploads/photos/student-photo-1703068145293-5671.jpg`

**BUT** the actual endpoint is:
- `GET /api/photos/:studentId` - Returns photo file
- NOT directly at `/uploads/photos/...`

**What's really happening:**
- First load: Browser uses cached photo from local state
- After logout/login: Component fetches fresh `student` object from API
- Component tries to load photo from `/uploads/photos/...` which:
  - **Returns 404** (endpoint doesn't exist - no direct file serving!)
  - Or returns HTML error page instead of image
  - Browser can't display, photo vanishes

### How It "Worked" Before (Accidentally)
- Browser cache kept old photo visible until hard refresh
- After logout/login, cache was cleared
- Without proper endpoint, photo couldn't reload

---

## Issue #2: Video Duration Warning Toast Shows During Upload

### Root Cause Found
**File:** `src/components/VideoUploader.jsx` Lines 108-114

```javascript
// PROBLEM: Toast shows when duration is checked (during upload)
if (metadata.duration < 60) {
  toast.warning("Video is shorter than recommended (60-90 seconds)");  // ← Shows mid-upload!
} else if (metadata.duration > 90) {
  toast.warning("Video is longer than recommended (60-90 seconds)");  // ← Shows mid-upload!
}
```

The validation runs BEFORE the upload even starts (while extracting metadata from the file). Then another success toast shows when upload completes.

**User sees:**
1. ⚠️ Warning toast: "Video is shorter than recommended (60-90 seconds)"
2. ✅ Success toast: "Video uploaded successfully!"

### The Issue
The warning toast should only appear IF there's a duration problem, but the video is still acceptable (30-120 seconds is the valid range). The warning makes users think something is wrong when it's just informational.

---

## FIXES REQUIRED

### Fix #1: Photo Display (StudentPhoto.jsx)

**Current broken code (Line 48-56):**
```javascript
const getPhotoUrl = () => {
  if (!student) return null;
  
  if ((size === 'thumbnail' || size === 'small') && student.photoThumbnailUrl) {
    return `${API.baseURL}/${student.photoThumbnailUrl}`;
  }
  
  if (student.photoUrl) {
    return `${API.baseURL}/${student.photoUrl}`;
  }
  
  return null;
};
```

**Why this is wrong:**
- `/uploads/photos/...` is NOT an accessible endpoint
- It's just a filesystem path, not an API route
- Frontend CANNOT directly access file paths

**Fix needed:**
- Use proper API endpoint: `/api/photos/:studentId`
- Or serve files through Express.static (if configured)

**Check server.js:**
```bash
grep -n "express.static\|/uploads" server/src/server.js
```

### Fix #2: Video Duration Warning (VideoUploader.jsx)

**Current behavior (Lines 108-114):**
```javascript
// Warns even for acceptable videos
if (metadata.duration < 60) {
  toast.warning("Video is shorter than recommended (60-90 seconds)");
}
```

**Better approach:**
- Only show warning if duration is outside 60-90 seconds
- But still allow 30-120 seconds
- Make it clear it's just a recommendation, not an error
- Or suppress the warning if upload succeeds

---

## NEXT STEPS

1. **Check if Express.static is configured** for `/uploads` directory
2. **Verify the actual photo serving endpoint** - how does the app serve photos?
3. **Check Student object structure** - what fields does API return?
4. **Determine fix strategy:**
   - Option A: Use API endpoint `/api/photos/:studentId`
   - Option B: Configure Express.static to serve `/uploads` directory
   - Option C: Both (API for authenticated, static for public if allowed)

---

## CRITICAL QUESTION

**How are photos currently served on the working instances?**

Are they:
1. Served via API endpoint (`GET /api/photos/:studentId`)?
2. Served directly via Express.static (`/uploads/...`)?
3. Served some other way?

This determines the fix strategy.

