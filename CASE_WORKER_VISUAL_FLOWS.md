# Case Worker Workflow - Visual Process Maps

## Complete End-to-End Flow

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                     CASE WORKER ASSIGNMENT WORKFLOW                        │
└─────────────────────────────────────────────────────────────────────────────┘

ACTOR: ADMIN
┌───────────────────────────────────────────────────────────────────────────┐
│ 1. OPEN APPLICATION DETAIL                                               │
│    URL: /admin/applications/:applicationId                              │
│    ↓                                                                     │
│ 2. SELECT CASE WORKER                                                   │
│    Dropdown: [Case Worker Name]                                         │
│    ↓                                                                     │
│ 3. SELECT TASK TYPE (Optional)                                          │
│    [ ] Document Review Only     ( document-focused)                  │
│    [ ] Field Visit Only         ( on-site visit)                     │
│    [ ] CNIC Verification Only   (🆔 identity-focused)                  │
│    [ ] Complete Verification    (default - all checks)                 │
│    ↓                                                                     │
│ 4. CLICK "ASSIGN"                                                       │
│    POST /api/field-reviews                                             │
│    {                                                                    │
│      applicationId: "app_123",                                        │
│      studentId: "student_456",                                        │
│      officerUserId: "officer_789",                                    │
│      taskType: "FIELD_VISIT"                                          │
│    }                                                                    │
└───────────────────────────────────────────────────────────────────────────┘
                                    ↓
                        ┌──────────────────────┐
                        │  DATABASE            │
                        │  FieldReview Created │
                        │  status: PENDING     │
                        │  taskType: FIELD_VISIT
                        └──────────────────────┘
                                    ↓
                    ┌───────────────┴────────────────┐
                    ↓                                ↓
          ┌─────────────────────┐      ┌─────────────────────┐
          │  EMAIL #1: CASE WK  │      │  EMAIL #2: STUDENT  │
          ├─────────────────────┤      ├─────────────────────┤
          │ To: cw@example.com  │      │ To: student@ex.com  │
          │ Subject: New Task   │      │ Subject: CW Assigned│
          │ • Student name      │      │ • CW name           │
          │ • Task: Field Visit │      │ • Next steps        │
          │ • App ID            │      │ • Status update     │
          │ • [Review Link]     │      │                     │
          └─────────────────────┘      └─────────────────────┘
                    ↓                                ↓
                SENT                            SENT 


