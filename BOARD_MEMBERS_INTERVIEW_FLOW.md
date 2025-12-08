# Board Members / Applicant Interview Flow Documentation

## Overview
The AWAKE Connect interview process involves board member management, interview scheduling, meeting link integration, and multi-step email notifications to all stakeholders.

---

## 1. BOARD MEMBER MANAGEMENT

### 1.1 Adding Board Members (Admin Only)

**Endpoint:** `POST /api/boardMembers`  
**File:** `server/src/routes/boardMembers.js` (Line 80-139)  
**Access:** Admin only

**Request Data:**
```javascript
{
  name: "Dr. Jane Smith",
  email: "jane@example.com",
  title: "Professor of Economics",
  bio: "20 years experience in education",
  isActive: true
}
```

**Database Record Created:**
```javascript
{
  id: 1,
  name: "Dr. Jane Smith",
  email: "jane@example.com",
  title: "Professor of Economics",
  bio: "20 years experience in education",
  isActive: true,
  createdAt: timestamp,
  updatedAt: timestamp
}
```

### 1.2 Board Member Welcome Email

**Trigger:** Board member created via POST `/api/boardMembers`

**Email Function:** `sendBoardMemberWelcomeEmail()`  
**File:** `server/src/lib/emailService.js` (Line 276-318)

**Email Details:**
- **To:** Board member email
- **Subject:** "Welcome to AWAKE Connect Board - Become a Student Interviewer"
- **Content:**
  - Welcome message
  - Role explanation
  - Interview process overview
  - Link to access platform
  - Contact information

**Example:**
```
From: AWAKE Connect <noreply@aircrew.nl>
To: jane@example.com
Subject: Welcome to AWAKE Connect Board - Become a Student Interviewer

Dear Dr. Jane Smith,

Welcome to the AWAKE Connect Board! You have been invited to participate 
as a student interviewer and help evaluate applicants...

[Interview Process Details]
[Platform Access Link]
```

### 1.3 Viewing Board Members

**Endpoints:**
- `GET /api/boardMembers` - All board members (Admin only)
- `GET /api/boardMembers/active` - Only active members
- `GET /api/boardMembers/:id` - Specific board member with interview history

---

## 2. INTERVIEW SCHEDULING PROCESS

### 2.1 Admin Schedules Interview

**Endpoint:** `POST /api/interviews`  
**File:** `server/src/routes/interviews.js` (Line 106-245)  
**Access:** Admin only  
**Location:** `InterviewManager` component in admin dashboard

**Required Data:**
```javascript
{
  studentId: "student-uuid",
  applicationId: "app-uuid",
  scheduledAt: "2025-12-15T10:30:00Z",        // Interview date & time
  meetingLink: "https://zoom.us/j/...",       // Video call link (Zoom/Teams/etc)
  notes: "Applicant for Master's program",
  boardMemberIds: [1, 2, 3]                   // IDs of board members on panel
}
```

### 2.2 Interview Record Created

**Database Entry:**
```javascript
{
  id: "interview-uuid",
  studentId: "student-uuid",
  applicationId: "app-uuid",
  scheduledAt: "2025-12-15T10:30:00Z",
  meetingLink: "https://zoom.us/j/...",
  notes: "Applicant for Master's program",
  status: "SCHEDULED",
  createdAt: timestamp,
  updatedAt: timestamp
}
```

### 2.3 Panel Members Assignment

**Related Database Entry (InterviewPanelMember):**
```javascript
{
  interviewId: "interview-uuid",
  boardMemberId: 1,
  isChairperson: true,   // One person may chair the panel
  createdAt: timestamp
}
// ... repeats for each board member
```

---

## 3. EMAIL NOTIFICATIONS (Multi-Step)

### 3.1 Email Flow Timeline

When an interview is scheduled, **TWO SEPARATE EMAIL GROUPS** are triggered:

```
Schedule Interview
       ↓
   [IMMEDIATELY]
       ├─→ Email Group 1: TO STUDENT
       │    └─→ sendInterviewScheduledStudentEmail()
       │
       └─→ Email Group 2: TO BOARD MEMBERS (loop for each)
            └─→ sendInterviewScheduledBoardMemberEmail()
```

