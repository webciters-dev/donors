# Admin Interview Scheduling Flow

## Overview
The admin arranges interviews between approved students and board members. Here's the complete step-by-step process:

---

## Step-by-Step Flow

### **Step 1: Access Interview Management**
- Admin logs in and navigates to **Admin Hub**
- Clicks on the **"Interviews"** tab
- Sees "Interview Management" section with existing scheduled interviews

**Location in Code:**
- UI: `src/pages/AdminHub.jsx` (Line 809-817)
- Component: `src/components/InterviewManager.jsx`

---

### **Step 2: Click "Schedule Interview" Button**
- Admin clicks the blue **"Schedule Interview"** button in the top-right
- This opens the **"Schedule New Interview"** form
- Form includes several fields to fill in

**Location in Code:**
- Button trigger: `InterviewManager.jsx` Line 239-244
- Form opens: `showScheduleForm` state set to `true`

---

### **Step 3: Select Student**
Admin selects a student from a dropdown that shows:
- **Student Name**
- **Student Email**

**Available Students:**
- Loaded from `/api/students` endpoint
- Any registered student can be selected

**Auto-Fill:** When student is selected, the form automatically:
- Filters applications to show only that student's applications
- If there's only ONE application, it auto-fills the Application field

**Code Location:**
```jsx
// InterviewManager.jsx Line 253-275
<Select
  value={scheduleForm.studentId}
  onValueChange={(value) => {
    // Auto-filter applications for selected student
    const studentApps = applications.filter(app => app.studentId === value);
  }}
>
```

---

### **Step 4: Select Application**
Admin selects the application to schedule interview for.

**Eligibility Requirements:**
- Application must have status: **CASE_WORKER_APPROVED**
- Cannot schedule interview for applications in other statuses
- Cannot schedule multiple interviews for same application (prevents duplicates)

**Code Location:**
- Route: `server/src/routes/interviews.js` Line 105-110
- Check: Verifies application belongs to selected student

---

### **Step 5: Set Interview Date & Time**
Admin enters:
- **Scheduled Date & Time** (required)
- Uses a date-time picker input
- Must be a future date/time

**Code Location:**
```jsx
// InterviewManager.jsx Line 280-285
<Input
  type="datetime-local"
  value={scheduleForm.scheduledAt}
  onChange={(e) => setScheduleForm(prev => ({ ...prev, scheduledAt: e.target.value }))}
/>
```

---

### **Step 6: Enter Meeting Link/Location** *(Optional)*
Admin can optionally enter:
- **Meeting Link** (e.g., Zoom URL)
- **Notes** about the interview

**Code Location:**
```jsx
// InterviewManager.jsx Line 288-298
- Meeting Link Input: Line 291-295
- Notes Textarea: Line 307-313
```

---

### **Step 7: Select Board Members** *(Critical Step)*
Admin selects which board members will interview the student.

**How It Works:**
- All **active board members** appear as checkboxes
- Admin can select **multiple board members**
- Checkboxes show: Board Member Name + Selection Status
- Board members must have `isActive: true` in database

**What Happens:**
- Selected board members become the "Interview Panel"
- They will receive email notifications
- They can later record their decisions during/after interview

**Code Location:**
```jsx
// InterviewManager.jsx Line 300-323
<label className="flex items-center space-x-2">
  <input
    type="checkbox"
    checked={scheduleForm.boardMemberIds.includes(member.id)}
    onChange={(e) => { ... }}
  />
  <span className="text-sm">{member.name}</span>
</label>
```

**Backend Validation:**
```javascript
// interviews.js Line 142-156
if (boardMemberIds.length > 0) {
  const boardMembers = await prisma.boardMember.findMany({
    where: { 
      id: { in: boardMemberIds },
      isActive: true  // Must be active
    }
  });
}
```

---

### **Step 8: Click "Schedule Interview" Button**
Admin clicks the **"Schedule Interview"** button to submit the form.

**Validation Triggered:**
1. ✅ Student ID is selected
2. ✅ Application ID is selected
3. ✅ Scheduled date/time is entered
4. ✅ At least one board member is selected (optional but recommended)

**Security:**
- **reCAPTCHA v3** token is generated before submission
- Action name: `'scheduleInterview'`
- Prevents bot-based interview spam

**Code Location:**
```jsx
// InterviewManager.jsx Line 119
const recaptchaToken = executeRecaptcha ? await executeRecaptcha('scheduleInterview') : null;
```

