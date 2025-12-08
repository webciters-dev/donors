# Donor Photo & Video Viewing - Complete Architecture Map

## SYSTEM ARCHITECTURE

```
┌─────────────────────────────────────────────────────────────────────────┐
│                           STUDENT UPLOADS                               │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  StudentProfile.jsx (/student/profile)                                  │
│  ├─ Upload Profile Photo → /api/student/profile-photo                  │
│  │  └─ Stored: uploads/photos/{studentId}.jpg                          │
│  │             uploads/photos/thumbnails/{studentId}-thumb.jpg         │
│  │                                                                      │
│  └─ Upload Intro Video → /api/student/video                            │
│     └─ Stored: uploads/videos/{studentId}.mp4                          │
│                uploads/videos/thumbnails/{studentId}-thumb.jpg         │
│                                                                          │
│  Database Updates:                                                       │
│  ├─ Student.photoUrl = "/uploads/photos/{studentId}.jpg"              │
│  ├─ Student.photoThumbnailUrl = "/uploads/photos/thumbnails/..."      │
│  ├─ Student.introVideoUrl = "/uploads/videos/{studentId}.mp4"         │
│  ├─ Student.introVideoThumbnailUrl = "/uploads/videos/thumbnails/..."│
│  └─ Student.introVideoDuration = 85 (seconds)                         │
└─────────────────────────────────────────────────────────────────────────┘
                                   ↓
┌─────────────────────────────────────────────────────────────────────────┐
│                          API LAYER                                      │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  GET /api/students/approved/{studentId}                                │
│  ├─ Returns student data with:                                         │
│  │  ├─ photoUrl ✅                                                     │
│  │  ├─ photoThumbnailUrl ✅                                            │
│  │  ├─ introVideoUrl ✅                                                │
│  │  ├─ introVideoThumbnailUrl ✅                                       │
│  │  └─ introVideoDuration ✅                                           │
│  │                                                                     │
│  └─ Used by: DonorDashboard, StudentDetail, AdminApplicationDetail   │
│                                                                          │
│  GET /api/students/approved                                            │
│  └─ Returns array of all approved students with photo/video data      │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
                                   ↓
┌─────────────────────────────────────────────────────────────────────────┐
│                        COMPONENT LAYER                                  │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  ┌─────────────────────────────────────────────────────────────────┐  │
│  │ StudentPhoto.jsx (144 lines)                                   │  │
│  ├─────────────────────────────────────────────────────────────────┤  │
│  │ Props:                                                         │  │
│  │  ├─ student: Student object                                  │  │
│  │  ├─ size: 'thumbnail'|'small'|'medium'|'large'|'full'       │  │
│  │  ├─ className: additional CSS                               │  │
│  │  ├─ clickable: bool (for full-size modal)                   │  │
│  │  └─ showPlaceholder: bool                                   │  │
│  │                                                              │  │
│  │ Logic:                                                        │  │
│  │  1. Check student.photoThumbnailUrl (for small sizes)        │  │
│  │  2. Fall back to student.photoUrl (for large sizes)          │  │
│  │  3. Show placeholder if no URL                              │  │
│  │  4. Handle image load errors gracefully                      │  │
│  │                                                              │  │
│  │ Used By:                                                      │  │
│  │  ├─ ✅ StudentProfile.jsx (student editing)               │  │
│  │  ├─ ✅ AdminApplicationDetail.jsx (admin viewing)         │  │
│  │  ├─ ✅ SubAdminApplicationDetail.jsx (case worker)        │  │
│  │  ├─ ✅ AdminApplications.jsx (admin list)                 │  │
│  │  ├─ ✅ DonorDashboard.jsx (thumbnail display)             │  │
│  │  └─ ❌ StudentDetail.jsx (MISSING - donor view)            │  │
│  └─────────────────────────────────────────────────────────────────┘  │
│                                                                          │
│  ┌─────────────────────────────────────────────────────────────────┐  │
│  │ StudentVideo.jsx (125 lines)                                  │  │
│  ├─────────────────────────────────────────────────────────────────┤  │
│  │ Props:                                                         │  │
│  │  ├─ student: Student object                                  │  │
│  │  ├─ size: 'small'|'medium'|'large'|'xlarge'                 │  │
│  │  ├─ className: additional CSS                               │  │
│  │  └─ showPlaceholder: bool                                   │  │
│  │                                                              │  │
│  │ Logic:                                                        │  │
│  │  1. Get student.introVideoUrl                                │  │
│  │  2. Get student.introVideoThumbnailUrl (for poster)          │  │
│  │  3. Render <video> with native HTML5 controls               │  │
│  │  4. Display duration in mm:ss format                         │  │
│  │  5. Show placeholder if no video                            │  │
│  │                                                              │  │
│  │ Features:                                                      │  │
│  │  ├─ Inline playback (NO MODAL)                              │  │
│  │  ├─ Poster/thumbnail image                                  │  │
│  │  ├─ Native browser controls (play, pause, volume)           │  │
│  │  ├─ Metadata preload                                        │  │
│  │  └─ Error handling                                          │  │
│  │                                                              │  │
│  │ Used By:                                                      │  │
│  │  ├─ ✅ AdminApplicationDetail.jsx (admin viewing)         │  │
│  │  ├─ ✅ SubAdminApplicationDetail.jsx (case worker)        │  │
│  │  └─ ❌ StudentDetail.jsx (MISSING - donor view)            │  │
│  └─────────────────────────────────────────────────────────────────┘  │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
                                   ↓
┌─────────────────────────────────────────────────────────────────────────┐
│                        PAGE LAYER                                       │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  ┌─────────────────────────────────────────────────────────────────┐  │
│  │ AdminApplicationDetail.jsx (Admin View)                        │  │
│  │ Route: /admin/applications/{applicationId}                    │  │
│  ├─────────────────────────────────────────────────────────────────┤  │
│  │ ✅ Uses StudentPhoto (line 290)                               │  │
│  │ ✅ Uses StudentVideo (line 312)                               │  │
│  │ Shows: Photo + Video in "Student Profile" Card                │  │
│  └─────────────────────────────────────────────────────────────────┘  │
│                                                                          │
│  ┌─────────────────────────────────────────────────────────────────┐  │
│  │ SubAdminApplicationDetail.jsx (Case Worker View)              │  │
│  │ Route: /sub-admin/applications/{applicationId}                │  │
│  ├─────────────────────────────────────────────────────────────────┤  │
│  │ ✅ Uses StudentPhoto (line 680)                               │  │
│  │ ✅ Uses StudentVideo (line 700)                               │  │
│  │ Shows: Photo + Video in verification process                  │  │
│  └─────────────────────────────────────────────────────────────────┘  │
│                                                                          │
│  ┌─────────────────────────────────────────────────────────────────┐  │
│  │ DonorDashboard.jsx (Donor Dashboard)                          │  │
│  │ Route: /donor/dashboard or /donor                             │  │
│  ├─────────────────────────────────────────────────────────────────┤  │
│  │ ✅ Uses StudentPhoto thumbnails (line 246)                    │  │
│  │ ❌ Does NOT use StudentVideo                                  │  │
│  │ Shows: Grid of students with photo thumbnails                 │  │
│  └─────────────────────────────────────────────────────────────────┘  │
│                                                                          │
│  ┌─────────────────────────────────────────────────────────────────┐  │
│  │ StudentDetail.jsx (DONOR STUDENT VIEW) 🎯 TARGET             │  │
│  │ Route: /students/{studentId}                                   │  │
│  ├─────────────────────────────────────────────────────────────────┤  │
│  │ ❌ MISSING: StudentPhoto                                      │  │
│  │ ❌ MISSING: StudentVideo                                      │  │
│  │                                                              │  │
│  │ Currently Shows:                                              │  │
│  │  ├─ Student name, program, university                       │  │
│  │  ├─ Personal information (location, gender)                 │  │
│  │  ├─ Background details (family, career goals, etc.)         │  │
│  │  ├─ Application details                                     │  │
│  │  ├─ Sponsorship button                                      │  │
│  │  ├─ Donor-student messaging                                 │  │
│  │  ├─ ❌ NO PHOTO                                             │  │
│  │  └─ ❌ NO VIDEO                                             │  │
│  │                                                              │  │
│  │ WHERE TO ADD (line ~260-310):                               │  │
│  │  After "Personal Introduction" section                       │  │
│  │  Before "Donor-Student Messaging"                            │  │
│  └─────────────────────────────────────────────────────────────────┘  │
│                                                                          │
│  ┌─────────────────────────────────────────────────────────────────┐  │
│  │ Marketplace.jsx (Student Browsing)                            │  │
│  │ Route: /marketplace                                           │  │
│  ├─────────────────────────────────────────────────────────────────┤  │
│  │ Shows: Student cards with:                                    │  │
│  │  ├─ Name, program, university                               │  │
│  │  ├─ Required funding amount                                 │  │
│  │  ├─ Basic info (city, province, GPA)                       │  │
│  │  └─ "Student details" button → links to StudentDetail     │  │
│  │                                                              │  │
│  │ (Photos/videos would display in StudentDetail page)         │  │
│  └─────────────────────────────────────────────────────────────────┘  │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## DONOR EXPERIENCE FLOW

```
┌──────────────────────────────────────────────────────────────────┐
│ 1. DONOR LOGIN                                                   │
│    Route: /login                                                │
│    Component: LoginPage.jsx                                    │
│    ↓ Verify email & password                                  │
│    ↓ Store JWT token in localStorage                          │
└──────────────────────────────────────────────────────────────────┘
                           ↓