### 3.2 EMAIL 1: INTERVIEW SCHEDULED - STUDENT EMAIL

**Function:** `sendInterviewScheduledStudentEmail()`  
**File:** `server/src/lib/emailService.js` (Line 402-438)  
**Recipient:** Student email  
**Trigger Location:** `server/src/routes/interviews.js` (Line 211-219)

**Parameters Sent:**
```javascript
{
  email: student.email,
  name: student.name,
  interviewId: interview.id,
  scheduledAt: interview.scheduledAt,
  meetingLink: interview.meetingLink,
  boardMembers: [
    { name: "Dr. Jane Smith", title: "Professor" },
    { name: "Mr. Ahmed Khan", title: "Department Head" }
  ],
  notes: interview.notes,
  applicationId: application.id
}
```

**Email Content:**
```
From: AWAKE Connect <noreply@aircrew.nl>
To: student@example.com
Subject: Interview Scheduled - Important: Prepare Your Responses

Dear [Student Name],

Your interview has been scheduled! Below are the details:

📅 Date: [Formatted Date]
⏰ Time: [Formatted Time]
🎥 Meeting Link: [Zoom/Teams Link - Clickable]
📋 Interview Panel:
   • Dr. Jane Smith, Professor
   • Mr. Ahmed Khan, Department Head

📝 Additional Notes: [Interview Notes]

IMPORTANT PREPARATION TIPS:
• Test your video/audio before the meeting
• Choose a quiet location
• Have your application details ready
• Log in 5 minutes early

[Join Interview] [View My Application]

Questions? Contact us at support@aircrew.nl
```

**Sent At:** Immediately after interview creation  
**Status Tracking:** `console.log(' Student notification email sent successfully')`

---

### 3.3 EMAIL 2: INTERVIEW SCHEDULED - BOARD MEMBER EMAIL (LOOP)

**Function:** `sendInterviewScheduledBoardMemberEmail()`  
**File:** `server/src/lib/emailService.js` (Line 439-497)  
**Recipients:** Each board member on the panel (LOOP)  
**Trigger Location:** `server/src/routes/interviews.js` (Line 225-241)

**Loop Code:**
```javascript
for (const panelMember of completeInterview.panelMembers) {
  if (panelMember.boardMember.email) {
    await sendInterviewScheduledBoardMemberEmail({
      email: panelMember.boardMember.email,
      name: panelMember.boardMember.name,
      title: panelMember.boardMember.title,
      studentName: completeInterview.student.name,
      interviewId: completeInterview.id,
      scheduledAt: completeInterview.scheduledAt,
      meetingLink: completeInterview.meetingLink,
      notes: completeInterview.notes,
      applicationId: completeInterview.applicationId,
      isChairperson: panelMember.isChairperson
    });
  }
}
```

**Email Content (Example 1 - Regular Member):**
```
From: AWAKE Connect <noreply@aircrew.nl>
To: jane@example.com
Subject: Interview Assignment - Student Interview Scheduled

Dear Dr. Jane Smith,

You have been assigned to an interview panel:

👤 Student: [Student Name]
📚 Program: [University] - [Master's in Computer Science]
📅 Date: [Formatted Date]
⏰ Time: [Formatted Time]
🎥 Meeting Link: [Zoom Link - Clickable]
🎭 Your Role: Panel Member

📋 Application Summary:
   [Key details about applicant]

📝 Notes: [Interview notes]

INTERVIEW PROCESS:
1. Review student application (link included)
2. Join meeting at scheduled time
3. Participate in interview discussion
4. Submit your decision (Approve/Reject/Abstain)

[Review Application] [Join Meeting] [Record Decision]

Questions? Contact the admin.
```

**Email Content (Example 2 - Chairperson):**
```
[Same as above, but with additional notes about chairperson responsibilities]

🎭 Your Role: Panel Chairperson
   • Lead the interview discussion
   • Ensure all questions are covered
   • Summarize findings after interview
```

**Sent For Each:** Board member on the panel  
**Status Tracking:** `console.log(` Board member notification sent to: ${panelMember.boardMember.name}`)`

---

## 4. INTERVIEW EXECUTION & MEETING

### 4.1 Student View - Interview Details Page

**What Student Sees:**
- Interview scheduled date and time
- Meeting link (clickable button "Join Interview")
- Panel members list
- Interview notes
- Interview status

