# Case Worker Workflow - Technical Implementation Details

## Database Schema

```
┌─────────────────────────────────────┐
│         FieldReview Table           │
├─────────────────────────────────────┤
│ id (CUID)                           │
│ applicationId (FK → Application)    │
│ studentId (FK → Student)            │
│ officerUserId (FK → User)           │
│ taskType (ENUM) ← KEY FIELD         │
│   - DOCUMENT_REVIEW                 │
│   - FIELD_VISIT                     │
│   - CNIC_VERIFICATION               │
│   - NULL (Complete Verification)    │
├─────────────────────────────────────┤
│ status: PENDING/IN_PROGRESS/        │
│         COMPLETED                   │
│                                     │
│ Verification Fields:                │
│ ├─ homeVisitDate (DateTime)         │
│ ├─ homeVisitNotes (String)          │
│ ├─ familyInterviewNotes (String)    │
│ ├─ financialVerificationNotes       │
│ ├─ characterAssessment (String)     │
│ ├─ documentsVerified (Boolean)      │
│ ├─ identityVerified (Boolean)       │
│ ├─ familyIncomeVerified (Boolean)   │
│ ├─ educationVerified (Boolean)      │
│ ├─ verificationScore (0-100)        │
│ ├─ fielderRecommendation (String)   │
│ │   - STRONGLY_APPROVE              │
│ │   - APPROVE                       │
│ │   - CONDITIONAL                   │
│ │   - REJECT                        │
│ ├─ adminNotesRequired (String)      │
│ ├─ notes (String)                   │
│ ├─ recommendation (String)          │
│ └─ createdAt, updatedAt (DateTime)  │
└─────────────────────────────────────┘
```

---

## API Endpoints

### 1. Assign Case Worker
```
POST /api/field-reviews
Headers: { Authorization: Bearer {admin_token} }

Body:
{
  "applicationId": "app_123",
  "studentId": "student_456",
  "officerUserId": "officer_789",
  "taskType": "FIELD_VISIT" // or "DOCUMENT_REVIEW", "CNIC_VERIFICATION", or ""
}

Response (201):
{
  "review": {
    "id": "fr_abc123",
    "applicationId": "app_123",
    "studentId": "student_456",
    "officerUserId": "officer_789",
    "taskType": "FIELD_VISIT",
    "status": "PENDING",
    "createdAt": "2025-11-30T10:00:00Z"
  }
}
```

### 2. Get Case Worker's Assignments
```
GET /api/field-reviews
Headers: { Authorization: Bearer {caseworker_token} }

Response (200):
{
  "reviews": [
    {
      "id": "fr_abc123",
      "applicationId": "app_123",
      "studentId": "student_456",
      "status": "PENDING",
      "taskType": "FIELD_VISIT",
      "application": {
        "student": { name, email, phone, ... },
        ...
      },
      "officer": { name, email }
    },
    ...
  ]
}
```

### 3. Submit Review Completion
```
PATCH /api/field-reviews/:id
Headers: { Authorization: Bearer {caseworker_token} }

Body:
{
  "status": "COMPLETED",
  "notes": "Student seems trustworthy...",
  "recommendation": "STRONGLY_APPROVE",
  "homeVisitDate": "2025-11-28",
  "homeVisitNotes": "Clean home, stable family...",
  "characterAssessment": "Excellent character...",
  "verificationScore": 92,
  "fielderRecommendation": "STRONGLY_APPROVE",
  "adminNotesRequired": null
}

Response (200):
{
  "review": {
    "id": "fr_abc123",
    "status": "COMPLETED",
    "verificationScore": 92,
    "fielderRecommendation": "STRONGLY_APPROVE",
    "updatedAt": "2025-11-30T14:30:00Z"
  }
}
```

### 4. Unassign Case Worker
```
DELETE /api/field-reviews/:id
Headers: { Authorization: Bearer {admin_token} }

Response (200):
{
  "success": true,
  "message": "Application successfully unassigned from John Smith"
}
```

### 5. Reassign to Different Case Worker
```
PATCH /api/field-reviews/:id/reassign
Headers: { Authorization: Bearer {admin_token} }

Body:
{
  "newOfficerUserId": "new_officer_789"
}

Response (200):
{
  "review": {
    "id": "fr_abc123",
    "officerUserId": "new_officer_789",
    "updatedAt": "2025-11-30T14:30:00Z"
  }
}
```