┌──────────────────────────────────────────────────────────────────┐
│ 2. BROWSE STUDENTS (Two Options)                                │
│                                                                  │
│    OPTION A: /donor/dashboard                                 │
│    Component: DonorDashboard.jsx                              │
│    Shows: Grid of student cards with thumbnail photos ✅       │
│                                                                │
│    OPTION B: /marketplace                                    │
│    Component: Marketplace.jsx                                │
│    Shows: Grid of student cards                             │
│                                                                │
│    Click: "Student details" button on any card               │
└──────────────────────────────────────────────────────────────────┘
                           ↓
┌──────────────────────────────────────────────────────────────────┐
│ 3. VIEW STUDENT DETAIL PAGE 🎯                                  │
│    Route: /students/{studentId}                               │
│    Component: StudentDetail.jsx                               │
│                                                                │
│    API Call: GET /api/students/approved/{studentId}           │
│    Returns: Student object with photo & video URLs ✅          │
│                                                                │
│    Page Shows:                                                 │
│    ├─ Header: Name, program, university, funding needed      │
│    ├─ Card: Student Information                             │
│    ├─ Card: About Me & My Family (text)                    │
│    ├─ Card: Messaging component                             │
│    ├─ Card: Detailed Background                            │
│    │  ├─ Family size                                        │
│    │  ├─ Career goals                                       │
│    │  ├─ Academic achievements                              │
│    │  └─ Community involvement                              │
│    ├─ Card: Application Details                            │
│    │  ├─ Financial breakdown                                │
│    │  ├─ Required amount                                    │
│    │  └─ Term/timing info                                   │
│    ├─ ❌ MISSING: Student Photo Card                        │
│    ├─ ❌ MISSING: Introduction Video Card                   │
│    └─ Card: Sponsorship                                    │
│       └─ Button: "Sponsor ${amount}" → /donor/payment/{id}  │
│                                                                │
│    WHAT NEEDS TO BE ADDED:                                    │
│    After "About Me & My Family", add two new Cards:          │
│                                                                │
│    ┌─ Card: Meet the Student                                │
│    │  ├─ Column 1: StudentPhoto component (size="large")   │
│    │  └─ Column 2: StudentVideo component (size="large")   │
│    └─                                                        │
└──────────────────────────────────────────────────────────────────┘
                           ↓