**Component:** Student Dashboard / Application Detail  
**Meeting Link:** Directly accessible from email or portal

### 4.2 Board Member View - Interview Manager

**Location:** Admin panel / InterviewManager component  
**File:** `src/components/InterviewManager.jsx`

**What Board Members Can See:**
- Interview schedule
- Student name and application details
- Meeting link (clickable)
- Other panel members
- Status: "SCHEDULED"

**UI Display:**
```
Interview List Item:
┌─────────────────────────────────────┐
│ Student: John Doe                   │
│ Application: #app12345 • PENDING    │
│ Scheduled: Dec 15, 2025 at 10:30 AM│
│ 🎥 Join Meeting (clickable link)   │
│                                      │
│ Interview Panel:                    │
│ • Dr. Jane Smith                    │
│ • Mr. Ahmed Khan                    │
│                                      │
│ [View Details] [Record Decision]    │
└─────────────────────────────────────┘
```

### 4.3 Meeting Execution

**Before Interview:**
- Board members receive email 24 hours before (RESERVED for future implementation)
- Board members receive email 1 hour before (RESERVED for future implementation)

**During Interview:**
- Meeting happens via the provided link (Zoom/Teams/Google Meet)
- All panel members join and evaluate student
- Notes may be taken

**After Interview:**
- Status remains "SCHEDULED" until decisions are recorded

---

## 5. DECISION RECORDING

### 5.1 Board Member Records Decision

**Endpoint:** `POST /api/interviews/:id/decisions`  
**File:** `server/src/routes/interviews.js` (Line 365-430)  
**Access:** Board members (via panel membership verification)

**Request Data:**
```javascript
{
  boardMemberId: 1,
  decision: "APPROVE",        // or "REJECT" or "ABSTAIN"
  comments: "Excellent candidate with strong academics"
}
```

### 5.2 Decision Recorded

**Database Entry (InterviewDecision):**
```javascript
{
  interviewId: "interview-uuid",
  boardMemberId: 1,
  decision: "APPROVE",
  comments: "Excellent candidate with strong academics",
  createdAt: timestamp,
  updatedAt: timestamp
}
```

**Panel Member View Updates:**
```
Interview Panel Decisions:
┌─────────────────────────────────────┐
│ Dr. Jane Smith: ✅ APPROVE          │
│   "Excellent candidate..."           │
│                                      │
│ Mr. Ahmed Khan: ⏳ PENDING          │
│   [Record Decision button]           │
└─────────────────────────────────────┘
```

---

## 6. COMPLETE EMAIL FLOW SUMMARY

### Timeline of Emails Sent

```
STEP 1: Admin schedules interview
        ↓
STEP 2: Interview record created in database
        ↓
STEP 3: IMMEDIATELY send emails (no delay)
        ├──→ TO STUDENT:
        │    Function: sendInterviewScheduledStudentEmail()
        │    Subject: "Interview Scheduled - Important: Prepare Your Responses"
        │    Includes: Date, time, meeting link, panel members, notes
        │    CTA: "Join Interview", "View Application"
        │
        └──→ TO EACH BOARD MEMBER (loop):
             Function: sendInterviewScheduledBoardMemberEmail()
             Subject: "Interview Assignment - Student Interview Scheduled"
             Includes: Student name, date, time, meeting link, role, app summary
             CTA: "Review Application", "Join Meeting", "Record Decision"

STEP 4: [FUTURE] 24 hours before interview
        ├──→ TO STUDENT: Reminder email with meeting link
        └──→ TO BOARD MEMBERS: Interview tomorrow reminder

STEP 5: [FUTURE] 1 hour before interview
        ├──→ TO STUDENT: Quick reminder, join link
        └──→ TO BOARD MEMBERS: Quick reminder, join link

STEP 6: Interview happens (via meeting link)

STEP 7: Board members record decisions via portal
        └──→ No email sent (but decision is recorded)

STEP 8: [FUTURE] If decision not submitted 48 hours after
        └──→ TO BOARD MEMBERS: Reminder to submit decision
```

---

## 7. EMAIL IMPLEMENTATION STATUS

### Currently Implemented (WORKING) ✅

