# Developer Test Findings - ISSUE #1: Profile Photo Upload Bug

## Issue Description
**When a student uploads a profile photo during registration (STEP 1), it shows "uploaded successfully", but when they try to view it again on another screen OR when admin reviews the application, the photo is NOT visible.**

The developer reports:
- Upload success message appears
- Later screens show "Profile picture available" message
- But actual photo image doesn't display in the application detail page

---

## Root Cause Analysis

### What Happens During Upload:

1. **Frontend** (`PhotoUpload.jsx`):
   - User selects photo file
   - Creates blob preview URL (displays immediately on screen)
   - Sends to `/api/photos/upload` endpoint
   - Receives: `{ photoUrl: "uploads/photos/student-photo-123.jpg", photoThumbnailUrl: "uploads/photos/thumbnails/..." }`
   - Updates component state with returned URLs

2. **Backend** (`server/src/routes/photos.js`):
   - Receives photo, validates size (5MB max) and type (JPEG, PNG, WebP)
   - Uses Sharp to process image (resize, create thumbnail)
   - Saves files to disk: `uploads/photos/{filename}` and `uploads/photos/thumbnails/{filename}`
   - Returns URLs relative to server root

3. **Frontend Display** (`StudentPhoto.jsx`):
   - Receives student object with `photoUrl` from database
   - Constructs URL: `${API.baseURL}/${student.photoUrl}`
   - Displays in `<img src={url} />`

### The Bug:

**The blob preview URL is different from the actual uploaded file:**

- **What displays immediately**: `blob:http://localhost:5173/abc123` (temporary browser memory)
- **What's stored in database**: `uploads/photos/student-photo-1234567.jpg`
- **When trying to reload**: Backend needs to serve this file

**Possible Issues:**
1. ✅ Backend **IS** serving static files (verified in `server.js` line 184)
2. ❌ But the file **might not be saved to disk properly**
3. ❌ Or the file path stored in database **doesn't match the actual file location**
4. ❌ Or the initial blob preview causes a perception that upload was successful when it actually failed

---

## Why Admin Sees "Profile picture available" but No Photo:

In `AdminApplicationDetail.jsx` (line 297-303):
```jsx
<StudentPhoto 
  student={app.student}
  size="large"
  className="shadow-lg border-2 border-gray-200"
/>
<div className="text-sm text-slate-600">
  {app.student?.photoUrl ? (
    <div>
      <div> Photo uploaded</div>
      <div className="text-xs opacity-75">Profile picture available</div>
    </div>
```

The code checks: `if (app.student?.photoUrl)` exists in database
- It finds the URL exists ✅
- But the StudentPhoto component can't load the actual image file ❌

---

## Fix Strategy:

### Quick Diagnosis Steps:

1. **Check file actually exists on disk:**
   ```powershell
   # List all files in uploads/photos directory
   Get-ChildItem "C:\projects\donor\server\uploads\photos" -Recurse
   ```

2. **Check database stores correct path:**
   - Query database for uploaded student
   - Verify `photoUrl` field contains something like: `uploads/photos/student-photo-123.jpg`

3. **Test static file serving:**
   - Open browser console
   - Check Network tab for photo request
   - Does it return 200 OK or 404 Not Found?

4. **Check for path mismatch:**
   - Database stores: `uploads/photos/student-photo-1234567890.jpg`
   - Actual disk location: `C:\projects\donor\server\uploads\photos\student-photo-1234567890.jpg`
   - URL being constructed: `http://aircrew.nl/uploads/photos/student-photo-1234567890.jpg`

---

## Recommended Fixes (in order):

### FIX 1: Add Debug Logging to Photo Upload
**File**: `server/src/routes/photos.js`

After successful file save (line 138), log the file paths:
```javascript
console.log('Photo upload successful:');
console.log('  Original file saved to:', originalPath);
console.log('  Thumbnail saved to:', thumbnailPath);
console.log('  Stored in DB - photoUrl:', photoUrl);
console.log('  Stored in DB - photoThumbnailUrl:', photoThumbnailUrl);
```

### FIX 2: Ensure Uploads Directory Exists
**File**: `server/src/routes/photos.js` (already has this at line 19-22)

✅ Already implemented with `ensureDirectories()` function

### FIX 3: Verify File Permissions
After re-upload test, check if files have read permissions:
```powershell
Get-Acl "C:\projects\donor\server\uploads\photos\*" | Format-List
```

### FIX 4: Add Better Error Handling
**File**: `src/components/PhotoUpload.jsx`

Add logging when photo upload completes:
```javascript
const result = await response.json();

console.log('Photo upload API response:', {
  photoUrl: result.photoUrl,
  photoThumbnailUrl: result.photoThumbnailUrl,
  uploadedAt: result.uploadedAt
});

if (onPhotoChange) {
  onPhotoChange({
    photoUrl: result.photoUrl,
    photoThumbnailUrl: result.photoThumbnailUrl,
    uploadedAt: result.uploadedAt || new Date().toISOString()
  });
}
```

### FIX 5: Force Refresh in StudentPhoto Component
**File**: `src/components/StudentPhoto.jsx`

Add cache-busting query parameter:
```javascript
// Determine which photo URL to use
const getPhotoUrl = () => {
  if (!student) return null;
  
  const baseUrl = size === 'thumbnail' || size === 'small' 
    ? student.photoThumbnailUrl 
    : student.photoUrl;
    
  if (baseUrl) {
    // Add cache-buster to force fresh load
    const cacheBuster = `?v=${student.photoUploadedAt || new Date().getTime()}`;
    return `${API.baseURL}/${baseUrl}${cacheBuster}`;
  }
  
  return null;
};
```

---

## Testing the Fix:

1. **Test Scenario 1 - Student Registration:**
   - [ ] Student uploads photo in STEP 1
   - [ ] Check browser console for upload response
   - [ ] Refresh page - photo should still display
   - [ ] Check Network tab - photo request returns 200 OK

2. **Test Scenario 2 - Admin Review:**
   - [ ] Admin logs in
   - [ ] Go to Applications
   - [ ] Click on student application
   - [ ] Scroll to "Student Profile" section
   - [ ] Photo should display (not placeholder)

3. **Test Scenario 3 - Re-upload:**
   - [ ] Student re-uploads different photo
   - [ ] Old photo should be deleted from server
   - [ ] New photo should display immediately

---

## Expected Behavior After Fix:

✅ Upload shows success message
✅ File saved to `uploads/photos/{filename}`  
✅ Database stores correct path
✅ StudentPhoto component loads file from server
✅ Admin sees photo in application detail
✅ Photo persists after page refresh
✅ Re-uploads replace old photo