┌──────────────────────────────────────────────────────────────────┐
│ 4. SPONSOR STUDENT                                              │
│    Click: "Sponsor ${amount}" button                          │
│    Route: /donor/payment/{studentId}                         │
│    Component: DonorPayment.jsx                               │
│    ↓ Enter payment information                              │
│    ↓ Complete sponsorship                                  │
│    ↓ Receive confirmation email                            │
└──────────────────────────────────────────────────────────────────┘
```

---

## CODE COMPARISON

### What Admin/Case Worker See (WORKING ✅)
```jsx
// From AdminApplicationDetail.jsx & SubAdminApplicationDetail.jsx

<Card className="p-6">
  <div className="font-medium mb-4">Student Profile</div>
  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
    
    {/* Photo */}
    <div>
      <h4 className="font-medium text-sm mb-3">Profile Photo</h4>
      <StudentPhoto 
        student={app.student}
        size="large"
        className="shadow-lg border-2 border-gray-200"
      />
    </div>
    
    {/* Video */}
    <div>
      <h4 className="font-medium text-sm mb-3">Introduction Video</h4>
      <StudentVideo 
        student={app.student}
        size="large"
        className="shadow-lg border-2 border-gray-200"
      />
    </div>
  </div>
</Card>
```

### What Donors Should See (NEEDS TO BE ADDED ❌)
```jsx
// Should be added to StudentDetail.jsx around line 260-300