| # | Email Type | Trigger | Recipients | Status |
|---|-----------|---------|-----------|--------|
| 1 | Board Member Welcome | Create member | Board member | ✅ WORKING |
| 2 | Interview Scheduled (Student) | Schedule interview | Student | ✅ WORKING |
| 3 | Interview Scheduled (Board Member) | Schedule interview | Board members (loop) | ✅ WORKING |

### Future Enhancements (TODO) 📋

| # | Email Type | Trigger | Purpose | Status |
|---|-----------|---------|---------|--------|
| 4 | Interview Reminder 24H | 24h before | Preparation reminder | ⏳ TODO |
| 5 | Interview Reminder 1H | 1h before | Quick reminder | ⏳ TODO |
| 6 | Decision Request | 48h after if no decision | Prompt board members | ⏳ TODO |

**File Reference:** `EMAIL_NOTIFICATIONS_TODO.md` (Line 137-155)

---

## 8. KEY DATABASE TABLES

### `BoardMember` Table
```
┌─────────────────────────────────────┐
│ id          | INT PRIMARY KEY       │
│ name        | VARCHAR(255)          │
│ email       | VARCHAR(255) UNIQUE   │
│ title       | VARCHAR(255)          │
│ bio         | TEXT                  │
│ isActive    | BOOLEAN (default: true)
│ createdAt   | TIMESTAMP             │
│ updatedAt   | TIMESTAMP             │
└─────────────────────────────────────┘
```

### `Interview` Table
```
┌─────────────────────────────────────┐
│ id              | UUID PRIMARY KEY  │
│ studentId       | UUID FOREIGN KEY  │
│ applicationId   | UUID FOREIGN KEY  │
│ scheduledAt     | TIMESTAMP         │
│ meetingLink     | VARCHAR(512)      │
│ notes           | TEXT              │
│ status          | VARCHAR(50)       │
│              | ("SCHEDULED",        │
│              |  "COMPLETED",        │
│              |  "CANCELLED")        │
│ createdAt       | TIMESTAMP         │
│ updatedAt       | TIMESTAMP         │
└─────────────────────────────────────┘
```

### `InterviewPanelMember` Table
```
┌─────────────────────────────────────┐
│ id              | UUID PRIMARY KEY  │
│ interviewId     | UUID FOREIGN KEY  │
│ boardMemberId   | INT FOREIGN KEY   │
│ isChairperson   | BOOLEAN           │
│ createdAt       | TIMESTAMP         │
└─────────────────────────────────────┘
```

### `InterviewDecision` Table
```
┌─────────────────────────────────────┐
│ id              | UUID PRIMARY KEY  │
│ interviewId     | UUID FOREIGN KEY  │
│ boardMemberId   | INT FOREIGN KEY   │
│ decision        | VARCHAR(50)       │
│              | ("APPROVE",          │
│              |  "REJECT",           │
│              |  "ABSTAIN")          │
│ comments        | TEXT              │
│ createdAt       | TIMESTAMP         │
│ updatedAt       | TIMESTAMP         │
└─────────────────────────────────────┘
```

---

## 9. RELATED ROUTES & ENDPOINTS

### Board Member Routes
```
GET    /api/boardMembers              - List all (Admin)
GET    /api/boardMembers/active       - List active only
GET    /api/boardMembers/:id          - Get with history
POST   /api/boardMembers              - Create (Admin)
PUT    /api/boardMembers/:id          - Update (Admin)
DELETE /api/boardMembers/:id          - Soft delete (Admin)
PATCH  /api/boardMembers/:id/toggle-status - Toggle status
```

### Interview Routes
```
GET    /api/interviews                - List all (Admin)
POST   /api/interviews                - Schedule new (Admin)
GET    /api/interviews/:id            - Get details
POST   /api/interviews/:id/decisions  - Record decision (Board member)
PATCH  /api/interviews/:id            - Update (Admin)
```

---

## 10. COMPONENT HIERARCHY