ACTOR: CASE WORKER
┌───────────────────────────────────────────────────────────────────────────┐
│ 5. RECEIVE EMAIL NOTIFICATION                                            │
│     inbox notification                                                 │
│    ↓                                                                     │
│ 6. CLICK "LOGIN" OR "REVIEW APPLICATION"                                │
│    Browser → /login                                                    │
│    ↓                                                                     │
│ 7. ENTER CREDENTIALS                                                    │
│    Email: cw@example.com                                               │
│    Password: [temporary password from email]                           │
│    ↓                                                                     │
│ 8. REDIRECTED TO DASHBOARD                                             │
│    URL: /sub-admin                                                     │
│    Sees: "1 Pending Review"                                            │
│    Sees: Student name + " Field Visit" badge                         │
│    ↓                                                                     │
│ 9. CLICK "OPEN REVIEW"                                                 │
│    GET /api/field-reviews                                             │
│    Returns list with taskType populated                               │
│    ↓                                                                     │
│ 10. VIEW STUDENT PROFILE                                               │
│     • Name, contact, address                                           │
│     • University, program, GPA                                         │
│     • CNIC, date of birth                                             │
│     • Guardian information                                             │
│     • Uploaded documents                                               │
│     • Application details                                              │
│     ↓                                                                     │
│ 11. FILL TASK-SPECIFIC FIELDS (because taskType = FIELD_VISIT)        │
│     • Home Visit Date: [Date Picker]                                   │
│     • Home Visit Notes: [Text]                                         │
│     • Family Interview Notes: [Text]                                   │
│     • Financial Verification: [Text]                                   │
│     • Character Assessment: [Text]                                     │
│     • Additional Notes: [Text]                                         │
│     ↓                                                                     │
│ 12. PROVIDE RECOMMENDATION                                             │
│     Select one:                                                        │
│     ◯ STRONGLY_APPROVE ( Green - highest confidence)                │
│     ◯ APPROVE ( Blue - good fit)                                    │
│     ◯ CONDITIONAL ( Amber - needs more info)                        │
│     ◯ REJECT ( Red - not suitable)                                  │
│     ↓                                                                     │
│ 13. ENTER VERIFICATION SCORE                                           │
│     Score: [Slider 0-100]                                             │
│     Example: 92 (high confidence in recommendation)                    │
│     ↓                                                                     │
│ 14. FLAG ISSUES (if any)                                               │
│      Issues requiring admin attention?                               │
│     If checked → [Text field for details]                             │
│     ↓                                                                     │
│ 15. CLICK "SUBMIT REVIEW"                                              │
│     PATCH /api/field-reviews/:id                                      │
│     {                                                                  │
│       status: "COMPLETED",                                            │
│       homeVisitDate: "2025-11-28",                                   │
│       homeVisitNotes: "...",                                         │
│       verificationScore: 92,                                         │
│       fielderRecommendation: "STRONGLY_APPROVE",                    │
│       adminNotesRequired: null                                      │
│     }                                                                  │
└───────────────────────────────────────────────────────────────────────────┘
                                    ↓
                        ┌──────────────────────┐
                        │  DATABASE            │
                        │  FieldReview Updated │
                        │  status: COMPLETED   │
                        │  All fields filled   │
                        └──────────────────────┘
                                    ↓
          ┌──────────────────────────────────────────┐
          │  EMAIL #3: ALL ADMINS                     │
          ├──────────────────────────────────────────┤
          │  To: admin@example.com, sa@example.com   │
          │  To: another-admin@example.com           │
          │  Subject:  Field Review Complete       │
          │          (Student Name - STRONGLY_APPROVE)
          │                                          │
          │  Body includes:                          │
          │  • Student name                          │
          │  • Case worker name                      │
          │  •  STRONGLY_APPROVE badge (green)     │
          │  • Verification Score: 92/100            │
          │  • Home visit notes (if any)             │
          │  • Issues flagged (if any)               │
          │  • [Review Application Now] button       │
          └──────────────────────────────────────────┘
                                    ↓
                              SENT TO ALL ADMINS


ACTOR: ADMIN(S)
┌───────────────────────────────────────────────────────────────────────────┐
│ 16. RECEIVE COMPLETION EMAIL                                             │
│      email inbox                                                       │
│     Sees:  STRONGLY_APPROVE badge (color-coded)                       │
│     Sees: Verification Score: 92%                                       │
│     ↓                                                                     │
│ 17. CLICK "REVIEW APPLICATION NOW"                                      │
│     Direct link to: /admin/applications/{applicationId}                │
│     ↓                                                                     │
│ 18. VIEW CASE WORKER'S FINDINGS                                         │
│     • Home visit notes                                                  │
│     • Interview details                                                │
│     • Verification score                                               │
│     • Recommendation (highlighted green)                               │
│     • All task-specific fields case worker filled                      │
│     ↓                                                                     │
│ 19. MAKE FINAL DECISION                                                │
│     [ ] Approve         → Move to next stage                           │
│     [ ] Reject          → Send rejection notice                        │
│     [ ] Request More Info → Ask for clarification                     │
│     ↓                                                                     │
│ 20. ADD ADMIN NOTES (optional)                                         │
│     [Text field for transparency & record-keeping]                     │
│     ↓                                                                     │
│ 21. CLICK "FINALIZE DECISION"                                          │
│     Updates Application status                                         │
│     (Sends additional email to student if needed)                     │
└───────────────────────────────────────────────────────────────────────────┘
```

---

## Data Structure - What Gets Stored

```
DATABASE STORAGE - FieldReview Table
┌────────────────────────────────────────────────────────────────┐

ASSIGNMENT INFO:
├─ id: "fr_abc123xyz" (auto-generated)
├─ applicationId: "app_123" (which student/application)
├─ studentId: "student_456" (backup reference)
├─ officerUserId: "officer_789" (which case worker)
└─ taskType: "FIELD_VISIT" (the role assigned)

STATUS TRACKING:
├─ status: "COMPLETED" (PENDING → IN_PROGRESS → COMPLETED)
├─ createdAt: "2025-11-30T10:00:00Z"
└─ updatedAt: "2025-11-30T14:30:00Z"