---

### **Step 9: Backend Processing** (Automatic)

**What the backend does:**

#### 9a. Verify All Data
```javascript
// interviews.js Line 83-138
- Verify student exists
- Verify application exists and belongs to student
- Check no interview already exists for this application
- Verify all board members exist and are active
```

#### 9b. Create Interview Record
```javascript
// interviews.js Line 160-173
await prisma.interview.create({
  data: {
    studentId,
    applicationId,
    scheduledAt,
    meetingLink,
    notes,
    status: 'SCHEDULED'  // Initial status
  }
});
```

#### 9c. Add Board Members to Panel
```javascript
// interviews.js Line 175-182
await prisma.interviewPanelMember.createMany({
  data: boardMemberIds.map(boardMemberId => ({
    interviewId: interview.id,
    boardMemberId: boardMemberId
  }))
});
```

#### 9d. Update Application Status
```javascript
// interviews.js Line 184-188
await prisma.application.update({
  where: { id: applicationId },
  data: { status: 'INTERVIEW_SCHEDULED' }  // ← Status changes here
});
```

---

### **Step 10: Email Notifications Sent** (Automatic)

#### 10a. Email to Student
**Recipient:** Student's email address

**Contents:**
- Interview date & time
- Meeting link (if provided)
- List of board members who will interview them
- Additional notes from admin
- Application ID

**Code Location:**
```javascript
// interviews.js Line 194-209
await sendInterviewScheduledStudentEmail({
  email: completeInterview.student.email,
  name: completeInterview.student.name,
  interviewId: completeInterview.id,
  scheduledAt: completeInterview.scheduledAt,
  meetingLink: completeInterview.meetingLink,
  boardMembers: completeInterview.panelMembers.map(pm => pm.boardMember),
  notes: completeInterview.notes
});
```

#### 10b. Emails to Each Board Member
**Recipients:** Each selected board member's email

**Contents for Each Board Member:**
- Student name
- Interview date & time
- Meeting link (if provided)
- Their role/title
- Notes from admin
- Whether they are chairperson

**Code Location:**
```javascript
// interviews.js Line 211-232
for (const panelMember of completeInterview.panelMembers) {
  await sendInterviewScheduledBoardMemberEmail({
    email: panelMember.boardMember.email,
    name: panelMember.boardMember.name,
    studentName: completeInterview.student.name,
    interviewId: completeInterview.id,
    scheduledAt: completeInterview.scheduledAt,
    isChairperson: panelMember.isChairperson
  });
}
```

---

### **Step 11: Frontend Updates** (Automatic)
- Toast notification: **"Interview scheduled successfully!"**
- Form clears back to empty state
- Interview list refreshes to show new interview
- Student/Application dropdowns refresh for next interview

**Code Location:**
```jsx
// InterviewManager.jsx Line 135-145
toast.success("Interview scheduled successfully!");
setScheduleForm({ ... }); // Reset form
setShowScheduleForm(false); // Close form
await loadInterviews(); // Refresh list
```

---

## Complete Workflow Summary

