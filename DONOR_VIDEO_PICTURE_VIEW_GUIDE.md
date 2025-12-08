# Donor Video & Picture Viewing Guide - Deep Dive Analysis

## Overview
This document details exactly where donors can view student videos and pictures after logging in to the AWAKE Connect platform.

---

## 1. DONOR JOURNEY - WHERE TO VIEW STUDENT MEDIA

### Step 1: Donor Login
- **URL**: `/login`
- **Component**: `LoginPage.jsx`
- Donor enters email and password
- System verifies credentials
- JWT token stored in localStorage

### Step 2: View Student Marketplace
Two options:

#### Option A: Browse All Approved Students
- **URL**: `/marketplace`
- **Component**: `Marketplace.jsx`
- Shows student cards with basic info
- Each card has "Student details" button
- Authenticated donors see more info than non-authenticated users

#### Option B: Donor Dashboard
- **URL**: `/donor/dashboard` (or `/donor`)
- **Component**: `DonorDashboard.jsx`
- Lists all approved students
- Displays student cards with photos (if available)

### Step 3: View Individual Student Profile
- **URL**: `/students/{studentId}`
- **Component**: `StudentDetail.jsx`
- **This is where donors click to see full student information**

---

## 2. CURRENT STATE - VIDEO & PICTURE DISPLAY

### Current Implementation Status

#### Photos Display ✅ (Implemented)
- **Component**: `StudentPhoto.jsx` (144 lines)
- **Location**: Currently used in:
  - `StudentProfile.jsx` (line 903) - Student editing their own photo
  - `AdminApplicationDetail.jsx` (line 290) - Admins viewing student photos
  - `SubAdminApplicationDetail.jsx` (line 680) - Case workers viewing photos
  - `AdminApplications.jsx` (line 460) - Admin list view
  - `DonorDashboard.jsx` (line 246) - Donor dashboard (showing thumbnails)

#### Videos Display ✅ (Implemented)
- **Component**: `StudentVideo.jsx` (125 lines)
- **Location**: Currently used in:
  - `AdminApplicationDetail.jsx` (line 312) - Admins viewing videos
  - `SubAdminApplicationDetail.jsx` (line 700) - Case workers viewing videos

#### ⚠️ ISSUE: StudentDetail.jsx does NOT currently display videos or photos
- The page (`/students/{studentId}`) that donors visit **lacks video and picture components**
- Photos and videos are implemented but **NOT integrated into the donor-facing student detail view**

---

## 3. COMPONENTS AVAILABLE

### StudentPhoto Component
**File**: `src/components/StudentPhoto.jsx`

**Props**:
```javascript
{
  student,           // Student object with photo fields
  size: 'thumbnail' | 'small' | 'medium' | 'large' | 'full',  // Default: 'medium'
  className: '',     // Additional CSS classes
  showPlaceholder: true,  // Show placeholder when no photo
  clickable: false,  // Make photo clickable for full-size view
  alt: 'Student photo'  // Alt text
}
```

**Photo URL Detection**:
- Uses `student.photoThumbnailUrl` for small/thumbnail sizes
- Uses `student.photoUrl` for larger sizes
- Falls back to placeholder if no photo available

**Size Classes**:
- `thumbnail`: 8×8 pixels
- `small`: 12×12 pixels  
- `medium`: 16×16 pixels (default)
- `large`: 24×24 pixels
- `full`: 32×32 pixels

### StudentVideo Component
**File**: `src/components/StudentVideo.jsx`

**Props**:
```javascript
{
  student,           // Student object with video fields
  size: 'small' | 'medium' | 'large' | 'xlarge',  // Default: 'medium'
  className: '',     // Additional CSS classes
  showPlaceholder: true  // Show placeholder when no video
}
```

**Video Features**:
- HTML5 `<video>` element with native controls
- Shows thumbnail poster image if available
- Displays video duration (mm:ss format)
- Plays inline (no modal)
- Detects video URL automatically

**Size Classes**:
- `small`: 32×24 (w×h pixels)
- `medium`: 64×48 (default)
- `large`: Full width, max 512px
- `xlarge`: Full width, max 640px

---

## 4. STUDENT DATA MODEL

### Photo Fields in Student Object
```javascript
{
  id: "uuid",
  name: "Student Name",
  photoUrl: "/uploads/photos/student-uuid.jpg",
  photoThumbnailUrl: "/uploads/photos/thumbnails/student-uuid-thumb.jpg",
  photoUploadedAt: "2024-01-15T10:30:00Z",
  // ... other fields
}
```

### Video Fields in Student Object
```javascript
{
  id: "uuid",
  name: "Student Name",
  introVideoUrl: "/uploads/videos/intro-uuid.mp4",
  introVideoThumbnailUrl: "/uploads/videos/thumbnails/intro-uuid-thumb.jpg",
  introVideoDuration: 85,  // Duration in seconds
  introVideoUploadedAt: "2024-01-15T10:30:00Z",
  // ... other fields
}
```

---

## 5. API ENDPOINTS SERVING STUDENT DATA

### Get Approved Student (Donor-safe data)
**Endpoint**: `GET /api/students/approved/{studentId}`

**Response includes**:
```javascript
{
  "student": {
    "id": "uuid",
    "name": "Ahmed Khan",
    "email": "ahmed@example.com",
    "university": "LUMS",
    "program": "Computer Science",
    "gpa": 3.8,
    "gradYear": 2025,
    "city": "Karachi",
    "province": "Sindh",
    "gender": "M",
    "personalIntroduction": "...",
    "photoUrl": "/uploads/photos/...",
    "photoThumbnailUrl": "/uploads/photos/thumbnails/...",
    "introVideoUrl": "/uploads/videos/intro-...",
    "introVideoThumbnailUrl": "/uploads/videos/thumbnails/...",
    "introVideoDuration": 85,
    "application": {
      "id": "app-uuid",
      "amount": 5000,
      "currency": "USD"
    }
  }
}
```

