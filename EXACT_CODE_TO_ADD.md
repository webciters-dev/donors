# EXACT CODE TO ADD - Donor Video & Picture Display

## Summary
Add student photo and introduction video to the donor's student detail page.

**File to modify**: `c:\projects\donor\src\pages\StudentDetail.jsx`

**Effort**: 30 lines of code, ~5 minutes

---

## Step 1: Add Imports

**Location**: Top of file, around line 10 (after other imports)

**Current imports** (lines 1-12):
```jsx
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, GraduationCap, DollarSign, FileText, Users, MapPin, Calendar, Mail, Phone } from "lucide-react";
import DonorStudentMessaging from "@/components/DonorStudentMessaging";
import { mockData } from "@/data/mockData";
import { toast } from "sonner";
import { useAuth } from "@/lib/AuthContext";
import { getCurrencyFromCountry, fmtAmount, fmtAmountDual } from "@/lib/currency";
import { API } from "@/lib/api";
```

**Add these three lines** after the existing imports:
```jsx
import StudentPhoto from "@/components/StudentPhoto";
import StudentVideo from "@/components/StudentVideo";
import { Video } from "lucide-react";
```

**Result** (lines 1-15):
```jsx
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, GraduationCap, DollarSign, FileText, Users, MapPin, Calendar, Mail, Phone, Video } from "lucide-react";
import DonorStudentMessaging from "@/components/DonorStudentMessaging";
import StudentPhoto from "@/components/StudentPhoto";
import StudentVideo from "@/components/StudentVideo";
import { mockData } from "@/data/mockData";
import { toast } from "sonner";
import { useAuth } from "@/lib/AuthContext";
import { getCurrencyFromCountry, fmtAmount, fmtAmountDual } from "@/lib/currency";
import { API } from "@/lib/api";
```

---

## Step 2: Add Photo & Video Display Card

**Location**: In the return statement's JSX, around line 270 (after Personal Introduction section)

**Find this section** (around lines 265-285):
```jsx
      {/* Personal Introduction */}
      {student.personalIntroduction && (
        <Card className="p-6">
          <SectionTitle icon={Users} title="About Me & My Family" />
          <div className="mt-4">
            <div className="prose prose-sm max-w-none">
              <p className="text-slate-700 leading-relaxed whitespace-pre-wrap">{student.personalIntroduction}</p>
            </div>
          </div>
        </Card>
      )}

      {/* Donor-Student Messaging */}
      <DonorStudentMessaging 
        student={student} 
        user={user} 
        token={token} 
      />
```

**Insert this new Card BETWEEN Personal Introduction and Messaging** (between the two sections):
```jsx
      {/* Meet the Student - Photo and Video */}
      {(student.photoUrl || student.introVideoUrl) && (
        <Card className="p-6">
          <SectionTitle icon={Users} title="Meet the Student" />
          <div className="mt-4 grid md:grid-cols-2 gap-6">
            {/* Photo Column */}
            {student.photoUrl && (
              <div>
                <h4 className="font-medium text-sm mb-3 text-slate-700">Student Photo</h4>
                <StudentPhoto 
                  student={student}
                  size="large"
                  className="shadow-lg border-2 border-gray-200"
                  clickable={true}
                />
              </div>
            )}
            
            {/* Video Column */}
            {student.introVideoUrl && (
              <div>
                <h4 className="font-medium text-sm mb-3 text-slate-700">Introduction Video</h4>
                <p className="text-sm text-slate-600 mb-3">
                  {student.name} shares their educational goals and aspirations.
                </p>
                <StudentVideo 
                  student={student}
                  size="large"
                />
              </div>
            )}
          </div>
        </Card>
      )}
```

---

## Complete Context - What It Should Look Like

**Before (Current - MISSING photo/video)**:
```jsx
      {/* Personal Introduction */}
      {student.personalIntroduction && (
        <Card className="p-6">
          <SectionTitle icon={Users} title="About Me & My Family" />
          <div className="mt-4">
            <div className="prose prose-sm max-w-none">
              <p className="text-slate-700 leading-relaxed whitespace-pre-wrap">{student.personalIntroduction}</p>
            </div>
          </div>
        </Card>
      )}

      {/* Donor-Student Messaging */}
      <DonorStudentMessaging 
        student={student} 
        user={user} 
        token={token} 
      />
```

**After (With photo/video added)**:
```jsx
      {/* Personal Introduction */}
      {student.personalIntroduction && (
        <Card className="p-6">
          <SectionTitle icon={Users} title="About Me & My Family" />
          <div className="mt-4">
            <div className="prose prose-sm max-w-none">
              <p className="text-slate-700 leading-relaxed whitespace-pre-wrap">{student.personalIntroduction}</p>
            </div>
          </div>
        </Card>
      )}

      {/* Meet the Student - Photo and Video */}
      {(student.photoUrl || student.introVideoUrl) && (
        <Card className="p-6">
          <SectionTitle icon={Users} title="Meet the Student" />
          <div className="mt-4 grid md:grid-cols-2 gap-6">
            {/* Photo Column */}
            {student.photoUrl && (
              <div>
                <h4 className="font-medium text-sm mb-3 text-slate-700">Student Photo</h4>
                <StudentPhoto 
                  student={student}
                  size="large"
                  className="shadow-lg border-2 border-gray-200"
                  clickable={true}
                />
              </div>
            )}
            
            {/* Video Column */}
            {student.introVideoUrl && (
              <div>
                <h4 className="font-medium text-sm mb-3 text-slate-700">Introduction Video</h4>
                <p className="text-sm text-slate-600 mb-3">
                  {student.name} shares their educational goals and aspirations.
                </p>
                <StudentVideo 
                  student={student}
                  size="large"
                />
              </div>
            )}
          </div>
        </Card>
      )}

      {/* Donor-Student Messaging */}
      <DonorStudentMessaging 
        student={student} 
        user={user} 
        token={token} 
      />
```