---

## Email Flow Diagram

```
                    ADMIN ACTION
                        │
                        ↓
        ┌───────────────────────────────────┐
        │  POST /api/field-reviews          │
        │  (Admin assigns case worker)      │
        └───────────────────────────────────┘
                        │
                ┌───────┴───────┐
                ↓               ↓
        ┌──────────────┐  ┌──────────────┐
        │   DATABASE   │  │ EMAIL SERVICE│
        ├──────────────┤  ├──────────────┤
        │ FieldReview  │  │ Queue Email #1│
        │ created      │  │ TO: cw@...   │
        │ status:      │  │ Subject:     │
        │ PENDING      │  │ Assignment   │
        │ taskType:    │  └──────────────┘
        │ FIELD_VISIT  │
        │ (stored)     │  ┌──────────────┐
        └──────────────┘  │ Queue Email #2│
                          │ TO: student@..│
                          │ Subject:      │
                          │ CW Assigned   │
                          └──────────────┘
                                │
                    ┌───────────┴───────────┐
                    ↓                       ↓
             CASE WORKER           STUDENT
            "New Assignment"        "CW Assigned"
            • Student name          • CW name
            • Task: Field Visit      • Next steps
            • App ID                 • Link to portal
            • Login link
                    │
                    ↓
        ┌──────────────────────────┐
        │  Case Worker Logs In     │
        │  /login → /sub-admin     │
        │  Sees: pending review    │
        │  with task badge ()    │
        └──────────────────────────┘
                    │
                    ↓
        ┌──────────────────────────┐
        │  Case Worker Reviews &   │
        │  Fills Task Fields       │
        │  • Home visit date       │
        │  • Interview notes       │
        │  • Verification score    │
        │  • Recommendation        │
        └──────────────────────────┘
                    │
                    ↓
        ┌──────────────────────────┐
        │  PATCH /field-reviews/:id│
        │  status = "COMPLETED"    │
        └──────────────────────────┘
                    │
        ┌───────────┴───────────┐
        ↓                       ↓
    DATABASE             EMAIL SERVICE
    FieldReview          Query all ADMINs
    updated with:        Queue Email #3
    • status: COMPLETED  TO: admin@...,
    • all verification   TO: superadmin@..
    • score: 92          Subject:
    • recommendation:    "Field Review
    • STRONGLY_APPROVE   Complete"
                         • Student name
                         • CW recommendation
                         • Verification score
                         • "Review Now" link
                              │
                              ↓
                         ADMIN(s)
                        "Review Complete"
                        • Color-coded rec
                        • Score: 92%
                        • Flags (if any)
                        • Link to review
                              │
                              ↓
                    ┌──────────────────────┐
                    │ Admin Reviews Results│
                    │ Makes Final Decision │
                    │ Approves/Rejects    │
                    │ Application         │
                    └──────────────────────┘
```

---

## Recommendation Color Codes in Admin Email

```
STRONGLY_APPROVE  →  GREEN   (#10b981)
APPROVE           →  BLUE    (#3b82f6)
CONDITIONAL       →  AMBER   (#f59e0b)
REJECT            →  RED     (#ef4444)
```

---

## Task Type Badge Display in Case Worker Dashboard

```
DOCUMENT_REVIEW   →  Document Review
FIELD_VISIT       →  Field Visit
CNIC_VERIFICATION → 🆔 CNIC Verification
(NULL)            →  Complete Verification
```

---

## Frontend Components & Their Roles

### AdminApplicationDetail.jsx
- **Purpose:** Admin assigns case worker
- **Location:** `/admin/applications/:id`
- **Key Functions:**
  - `createAssignment()` - POST to create review
  - `reassignSubAdmin()` - PATCH to reassign
- **Task Type UI:** Dropdown with 3 options + "Complete Verification"

### SubAdminDashboard.jsx
- **Purpose:** Case worker sees assigned reviews & completes them
- **Location:** `/sub-admin`
- **Key Functions:**
  - `loadReviews()` - GET case worker's assignments
  - `updateReview()` - PATCH to submit completion
  - `requestMissingInfo()` - POST to request documents
  - `openReview()` - Open detail for editing