```
Admin Dashboard
├── InterviewManager Component
│   ├── Load interviews via GET /api/interviews
│   ├── Schedule Form
│   │   ├── Select student & application
│   │   ├── Set date/time
│   │   ├── Enter meeting link
│   │   └── Select board members (multi-select)
│   │
│   ├── Interview List
│   │   └── For each interview:
│   │       ├── Student info
│   │       ├── Meeting link (clickable)
│   │       ├── Panel members list
│   │       ├── [View Details] button
│   │       └── [Record Decision] button
│   │
│   └── Decision Form (if SCHEDULED status)
│       ├── Select board member from panel
│       ├── Choose decision (APPROVE/REJECT/ABSTAIN)
│       └── Add comments
│
└── Email Service (Backend)
    ├── sendInterviewScheduledStudentEmail()
    └── sendInterviewScheduledBoardMemberEmail() [loop]
```

---

## 11. COMPLETE FLOW DIAGRAM

```
┌────────────────────────────────────────────────────────────────┐
│                    INTERVIEW PROCESS FLOW                       │
└────────────────────────────────────────────────────────────────┘

PHASE 1: Board Member Setup
┌─────────────────┐
│  Admin Creates  │─ POST /api/boardMembers ─→ ✉️ Welcome Email
│  Board Member   │
└─────────────────┘

PHASE 2: Interview Scheduling
┌─────────────────────────────┐
│ Admin Uses InterviewManager │
│ to Schedule Interview       │
│ - Select Student            │
│ - Set Date & Time           │
│ - Paste Meeting Link        │
│ - Select Board Members      │
└─────────────────┬───────────┘
                  │
          POST /api/interviews
                  │
        ┌─────────┴──────────┐
        │                    │
    ✉️ EMAIL 1          ✉️ EMAIL 2 (Loop)
    Student Email       Board Member Emails
    "Interview          "Interview Assignment
     Scheduled"          - You're on Panel"
        │                    │
    Student receives:    Each Panel Member:
    - Date/Time         - Student name
    - Join Link         - Date/Time
    - Panel Members     - Join Link
    - Notes             - App Summary
    - "Join" CTA        - "Join" CTA
                        - "Record Decision" CTA

PHASE 3: Interview Execution
┌──────────────┐    ┌─────────────────┐    ┌────────────────┐
│   Student    │    │  Meeting Link   │    │ Board Members  │
│ (Via Email)  │───→│ (Zoom/Teams)    │←───│ (Via Email)    │
└──────────────┘    │                 │    └────────────────┘
                    │   Interview     │
                    │   Happens       │
                    └─────────────────┘

PHASE 4: Decision Recording
┌──────────────────────┐
│  Board Members Log   │
│  Into Portal &       │
│  Record Decision     │
│  (Approve/Reject/    │
│   Abstain)           │
└──────────┬───────────┘
           │
   POST /api/interviews/:id/decisions
           │
   Stored in InterviewDecision table
           │
   [FUTURE] Trigger decision reminder
            if not submitted after 48h

PHASE 5: Final Decision
┌─────────────────────┐
│ Admin Reviews All   │
│ Panel Decisions &   │
│ Makes Final Approval│
└─────────────────────┘
```

---

## 12. KEY CODE FILES

| File | Purpose | Key Functions |
|------|---------|----------------|
| `server/src/routes/boardMembers.js` | Board member CRUD | Create, list, update, delete members |
| `server/src/routes/interviews.js` | Interview management | Schedule, list, record decisions |
| `server/src/lib/emailService.js` | Email sending | `sendBoardMemberWelcomeEmail()`, `sendInterviewScheduledStudentEmail()`, `sendInterviewScheduledBoardMemberEmail()` |
| `src/components/InterviewManager.jsx` | Admin UI | Schedule interviews, record decisions, view panels |
| `src/pages/AdminApplicationDetail.jsx` | App detail view | Interview information section |

---

## Summary

**The Complete Interview Flow:**

1. ✅ **Admin creates Board Member** → Welcome email sent
2. ✅ **Admin schedules Interview** (date, time, meeting link, board members selected)
3. ✅ **Two emails sent immediately:**
   - Student email with interview details and join link
   - Email to EACH board member with assignment details
4. 📋 **Interview happens** via meeting link at scheduled time
5. 📋 **Board members record decisions** (Approve/Reject/Abstain) in portal
6. 📋 **[Future]** Automated reminders before & after interview
7. 📋 **[Future]** Decision reminders if not submitted within 48 hours

All emails include clickable meeting links and call-to-action buttons for direct access to join or review decisions.
