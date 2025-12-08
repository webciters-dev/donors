# Donor Video & Picture Viewing - Quick Summary

## Where Donors Can Currently View Student Videos & Pictures

### ✅ CURRENTLY WORKING
1. **Donor Dashboard** (`/donor/dashboard`)
   - Shows student thumbnail photos in grid
   - Component: `StudentPhoto.jsx` (size="thumbnail")
   - Used in: `DonorDashboard.jsx` line 246

### ❌ MISSING / NOT YET IMPLEMENTED
1. **Student Detail Page** (`/students/{studentId}`)
   - This is where donors click to learn about a specific student
   - **Currently shows**: Name, program, university, background, application details
   - **Missing**: Full student photo and introduction video
   - Component file: `StudentDetail.jsx`

---

## The Flow

```
Donor Login
    ↓
Browse Marketplace or Dashboard
    ↓
Click "Student Details" button
    ↓
View Student Profile (/students/{studentId})
    ├─ Student Info ✅
    ├─ Background Details ✅
    ├─ Application Details ✅
    ├─ Student Photo ❌ MISSING
    ├─ Intro Video ❌ MISSING
    └─ Sponsorship Button ✅
```

---

## Components Available But Not Yet Used in Donor View

### StudentPhoto Component
- **File**: `src/components/StudentPhoto.jsx`
- **Current Use**: Admin view, case worker view, donor dashboard thumbnail
- **What it does**: Displays student profile photo with fallback placeholder
- **Sizes available**: thumbnail, small, medium, large, full

### StudentVideo Component  
- **File**: `src/components/StudentVideo.jsx`
- **Current Use**: Admin view, case worker view
- **What it does**: Plays student introduction video inline with HTML5 video player
- **Features**: Native controls, poster image, duration display

---

## Key Files

| File | Purpose | Status |
|------|---------|--------|
| `src/pages/StudentDetail.jsx` | Donor viewing student profile | Needs photo/video added |
| `src/components/StudentPhoto.jsx` | Displays student photos | ✅ Ready to use |
| `src/components/StudentVideo.jsx` | Plays introduction videos | ✅ Ready to use |
| `server/src/routes/students.js` | API endpoint for student data | ✅ Returns photo/video URLs |

---

## API Response Example

When donors access `/api/students/approved/{studentId}`, they get:

```json
{
  "student": {
    "id": "student-uuid",
    "name": "Ahmed Khan",
    "university": "LUMS",
    "program": "Computer Science",
    "gpa": 3.8,
    "photoUrl": "/uploads/photos/student-uuid.jpg",
    "photoThumbnailUrl": "/uploads/photos/thumbnails/student-uuid-thumb.jpg",
    "introVideoUrl": "/uploads/videos/intro-uuid.mp4",
    "introVideoThumbnailUrl": "/uploads/videos/thumbnails/intro-uuid-thumb.jpg",
    "introVideoDuration": 85,
    "personalIntroduction": "My name is Ahmed...",
    "careerGoals": "I want to become...",
    "application": { "amount": 5000, "currency": "USD" }
  }
}
```

---

## What's Already Built (Admin/Staff View Shows This)

```jsx
// From AdminApplicationDetail.jsx - line 290-312
<Card className="p-6">
  <h4>Profile Photo</h4>
  <StudentPhoto student={app.student} size="large" />
  
  <h4>Introduction Video</h4>
  <StudentVideo student={app.student} size="large" />
</Card>
```

---

## What Needs to Be Added (Donor View)

Add to `StudentDetail.jsx` around line 260-300:

```jsx
{/* Student Photo and Video Section */}
<Card className="p-6">
  <SectionTitle icon={Users} title="Meet the Student" />
  <div className="grid md:grid-cols-2 gap-6 mt-4">
    {/* Photo */}
    <div>
      <h4 className="font-medium mb-3">Student Photo</h4>
      <StudentPhoto 
        student={student}
        size="large"
        className="shadow-lg border-2 border-gray-200"
      />
    </div>
    
    {/* Video */}
    <div>
      <h4 className="font-medium mb-3">Introduction Video</h4>
      <StudentVideo 
        student={student}
        size="large"
      />
    </div>
  </div>
</Card>
```

---

## Summary Table

| Aspect | Status | Location |
|--------|--------|----------|
| **Video component built** | ✅ Yes | `StudentVideo.jsx` |
| **Photo component built** | ✅ Yes | `StudentPhoto.jsx` |
| **Used by admins** | ✅ Yes | `AdminApplicationDetail.jsx` |
| **Used by case workers** | ✅ Yes | `SubAdminApplicationDetail.jsx` |
| **Used in donor dashboard** | ✅ Photos only | `DonorDashboard.jsx` line 246 |
| **Used in donor detail page** | ❌ No | `StudentDetail.jsx` |
| **Database stores photos** | ✅ Yes | `Student.photoUrl` |
| **Database stores videos** | ✅ Yes | `Student.introVideoUrl` |
| **API returns photos** | ✅ Yes | `/api/students/approved/{id}` |
| **API returns videos** | ✅ Yes | `/api/students/approved/{id}` |

---

## To Complete Implementation

1. Add import statements to `StudentDetail.jsx`
2. Add photo/video Card section in StudentDetail JSX
3. Test on `/students/{studentId}` page
4. Done! Donors will now see full student profiles with photos and videos