- **Display:** Shows taskType badge for each review

### AdminApplications.jsx
- **Purpose:** Admin lists all applications with assignments
- **Location:** `/admin/applications`
- **Key Functions:**
  - `assignSubAdmin()` - Quick assign from list view
  - `unassignSubAdmin()` - Remove assignment
  - `reassignSubAdmin()` - Assign to different CW

---

## Email Service Implementation

### Files:
- Backend: `server/src/lib/emailService.js`
- Functions:
  - `sendCaseWorkerAssignmentEmail()` - To case worker
  - `sendStudentCaseWorkerAssignedEmail()` - To student
  - `sendAdminFieldReviewCompletedEmail()` - To all admins

### Email Configuration:
```env
# .env required variables
EMAIL_FROM="AWAKE Connect <noreply@awakeconnect.org>"
FRONTEND_URL="http://localhost:8080"
# Email transporter config (Nodemailer)
SMTP_HOST=...
SMTP_PORT=...
SMTP_USER=...
SMTP_PASS=...
```

---

## Authentication & Authorization

```
ADMIN / SUPER_ADMIN:
├─ POST /api/field-reviews (Create assignment)
├─ PATCH /api/field-reviews/:id/reassign
├─ DELETE /api/field-reviews/:id (Unassign)
└─ GET /api/field-reviews (All reviews)

SUB_ADMIN / CASE_WORKER:
├─ GET /api/field-reviews (Own reviews only)
├─ PATCH /api/field-reviews/:id (Update own review)
└─ POST /api/field-reviews/:id/request-missing
```

---

## Error Handling

### Common Scenarios

**1. Duplicate Assignment**
```
Status: 400
Message: "Application is already assigned to this case worker"
```

**2. Review Not Found**
```
Status: 404
Message: "Review assignment not found"
```

**3. Unauthorized**
```
Status: 401
Message: "Invalid token"
```

**4. Invalid Case Worker**
```
Status: 404
Message: "Case worker not found"
```

---

## Performance Considerations

### Database Queries
- Field reviews filtered by `officerUserId` for case workers
- Includes: application, student, officer details
- Index on: `officerUserId`, `applicationId`, `taskType`

### Email Sending
- Async, non-blocking
- Errors logged but don't fail request
- Multiple admin notifications in loop

### Frontend State Management
- Uses React hooks (useState)
- Polling: Case worker dashboard reloads every 10-15 seconds
- Immediate local state update on success

---

## Testing Scenarios

### Test 1: Basic Assignment
1. Admin: Assign student to case worker with "FIELD_VISIT" task
2. Expected: FieldReview created with taskType="FIELD_VISIT"
3. Expected: Case worker receives email
4. Expected: Case worker sees  Field Visit badge

### Test 2: Complete Verification
1. Admin: Assign without selecting task type
2. Expected: taskType=NULL stored in database
3. Expected: Case worker sees  Complete Verification badge

### Test 3: Email Delivery
1. Admin: Assign case worker
2. Expected: Email sent to case worker within 5 seconds
3. Expected: Email sent to student within 5 seconds
4. Check: Emails appear in inbox or spam folder

### Test 4: Review Completion
1. Case worker: Opens review, fills all fields
2. Case worker: Selects recommendation (STRONGLY_APPROVE)
3. Case worker: Enters verification score (92)
4. Case worker: Clicks "Submit Review"
5. Expected: Status = "COMPLETED"
6. Expected: Admin receives email within 5 seconds
7. Expected: Email shows green badge for STRONGLY_APPROVE

### Test 5: Unassignment Fix
1. Admin: Assign case worker
2. Admin: Immediately try to unassign (within 1 second)
3. Expected: Should succeed (uses real ID from server)
4. Expected: Success message
5. Expected: Review shows "Unassigned"

---

## Known Limitations & Future Enhancements

### Current Limitations
1. Task-specific fields not enforced (case worker can submit any task with any fields)
2. No password reset in case worker dashboard
3. No completion deadline tracking
4. No case worker performance metrics

### Recommended Enhancements
1. Add task-specific field validation
2. Add completion time tracking
3. Add SLA alerts for stale reviews
4. Add case worker success rate dashboard
5. Add bulk assignment capability
6. Add review templates per task type
7. Add document checklist for specific tasks