### Get All Approved Students
**Endpoint**: `GET /api/students/approved`

Returns array of approved students with all fields shown above.

---

## 6. CURRENT USER EXPERIENCES

### Where Admins See Student Media
1. Admin clicks: **Admin Hub** → **Applications**
2. Clicks: **View Details** on a student application
3. **Page**: `AdminApplicationDetail.jsx` (/admin/applications/{id})
4. **Displays**: 
   - Student photo (with fallback placeholder)
   - Introduction video (with fallback placeholder)
   - Profile completeness percentage
   - All student details

### Where Case Workers See Student Media
1. Case worker clicks: **Dashboard** → **My Assignments**
2. Clicks: **Verify Student** button
3. **Page**: `SubAdminApplicationDetail.jsx` (/sub-admin/applications/{id})
4. **Displays**:
   - Student photo (large size)
   - Introduction video (large size)
   - All verification-related information

### Where Donors See Student Media - CURRENT
1. Donor logs in
2. Browses marketplace or donor dashboard
3. Clicks: **Student details** button
4. **Page**: `StudentDetail.jsx` (/students/{studentId})
5. **Displays**:
   - Student name, program, university, GPA
   - Personal introduction text
   - Background details (family size, career goals, etc.)
   - Application details and financial breakdown
   - ❌ **NO PHOTO**
   - ❌ **NO VIDEO**

---

## 7. ISSUE SUMMARY & RECOMMENDATION

### Current Gap
The student detail page that donors visit (`/students/{studentId}`) does **NOT display**:
- Student profile photo
- Introduction video (where student talks about themselves)

These components are available and working in admin/case-worker views, but are missing from the donor view.

### Why This Matters
From the email templates and system design:
- Donors are supposed to: **"Watch introduction videos"** and see student profiles
- Students submit: Photos and introduction videos
- The promise: **"Browse verified student profiles... Watches introduction videos"**

### What Needs to Be Done
Add `StudentPhoto` and `StudentVideo` components to `StudentDetail.jsx` to display:
1. **Student profile photo** - Visual connection between donor and student
2. **Introduction video** - Student's own words about themselves, education goals, and aspirations

### Suggested Placement in StudentDetail.jsx
```
1. Student Information (existing)
2. About Me & My Family (existing)
3. ⭐ STUDENT PHOTO (NEW)
4. ⭐ INTRODUCTION VIDEO (NEW)
5. Detailed Background (existing)
6. Application Details (existing)
7. Sponsorship Actions (existing)
```

---

## 8. FILE STRUCTURE & CODE LOCATIONS

### Files Involved
```
Frontend Components:
├── src/pages/StudentDetail.jsx          ← MAIN: Donor view (MISSING video/photo)
├── src/pages/AdminApplicationDetail.jsx ← HAS video/photo display
├── src/pages/SubAdminApplicationDetail.jsx ← HAS video/photo display
├── src/components/StudentPhoto.jsx      ← COMPONENT (reusable)
└── src/components/StudentVideo.jsx      ← COMPONENT (reusable)

Backend Routes:
├── server/src/routes/students.js        ← Returns student data with photo/video URLs
└── server/src/routes/auth.js            ← Authentication

Database Models:
└── server/prisma/schema.prisma          ← Student schema with photo/video fields
```

### Import Statement to Add
```javascript
import StudentPhoto from "@/components/StudentPhoto";
import StudentVideo from "@/components/StudentVideo";
```

### Example Usage (based on existing implementations)
```jsx
{/* Student Photo Section */}
<Card className="p-6">
  <SectionTitle icon={Users} title="Student Photo" />
  <div className="mt-4 flex justify-center">
    <StudentPhoto 
      student={student}
      size="large"
      className="shadow-lg border-2 border-gray-200"
      clickable={true}
    />
  </div>
</Card>

{/* Introduction Video Section */}
<Card className="p-6">
  <SectionTitle icon={Video} title="About the Student" />
  <div className="mt-4">
    <p className="text-sm text-slate-600 mb-4">
      {student.name} introduces themselves and shares their educational goals.
    </p>
    <StudentVideo 
      student={student}
      size="large"
      className="mx-auto"
    />
  </div>
</Card>
```

---

## 9. SUMMARY

| Aspect | Status | Location |
|--------|--------|----------|
| **Photo Component** | ✅ Built & Working | `StudentPhoto.jsx` |
| **Video Component** | ✅ Built & Working | `StudentVideo.jsx` |
| **Admin View** | ✅ Shows photo & video | `AdminApplicationDetail.jsx` |
| **Case Worker View** | ✅ Shows photo & video | `SubAdminApplicationDetail.jsx` |
| **Donor Marketplace Cards** | ✅ Shows photo thumbnail | `DonorDashboard.jsx` |
| **Donor Detail Page** | ❌ Missing photo & video | `StudentDetail.jsx` |
| **Database** | ✅ Stores URLs & metadata | Prisma Student model |
| **API** | ✅ Returns data | `/api/students/approved/{id}` |

---

## 10. NEXT STEPS

To complete the donor experience:
1. Import `StudentPhoto` and `StudentVideo` components
2. Add two new Card sections in `StudentDetail.jsx`
3. Display components using student data from API response
4. Test that photos and videos display correctly for all approved students
5. Verify responsive design on mobile devices
