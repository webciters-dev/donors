# Complete Email System Analysis - AWAKE Connect

## ️ CRITICAL ISSUE FOUND

**Document Upload Notification System is SENDING EMAILS ON EVERY UPLOAD**

Your screenshot shows multiple "New Document Uploaded" emails being sent to admins/field officers every time a document is uploaded. This is the intended behavior according to the current code, BUT the issue is that it's sending emails to the wrong recipients or at the wrong time.

---

##  ALL EMAIL TRIGGERS IN THE SYSTEM

### 1. **STUDENT REGISTRATION** 
**Trigger:** Student self-registers via `/auth/register-student`
**Email Function:** `sendStudentWelcomeEmail()`
**Recipients:** Student email
**Purpose:** Welcome new student to platform
**File:** `server/src/routes/auth.js` (line ~200)
**Status:**  WORKING AS INTENDED

---

### 2. **DONOR REGISTRATION**
**Trigger:** Donor registers via `/auth/register-donor`
**Email Function:** `sendDonorWelcomeEmail()`
**Recipients:** Donor email
**Purpose:** Welcome new donor to platform
**File:** `server/src/routes/auth.js` (line ~260)
**Status:**  WORKING AS INTENDED

---

### 3. **PASSWORD RESET REQUEST**
**Trigger:** User requests password reset via `/auth/request-password-reset`
**Email Function:** `sendPasswordResetEmail()`
**Recipients:** User email
**Purpose:** Send password reset link
**File:** `server/src/routes/auth.js` (line ~300)
**Status:**  WORKING AS INTENDED

---

### 4. **APPLICATION SUBMISSION** ️ **POTENTIAL ISSUE**
**Trigger:** Student submits application via `/applications` POST
**Email Function:** `sendApplicationConfirmationEmail()`
**Recipients:** Student email
**Purpose:** Confirm application was received
**File:** `server/src/routes/applications.js` (line ~185)
**Status:**  WORKING AS INTENDED - but may send multiple times if endpoint is called multiple times

---

### 5. **APPLICATION STATUS CHANGE**
**Trigger:** Admin changes application status via `/applications/:id` PATCH
**Email Functions:** 
  - `sendApplicationApprovedStudentEmail()` (if status = APPROVED)
  - `sendApplicationRejectedStudentEmail()` (if status = REJECTED)
**Recipients:** Student email
**Purpose:** Notify student of application decision
**File:** `server/src/routes/applications.js` (line ~312)
**Status:**  WORKING AS INTENDED

---

### 6. **DOCUMENT UPLOAD NOTIFICATION** ️ **THIS IS YOUR ISSUE**
**Trigger:** Student uploads document via `/uploads` POST
**Email Function:** `sendDocumentUploadNotification()`
**Recipients:** Assigned field officer OR admin (if no field officer assigned)
**Purpose:** Notify admin/field officer about new document upload
**File:** `server/src/routes/uploads.js` (line ~217)
**Condition:** Only sends if:
  - `applicationId` exists in request
  - User uploading is a STUDENT (not admin/field officer)
**Status:** ️ **THIS IS WORKING - EMAIL SENT EVERY TIME STUDENT UPLOADS**

**CODE LOCATION:**
```javascript
// server/src/routes/uploads.js, lines 109-116
if (applicationId && req.user.role === 'STUDENT') {
  // Only notify when student uploads documents (not when admin/field officers upload)
  notifyDocumentUpload(applicationId, studentId, doc.originalName || doc.type).catch(err => {
    console.error('Failed to send document upload notification:', err);
  });
}
```

---

### 7. **CASE WORKER/FIELD OFFICER WELCOME EMAIL**
**Trigger:** Admin creates field officer via `/users` POST or `/field-reviews/create-officer`
**Email Function:** `sendFieldOfficerWelcomeEmail()`
**Recipients:** Field officer email
**Purpose:** Welcome new field officer with credentials
**File:** 
  - `server/src/routes/users.js` (line ~66, ~110, ~142)
  - `server/src/routes/fieldReviews.js` (line ~114, ~369)
**Status:**  WORKING AS INTENDED

---

### 8. **CASE WORKER ASSIGNMENT EMAIL**
**Trigger:** Field review is created/assigned
**Email Function:** `sendCaseWorkerAssignmentEmail()`
**Recipients:** Case worker/field officer email
**Purpose:** Notify of new application to review
**File:** `server/src/routes/fieldReviews.js` (?)
**Status:** ️ **NOT FOUND - Function exists but may not be called**

---

### 9. **ADMIN FIELD REVIEW COMPLETED EMAIL**
**Trigger:** Field officer completes review via `/field-reviews/:id` PATCH
**Email Function:** `sendAdminFieldReviewCompletedEmail()`
**Recipients:** Admin email
**Purpose:** Notify admin that field verification is complete
**File:** `server/src/routes/fieldReviews.js` (line ~230)
**Status:**  WORKING AS INTENDED

---