---

## Visual Layout (What Donors Will See)

```
┌─────────────────────────────────────────────────────────────┐
│ Meet the Student                                            │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│ [Desktop View - 2 Columns]                                 │
│ ┌──────────────────┬──────────────────────────────────┐   │
│ │  Student Photo   │  Introduction Video              │   │
│ │  (large)         │                                  │   │
│ │  [████████]      │  [Video Player]                  │   │
│ │  [████████]      │  • Play/Pause controls           │   │
│ │  [████████]      │  • Duration: 1:25                │   │
│ │  [████████]      │  • Volume control                │   │
│ │                  │                                  │   │
│ └──────────────────┴──────────────────────────────────┘   │
│                                                             │
│ [Mobile View - Stacked]                                    │
│ ┌─────────────────────────────────────────────────────┐   │
│ │  Student Photo                                      │   │
│ │  [████████████████████████]                         │   │
│ │  [████████████████████████]                         │   │
│ └─────────────────────────────────────────────────────┘   │
│ ┌─────────────────────────────────────────────────────┐   │
│ │  Introduction Video                                │   │
│ │  [████████████████████████]                         │   │
│ └─────────────────────────────────────────────────────┘   │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## Features of This Implementation

✅ **Responsive Design**
- 2 columns on desktop (photo left, video right)
- Stacked on mobile (photo above video)

✅ **Conditional Rendering**
- Only shows section if photo OR video exists
- Each column shows only if that data exists
- No empty placeholders in final view

✅ **Consistent Styling**
- Matches existing Card style
- Uses SectionTitle component (consistent with page)
- Shadow and border styling matches other sections

✅ **Accessible**
- Video has native HTML5 controls
- Photo includes alt text
- Proper heading hierarchy

✅ **User Experience**
- Photo is clickable for full-size view
- Video plays inline with standard browser controls
- Clear visual hierarchy

---

## Testing Checklist

After adding the code:

- [ ] Page loads without errors at `/students/{studentId}`
- [ ] Photo displays on desktop (2-column view)
- [ ] Video displays on desktop (2-column view)
- [ ] Mobile view stacks vertically
- [ ] Photo placeholder shows if no photo uploaded
- [ ] Video placeholder shows if no video uploaded
- [ ] Video controls work (play, pause, volume)
- [ ] Responsive resizing works
- [ ] Both desktop and mobile look good
- [ ] Can still scroll to messaging and sponsorship sections below

---

## Before & After Summary

| Aspect | Before | After |
|--------|--------|-------|
| **What donors see** | Name, background, goals, application | Name, background, goals, **PHOTO**, **VIDEO**, application |
| **Experience** | Incomplete profile | Complete profile |
| **Matches design intent** | ❌ Missing visuals | ✅ Shows person & their voice |
| **Matches admin view** | ❌ Different | ✅ Same components |
| **Lines added** | - | ~30 |
| **Components used** | 10+ | 12+ (2 new) |
| **API response** | Photo/video URLs ignored | Photo/video URLs used |

---

## Code Diff Summary

```diff
--- a/src/pages/StudentDetail.jsx
+++ b/src/pages/StudentDetail.jsx
@@ imports

+import StudentPhoto from "@/components/StudentPhoto";
+import StudentVideo from "@/components/StudentVideo";

 // Change existing import to include Video icon
-import { ArrowLeft, GraduationCap, DollarSign, FileText, Users, MapPin, Calendar, Mail, Phone } from "lucide-react";
+import { ArrowLeft, GraduationCap, DollarSign, FileText, Users, MapPin, Calendar, Mail, Phone, Video } from "lucide-react";

@@ JSX section (around line 270)

       {/* Personal Introduction */}
       ...existing code...
       {/* /Personal Introduction */}

+      {/* Meet the Student - Photo and Video */}
+      {(student.photoUrl || student.introVideoUrl) && (
+        <Card className="p-6">
+          ...new Card code...
+        </Card>
+      )}

       {/* Donor-Student Messaging */}
       ...existing code...
```

---

## Line Numbers Reference

| Section | File | Lines |
|---------|------|-------|
| **Imports to add** | `StudentDetail.jsx` | 1-15 |
| **Insert location** | `StudentDetail.jsx` | ~270-280 |
| **New Card section** | `StudentDetail.jsx` | 30 lines |
| **Total changes** | `StudentDetail.jsx` | ~35 lines |

---

## That's It! 🎉

This adds student photos and introduction videos to the donor student detail page.

**Result**: Donors can now see student photos and watch their introduction videos when viewing student profiles, completing the promised experience.