```
┌─────────────────────────────────────────────────────────────┐
│ ADMIN INTERVIEW SCHEDULING WORKFLOW                         │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  1. Admin goes to Admin Hub → Interviews tab               │
│                                                             │
│  2. Clicks "Schedule Interview" button                     │
│                                                             │
│  3. Form opens with fields:                                │
│     • Student dropdown (populated from /api/students)      │
│     • Application dropdown (filtered to CASE_WORKER_OK)    │
│     • Date/Time picker                                     │
│     • Meeting Link (optional)                              │
│     • Board Members checkboxes                             │
│     • Notes textarea (optional)                            │
│                                                             │
│  4. Admin selects: Student → Application → Date/Time       │
│                                                             │
│  5. Admin checks 1+ board members in "Interview Panel"      │
│                                                             │
│  6. Admin clicks "Schedule Interview"                      │
│                                                             │
│  7. reCAPTCHA v3 token generated (action: 'scheduleInterview')|
│                                                             │
│  8. Backend processes:                                      │
│     ✓ Validates all data                                   │
│     ✓ Creates interview record (status: SCHEDULED)         │
│     ✓ Links board members to interview panel               │
│     ✓ Updates app status → INTERVIEW_SCHEDULED             │
│                                                             │
│  9. Emails sent to:                                         │
│     ✓ Student (interview details)                          │
│     ✓ Each board member (assignment details)               │
│                                                             │
│ 10. Frontend updates:                                       │
│     ✓ Success toast shown                                  │
│     ✓ Form clears                                          │
│     ✓ Interview list refreshes                             │
│                                                             │
│ 11. Interview appears in "Scheduled Interviews" list        │
│     Status: SCHEDULED                                      │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## Data Model

### Interview Record Created
```javascript
{
  id: "uuid",
  studentId: "student-id",
  applicationId: "app-id",
  scheduledAt: "2025-12-20T10:00:00Z",
  meetingLink: "https://zoom.us/j/...",
  notes: "Admin notes",
  status: "SCHEDULED",
  createdAt: "2025-12-14T...",
  updatedAt: "2025-12-14T..."
}
```

### Interview Panel Members
```javascript
{
  interviewId: "interview-id",
  boardMemberId: "member-id",
  isChairperson: false,
  decision: null,
  comments: null,
  decidedAt: null
}
```

---

## Application Status Change
When interview is scheduled, the application status changes:

```
CASE_WORKER_APPROVED  →  INTERVIEW_SCHEDULED
```

This status change triggers:
- Application no longer appears in "Available for Interview" list
- Application appears in "Scheduled for Interview" list
- Cannot schedule another interview for this application

---

## Prerequisites for Interview Scheduling

| Requirement | Status | Notes |
|-----------|--------|-------|
| Admin role | REQUIRED | Only admins can schedule |
| Student exists | REQUIRED | Student must be in system |
| Application exists | REQUIRED | Application must belong to student |
| Application status | REQUIRED | Must be CASE_WORKER_APPROVED |
| Board members | OPTIONAL | Can schedule with 0 or more members |
| Board members active | REQUIRED | Only active members can be selected |
| No duplicate interview | REQUIRED | Only 1 interview per application |
| Future date/time | REQUIRED | Cannot schedule in past |

---

## Email Recipients

### Student Email
- **Recipient:** Student email from student record
- **Subject:** Interview scheduled notification
- **Contains:** Date, time, location/link, board member names

### Board Member Emails
- **Recipients:** Each selected board member's email
- **Subject:** Interview assignment notification
- **Contains:** Student name, date, time, location/link, admin notes

---

## Key Files Involved

| File | Purpose | Lines |
|------|---------|-------|
| `src/pages/AdminHub.jsx` | Admin dashboard with Interviews tab | 809-817 |
| `src/components/InterviewManager.jsx` | Interview scheduling UI component | 1-589 |
| `server/src/routes/interviews.js` | Backend interview API endpoints | 1-522 |
| `server/src/lib/emailService.js` | Email sending functions | N/A |
| `server/src/middleware/recaptcha.js` | reCAPTCHA validation | N/A |

---

## Status Transitions

```
Interview Statuses:
├── SCHEDULED      (Admin created, before interview date)
├── IN_PROGRESS    (Interview is happening)
├── COMPLETED      (Interview finished, decisions recorded)
└── CANCELLED      (Admin cancelled the interview)

Application Status After Interview Scheduled:
├── Before:  CASE_WORKER_APPROVED
└── After:   INTERVIEW_SCHEDULED
```

---

## Error Handling

| Error | HTTP Code | Message |
|-------|-----------|---------|
| Invalid student | 404 | "Student not found" |
| Invalid application | 404 | "Application not found or does not belong to this student" |
| Duplicate interview | 409 | "Interview already scheduled for this application" |
| Inactive board member | 400 | "One or more board members not found or inactive" |
| Invalid date/time | 400 | Validation error |
| Missing required fields | 400 | "Student ID, Application ID, and scheduled date/time are required" |

---

## What Happens Next?

After interview is scheduled:

1. **Student Receives Email** - Knows interview date/time and who will interview them
2. **Board Members Receive Emails** - Know they're assigned to this interview
3. **Interview Appears in List** - Shows in "Scheduled Interviews" with:
   - Student name
   - Scheduled date/time
   - Interview status (SCHEDULED)
   - Panel members assigned
   - Decision status (initially empty)

4. **On Interview Date:**
   - Admin can mark interview as IN_PROGRESS
   - Board members can access interview details
   - Board members can see student info

5. **After Interview:**
   - Board members record their APPROVED/REJECTED decisions
   - Admin can see individual board member decisions
   - Admin can make final approval decision