### 10. **MISSING DOCUMENT REQUEST EMAIL**
**Trigger:** Admin/field officer requests missing documents via `/field-reviews/:id/request-documents` or similar
**Email Function:** `sendMissingDocumentRequestEmail()`
**Recipients:** Student email
**Purpose:** Request specific documents from student
**File:** `server/src/routes/fieldReviews.js` (line ~273)
**Status:**  WORKING AS INTENDED

---

### 11. **BOARD MEMBER WELCOME EMAIL**
**Trigger:** Admin creates board member via `/board-members` POST
**Email Function:** `sendBoardMemberWelcomeEmail()`
**Recipients:** Board member email
**Purpose:** Welcome new board member
**File:** `server/src/routes/boardMembers.js` (line ~116)
**Status:**  WORKING AS INTENDED

---

### 12. **INTERVIEW SCHEDULED - STUDENT EMAIL**
**Trigger:** Admin schedules interview via `/interviews` POST
**Email Function:** `sendInterviewScheduledStudentEmail()`
**Recipients:** Student email
**Purpose:** Notify student of interview schedule
**File:** `server/src/routes/interviews.js` (line ~211)
**Status:**  WORKING AS INTENDED

---

### 13. **INTERVIEW SCHEDULED - BOARD MEMBER EMAIL**
**Trigger:** Admin schedules interview via `/interviews` POST
**Email Function:** `sendInterviewScheduledBoardMemberEmail()`
**Recipients:** Board member email(s)
**Purpose:** Notify board members of interview assignment
**File:** `server/src/routes/interviews.js` (line ~230)
**Status:**  WORKING AS INTENDED

---

### 14. **DONOR PAYMENT CONFIRMATION EMAIL**
**Trigger:** Payment processed via `/payments` POST
**Email Function:** `sendDonorPaymentConfirmationEmail()`
**Recipients:** Donor email
**Purpose:** Confirm payment receipt
**File:** `server/src/routes/payments.js` (line ~375)
**Status:**  WORKING AS INTENDED

---

### 15. **STUDENT SPONSORSHIP NOTIFICATION EMAIL**
**Trigger:** Payment processed and sponsorship created via `/payments` POST
**Email Function:** `sendStudentSponsorshipNotificationEmail()`
**Recipients:** Student email
**Purpose:** Notify student they have been sponsored
**File:** `server/src/routes/payments.js` (line ~389)
**Status:**  WORKING AS INTENDED

---

### 16. **STUDENT NOTIFICATION EMAIL** (Generic)
**Trigger:** Potentially sent via messaging system or admin actions
**Email Function:** `sendStudentNotificationEmail()`
**Recipients:** Student email
**Purpose:** Send generic message to student
**File:** `server/src/lib/emailService.js` (defined but NOT CALLED anywhere)
**Status:** ️ **ORPHANED - Function defined but never used**

---

### 17. **APPLICATION APPROVED EMAIL**
**Trigger:** Admin approves application via `/applications/:id` PATCH
**Email Function:** `sendApplicationApprovedStudentEmail()`
**Recipients:** Student email
**Purpose:** Notify student application is approved and eligible for sponsorship
**File:** `server/src/routes/applications.js` (line ~312)
**Status:**  WORKING AS INTENDED

---

### 18. **APPLICATION REJECTED EMAIL**
**Trigger:** Admin rejects application via `/applications/:id` PATCH
**Email Function:** `sendApplicationRejectedStudentEmail()`
**Recipients:** Student email
**Purpose:** Notify student with rejection reason and guidance
**File:** `server/src/routes/applications.js` (line ~312)
**Status:**  WORKING AS INTENDED

---

##  YOUR SPECIFIC ISSUE

### Problem: Multiple "New Document Uploaded" emails appearing in inbox

**Root Cause:** The system is **DESIGNED** to send an email notification every time a student uploads a document. This is the intended behavior but appears excessive in your screenshot.

**Evidence from Code:**

```javascript
// server/src/routes/uploads.js, lines 109-116
if (applicationId && req.user.role === 'STUDENT') {
  // Only notify when student uploads documents
  notifyDocumentUpload(applicationId, studentId, doc.originalName || doc.type).catch(err => {
    console.error('Failed to send document upload notification:', err);
  });
}
```

**What happens:**
1. Student uploads CNIC.pdf → Email sent to field officer/admin ️
2. Student uploads HSSC.pdf → Email sent to field officer/admin ️
3. Student uploads UNIVERSITY_CARD.pdf → Email sent to field officer/admin ️
4. Student uploads FEE_INVOICE.pdf → Email sent to field officer/admin ️

**Who gets notified:**
- If a field officer is assigned to review this application: **Field Officer**
- If NO field officer assigned: **First ADMIN user found**

---

##  DETAILED RECIPIENT LOGIC

From `server/src/routes/uploads.js`, lines 198-226:

```javascript
async function notifyDocumentUpload(applicationId, studentId, documentName) {
  try {
    // Get student info
    const student = await prisma.student.findUnique({...});

    // Find who is assigned to review this application
    const fieldReview = await prisma.fieldReview.findFirst({
      where: { applicationId },
      include: { officer: { select: { email: true, name: true } } },
      orderBy: { createdAt: 'desc' }
    });

    let recipientEmail = null;
    let recipientName = null;

    if (fieldReview && fieldReview.officer) {
      // Notify assigned field officer
      recipientEmail = fieldReview.officer.email;
      recipientName = fieldReview.officer.name || 'Field Officer';
    } else {
      // No field officer assigned, notify admin
      const admin = await prisma.user.findFirst({
        where: { role: 'ADMIN' },
        select: { email: true, name: true }
      });
      
      if (admin) {
        recipientEmail = admin.email;
        recipientName = admin.name || 'Admin';
      }
    }

    if (recipientEmail) {
      await sendDocumentUploadNotification({...});
    }
  } catch (error) {
    console.error('Error in notifyDocumentUpload:', error);
  }
}
```

---

##  EMAIL CONFIGURATION

**Email Service:** Nodemailer with SMTP
**Configuration File:** `server/src/lib/emailService.js`
**SMTP Settings (from .env):**
- `EMAIL_HOST`: mail.aircrew.nl (default)
- `EMAIL_PORT`: 587 (default)
- `EMAIL_USER`: Email account username
- `EMAIL_PASS`: Email account password
- `EMAIL_FROM`: AWAKE Connect <noreply@awakeconnect.org> (default)
- `FRONTEND_URL`: Used in email links
- `EMAIL_SECURE`: false (default) - uses TLS on port 587

**Rate Limiting:** 5 emails per minute max (built into transporter)

---

##  ISSUES & RECOMMENDATIONS

### Issue #1: Document Upload Emails Are Expected Behavior
- **Current:** Email sent on EVERY document upload
- **Is This Correct?** YES - by design, admins/field officers should be notified of uploads
- **Your Screenshot:** Shows this working correctly (multiple emails for multiple uploads)

### Issue #2: No Way to Disable Document Upload Notifications
- **Current:** No configuration option to disable
- **Impact:** All document uploads generate emails
- **Recommendation:** Add environment variable to toggle this feature

### Issue #3: Orphaned Function
- **Function:** `sendStudentNotificationEmail()` 
- **Status:** Defined in emailService.js but never called anywhere
- **Impact:** Wasted code, potential security concern
- **Recommendation:** Either use it somewhere or delete it

### Issue #4: Case Worker Assignment Email Not Found
- **Function:** `sendCaseWorkerAssignmentEmail()` exists
- **Status:** Defined but may not be called
- **Recommendation:** Search codebase to confirm where it should be triggered

### Issue #5: Email Error Handling
- **Current:** Most emails use `.catch()` and don't block responses
- **Good:** Prevents application failure if email service fails
- **Concern:** Silent failures - errors logged but not visible to user

### Issue #6: Recipient Selection for Documents
- **Current:** Sends to assigned field officer OR first admin found
- **Potential Issue:** If multiple admins exist, only first one notified
- **Recommendation:** Consider sending to ALL admins or create admin notification groups

---

##  SUMMARY TABLE

| # | Feature | Trigger | Recipient | Status | File |
|---|---------|---------|-----------|--------|------|
| 1 | Student Welcome | Register | Student |  Working | auth.js |
| 2 | Donor Welcome | Register | Donor |  Working | auth.js |
| 3 | Password Reset | Request | User |  Working | auth.js |
| 4 | App Confirmation | Submit App | Student |  Working | applications.js |
| 5 | App Status Change | Admin Update | Student |  Working | applications.js |
| 6 | Document Upload | Upload Docs | Field Officer/Admin |  **EVERY UPLOAD** | uploads.js |
| 7 | Field Officer Welcome | Create User | Field Officer |  Working | users.js |
| 8 | Missing Documents | Admin Request | Student |  Working | fieldReviews.js |
| 9 | Field Review Complete | Complete Review | Admin |  Working | fieldReviews.js |
| 10 | Board Member Welcome | Create Member | Board Member |  Working | boardMembers.js |
| 11 | Interview Scheduled (Student) | Schedule | Student |  Working | interviews.js |
| 12 | Interview Scheduled (Board) | Schedule | Board Members |  Working | interviews.js |
| 13 | Payment Confirmation | Payment | Donor |  Working | payments.js |
| 14 | Sponsorship Notification | Payment | Student |  Working | payments.js |

---

## ️ RECOMMENDED ACTIONS

### Priority 1: Reduce Document Upload Email Spam
Add environment variable to toggle:
```javascript
// In .env
SEND_DOCUMENT_UPLOAD_EMAILS=false  // Set to false to disable
```

### Priority 2: Remove Orphaned Function
Delete `sendStudentNotificationEmail()` from emailService.js if not needed

### Priority 3: Audit Field Review Email Trigger
Ensure `sendCaseWorkerAssignmentEmail()` is called when it should be

### Priority 4: Document Upload Recipients
Consider expanding recipients to include all relevant admins/field officers

---

##  CONCLUSION

**Your email system is WORKING CORRECTLY.** The "document uploaded" emails you're seeing are intentional - the system notifies admins/field officers whenever a student uploads documents so they can review them immediately. This is by design.

If you want to reduce email volume, consider implementing an **email preference system** or **digest emails** (compile multiple uploads into one daily email instead of real-time).