CASE WORKER'S FINDINGS (All stored in FieldReview):
├─ homeVisitDate: "2025-11-28"
├─ homeVisitNotes: "Clean home, stable family environment"
├─ familyInterviewNotes: "Parents very supportive of education"
├─ characterAssessment: "Student has excellent character"
├─ verificationScore: 92 (0-100 scale)
├─ fielderRecommendation: "STRONGLY_APPROVE"
├─ administativeNotesRequired: null (or warning text if flagged)
├─ identityVerified: true
├─ documentsVerified: true
├─ educationVerified: true
├─ notes: "Visited home on 2025-11-28..."
└─ recommendation: "Recommend immediate approval"

RELATIONAL REFERENCES:
├─ application: { student: {...}, university: {...} }
├─ officer: { name: "John Smith", email: "john@..." }
└─ student: { name: "Ahmed Hassan", email: "ahmed@..." }

└────────────────────────────────────────────────────────────────┘
```

---

## Email Color Coding System

```
ADMIN RECEIVES EMAIL WITH COLOR-CODED RECOMMENDATION:

┌─────────────────────────────────────────────────────────────┐
│                                                             │
│   Field Review Completed - Ahmed Hassan                  │
│                                                             │
│  ┌────────────────────────────────────────────────────────┐ │
│  │                                                        │ │
│  │  Case Worker Recommendation:                          │ │
│  │                                                        │ │
│  │  ┌──────────────────────────────────────────────┐    │ │
│  │  │   STRONGLY_APPROVE                        │    │ │
│  │  │  (Dark green background - high confidence)  │    │ │
│  │  └──────────────────────────────────────────────┘    │ │
│  │                                                        │ │
│  └────────────────────────────────────────────────────────┘ │
│                                                             │
│  Verification Score: 92/100                                │
│  [========================================] 92%            │
│                                                             │
│  Case Worker: Sarah Khan                                   │
│  Student: Ahmed Hassan                                     │
│                                                             │
│  ┌────────────────────────────────────────────────────────┐ │
│  │ [Review Application Now] ← Direct link to admin portal │ │
│  └────────────────────────────────────────────────────────┘ │
│                                                             │
└─────────────────────────────────────────────────────────────┘

COLOR LEGEND:
 STRONGLY_APPROVE  → #10b981 (Green)    - Definitely approve
 APPROVE           → #3b82f6 (Blue)     - Good candidate
 CONDITIONAL       → #f59e0b (Amber)    - Need more info first
 REJECT            → #ef4444 (Red)      - Not suitable
```

---

## Task Type Badge Display

```
CASE WORKER DASHBOARD - Shows Task Type for Each Assignment

┌────────────────────────────────────────────────────────────┐
│  Case Worker Dashboard                                     │
├────────────────────────────────────────────────────────────┤
│                                                            │
│   Pending Reviews: 3                                    │
│                                                            │
│  Student Name        | University    | Task Type         │
│  ─────────────────────┼────────────────┼────────────────   │
│  Ahmed Hassan        | COMSATS       |  Field Visit   │
│  Fatima Khan         | FAST          | 🆔 CNIC Verify   │
│  Ali Ahmed           | LSE           |  Document Rev  │
│                                                            │
│  ─────────────────────────────────────────────────────────│
│                                                            │
│   Completed Reviews: 2                                  │
│                                                            │
│  Student Name        | University    | Task Type         │
│  ─────────────────────┼────────────────┼────────────────   │
│  Zainab Malik        | Lahore Uni     |  Complete Ver  │
│  Hassan Ali          | GIKI           |  Field Visit   │
│                                                            │
└────────────────────────────────────────────────────────────┘

TASK TYPE ICONS:
 = Document Review Only (verify documents)
 = Field Visit Only (home visit required)
🆔 = CNIC Verification Only (identity focus)
 = Complete Verification (all checks)
```

---

## Status Transitions

```
FieldReview Status Lifecycle:

                    ┌─────────────┐
                    │   PENDING   │ ← Initial status after assignment
                    └──────┬──────┘
                           │
                    (Case Worker Opens)
                           │
                           ↓
                    ┌──────────────┐
                    │ IN_PROGRESS  │ ← While filling in findings
                    └──────┬───────┘
                           │
              (Case Worker Submits Review)
                           │
                           ↓
                    ┌──────────────┐
                    │  COMPLETED   │ ← Final status
                    └──────────────┘
                           │
                    (Admin receives email)
                           │
                           ↓
                    Admin makes final decision
                    on the Application