import StudentPhoto from "@/components/StudentPhoto";
import StudentVideo from "@/components/StudentVideo";

// Then in the JSX return statement, add after "About Me" section:

{/* Meet the Student - Photo & Video */}
<Card className="p-6">
  <SectionTitle icon={Users} title="Meet the Student" />
  <div className="mt-4 grid md:grid-cols-2 gap-6">
    
    {/* Photo Column */}
    <div>
      <h4 className="font-medium text-sm mb-3 text-slate-700">Student Photo</h4>
      <StudentPhoto 
        student={student}
        size="large"
        className="shadow-lg border-2 border-gray-200"
        clickable={true}
      />
    </div>
    
    {/* Video Column */}
    <div>
      <h4 className="font-medium text-sm mb-3 text-slate-700">Introduction Video</h4>
      <StudentVideo 
        student={student}
        size="large"
        className="shadow-lg border-2 border-gray-200"
      />
    </div>
  </div>
</Card>
```

---

## FILES TO MODIFY

**File**: `src/pages/StudentDetail.jsx`

**Actions**:
1. Add imports (line ~10):
   ```jsx
   import StudentPhoto from "@/components/StudentPhoto";
   import StudentVideo from "@/components/StudentVideo";
   ```

2. Add Card component (after Personal Introduction, around line 270):
   ```jsx
   {/* Meet the Student Card with Photo and Video */}
   <Card className="p-6">
     <SectionTitle icon={Users} title="Meet the Student" />
     <div className="mt-4 grid md:grid-cols-2 gap-6">
       <div>
         <h4 className="font-medium text-sm mb-3 text-slate-700">Student Photo</h4>
         <StudentPhoto 
           student={student}
           size="large"
           className="shadow-lg border-2 border-gray-200"
           clickable={true}
         />
       </div>
       <div>
         <h4 className="font-medium text-sm mb-3 text-slate-700">Introduction Video</h4>
         <StudentVideo 
           student={student}
           size="large"
         />
       </div>
     </div>
   </Card>
   ```

---

## SUMMARY

| Component | File | Status | Used Where |
|-----------|------|--------|-----------|
| StudentPhoto | `StudentPhoto.jsx` | ✅ Built | Admin, Case Worker, Donor Dashboard, **Donor Detail (MISSING)** |
| StudentVideo | `StudentVideo.jsx` | ✅ Built | Admin, Case Worker, **Donor Detail (MISSING)** |
| API Endpoint | `/api/students/approved/{id}` | ✅ Returns data | All pages |
| Database | Prisma Student model | ✅ Stores URLs | Backend storage |
| Donor Detail Page | `StudentDetail.jsx` | ❌ Missing display | **TARGET FOR FIX** |

**Status**: 80% Complete - Components are built and working in admin/staff views, just need to be added to donor detail page.