```

---

## Information Flow - From Case Worker to Admin

```
CASE WORKER SUBMITS:
┌──────────────────────────────┐
│ homeVisitDate                │
│ homeVisitNotes               │ ────┐
│ characterAssessment          │     │
│ verificationScore: 92        │     │ STORED IN
│ fielderRecommendation:       │     │ DATABASE
│ "STRONGLY_APPROVE"           │     │
│ adminNotesRequired: null     │     │
└──────────────────────────────┘     │
                                     ↓
                          ┌────────────────────┐
                          │   FieldReview DB   │
                          │   All fields saved │
                          └────────────────────┘
                                     │
                                     ↓
                    ┌────────────────────────────────┐
                    │ EMAIL SERVICE                  │
                    │ Extract fields from DB         │
                    │ Format for admin email         │
                    │ Apply color coding             │
                    └────────────────────────────────┘
                                     │
                                     ↓
          ┌──────────────────────────────────────────┐
          │ ADMIN EMAIL                              │
          ├──────────────────────────────────────────┤
          │ To: all@admins.com                       │
          │                                          │
          │ Student: Ahmed Hassan                    │
          │ Case Worker: Sarah Khan                  │
          │ ┌─────────────────────────────────────┐ │
          │ │  STRONGLY_APPROVE                 │ │
          │ │ (from fielderRecommendation)         │ │
          │ └─────────────────────────────────────┘ │
          │ Score: 92/100 (from verificationScore)  │
          │                                          │
          │ Details:                                 │
          │ • Visited: 2025-11-28                    │
          │ • Notes: "Clean home, stable..."         │
          │ • Assessment: "Excellent character"      │
          │                                          │
          │ [Review Now] → /admin/applications/...  │
          └──────────────────────────────────────────┘
```

---

## Error Prevention - Duplicate Assignment Check

```
USER: Admin tries to assign same CW to same application twice

FLOW:
┌────────────────────────────────────────────┐
│ POST /api/field-reviews                    │
│ {                                          │
│   applicationId: "app_123",               │
│   studentId: "student_456",               │
│   officerUserId: "cw_789",                │
│   taskType: "FIELD_VISIT"                 │
│ }                                          │
└────────────────────────────────────────────┘
         │
         ↓
┌────────────────────────────────────────────┐
│ DATABASE CHECK                             │
│ SELECT * FROM field_reviews WHERE         │
│   applicationId = "app_123" AND           │
│   officerUserId = "cw_789" AND            │
│   taskType = "FIELD_VISIT"                │
└────────────────────────────────────────────┘
         │
         ↓
    Already exists?
         │
    ┌────┴────┐
    │          │
   YES        NO
    │          │
    ↓          ↓
REJECT    APPROVE
┌──┐      ┌──────┐
│  │      │      │
│  │      └──────→ Create new FieldReview
│  │              Send emails
│  │
└──→ Return error: "Application is already 
                    assigned to this case worker"
```

---

## System Health Check Points

```
 MONITORING POINTS:

1. Email Delivery
   └─ Check: Are emails reaching case workers and admins?
   └─ Alert: If not delivered within 5 seconds

2. Task Type Assignment
   └─ Check: Is taskType being stored correctly?
   └─ Alert: If stored as wrong type

3. Status Transitions
   └─ Check: Are reviews moving through statuses?
   └─ Alert: If stuck in PENDING > 7 days

4. Color Coding Accuracy
   └─ Check: Are recommendations color-coded correctly?
   └─ Alert: If color doesn't match recommendation

5. Verification Score
   └─ Check: Is score stored as 0-100?
   └─ Alert: If outside range

6. Admin Notification
   └─ Check: Do all admins get notified?
   └─ Alert: If any admin doesn't receive email

7. Database Consistency
   └─ Check: Orphaned records without application?
   └─ Alert: If found

8. Token Expiry
   └─ Check: Can case worker refresh and continue?
   └─ Alert: If auth issues detected
```
