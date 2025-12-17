# AWAKE Connect - Complete Platform Manual

**Version:** 2.0 (Accurate)  
**Last Updated:** December 17, 2025  
**Status:** Active & Verified Against Codebase

---

## Table of Contents

1. [Overview](#overview)
2. [User Roles & Access](#user-roles--access)
3. [Student Journey](#student-journey)
4. [Donor Journey](#donor-journey)
5. [Admin Portal](#admin-portal)
6. [Case Worker Operations](#case-worker-operations)
7. [Interview & Board Member Process](#interview--board-member-process)
8. [Sponsorship Model](#sponsorship-model)
9. [Technical Features](#technical-features)
10. [FAQ & Troubleshooting](#faq--troubleshooting)

---

## Overview

**AWAKE Connect** is an education sponsorship platform that connects deserving students with donors for complete educational support. The platform manages the entire lifecycle from student application through sponsorship and progress tracking.

### Key Features
- ✅ Student profile creation and application submission
- ✅ Donor marketplace with approved student browsing
- ✅ Complete education sponsorship (one-to-one model)
- ✅ Admin review and approval workflow
- ✅ Case worker field verification
- ✅ Board member interview system
- ✅ Progress tracking and updates
- ✅ Direct messaging between students and sponsors
- ✅ Video introduction and photo uploads

### Supported Currencies
- USD (US Dollar) - Primary
- PKR (Pakistani Rupees)
- EUR (Euro)
- GBP (British Pound)
- CAD (Canadian Dollar)
- AUD (Australian Dollar)

---

## User Roles & Access

### 1. STUDENT
**Purpose:** Create applications and receive sponsorship

**Access:**
- Create and manage own profile
- Submit applications for funding
- Upload profile photo and introduction video
- Upload required documents
- View application status
- Receive messages from admins and sponsors
- Message sponsors (only if sponsored)
- Track progress updates
- View sponsorship details (if approved)

**Key Permissions:**
- ✅ View own profile only
- ✅ Create applications
- ✅ Upload documents/media
- ✅ Submit for review
- ❌ Cannot review own application
- ❌ Cannot access admin panel

---

### 2. DONOR
**Purpose:** Browse approved students and sponsor complete education

**Access:**
- Browse marketplace of approved unsponsored students
- View detailed student profiles
- Sponsor complete education of one student (one-to-one model)
- Make full payment via Stripe
- View sponsored students
- Message sponsored students
- Manage sponsorships
- Download tax receipts
- View payment history

**Key Permissions:**
- ✅ Sponsor one student = complete education coverage
- ✅ Message only students they sponsor
- ✅ View student progress after sponsorship
- ❌ Cannot modify sponsorship amount
- ❌ Cannot cancel sponsorship after payment
- ❌ No partial sponsorships

---

### 3. ADMIN
**Purpose:** Manage applications and platform operations

**Access:**
- Review all applications
- Assign case workers for field verification
- Schedule interviews with board members
- Make final approval/rejection decisions
- Manage university database
- View audit logs
- Manage board members
- Generate reports and exports
- Monitor platform statistics
- Create case worker accounts

**Key Permissions:**
- ✅ Review applications
- ✅ Assign field reviews
- ✅ Schedule interviews
- ✅ Approve/reject applications
- ✅ View all platform data
- ❌ Cannot directly disburse to universities (NOT part of system)
- ❌ Cannot create other admin accounts

---

### 4. CASE WORKER (Sub-Admin)
**Purpose:** Conduct field verification and assessment

**Access:**
- View assigned applications
- Conduct field visits
- Verify documents and identity
- Submit field verification reports
- Provide recommendations (Approve/Reject/Conditional)
- Request missing information
- View case progress

**Key Permissions:**
- ✅ Complete field reviews
- ✅ Verify documents
- ✅ Make recommendations
- ✅ Request missing docs
- ❌ Cannot make final decisions
- ❌ Cannot schedule interviews

---

### 5. BOARD MEMBER
**Purpose:** Conduct interviews and make final approval decisions

**Access:**
- View scheduled interviews
- Participate in interview panels
- Record interview decisions
- Vote on student approval
- Access student application details
- Provide interview notes

**Key Permissions:**
- ✅ Conduct interviews
- ✅ Vote on approval/rejection
- ✅ Provide feedback
- ❌ Cannot approve without interview
- ❌ Cannot override admin decisions

---

### 6. SUPER ADMIN
**Purpose:** System administration and security

**Access:**
- Create admin accounts
- Manage IP whitelist (admin panel security)
- View comprehensive audit logs
- System configuration
- Database management

**Key Permissions:**
- ✅ Create ADMIN accounts only
- ✅ Manage security settings
- ✅ View all audit logs
- ❌ Cannot create case workers (ADMIN does this)
- ❌ Cannot manage applications directly

---

## Student Journey

### Phase 1: Registration & Profile Setup

#### Step 1: Create Account
1. Click "Register as Student"
2. Enter email and password
3. Complete reCAPTCHA verification
4. Account is created in DRAFT state

#### Step 2: Complete Profile (First Step of Application)
Required Information:
- **Personal Details**
  - Full name, gender, date of birth
  - CNIC (Pakistan National ID)
  - Phone number, address
  - City, province, country

- **Guardian Information**
  - Primary guardian name and CNIC
  - Secondary guardian info (optional)
  - Contact numbers

- **Profile Media**
  - **Photo:** Upload JPG, PNG, or WebP (max 3MB) → Automatically converted and cached
  - **Introduction Video:** Record or upload 60-90 seconds MP4/MOV/AVI/WebM (max 100MB)
  - Videos must be between 60-90 seconds

- **Social Media** (Optional)
  - Facebook, Instagram, WhatsApp, LinkedIn, Twitter, TikTok handles

- **Academic Information**
  - Current school/institution
  - Current city and completion year
  - Degree level (Associate, Bachelor's, Master's, etc.)
  - Field of study
  - Expected graduation year

#### Step 3: Personal Introduction
Share your:
- Background and family situation
- Academic achievements
- Career goals
- Community involvement
- Motivation for higher education
- Maximum 1000 characters

**Status After Step 1:** Application is DRAFT (can be edited before submission)

---

### Phase 2: Application Submission

#### Step 2: Education & Financial Information

Required:
- **University Selection**
  - Country (currently: Pakistan)
  - University name (from database or "Other")
  - Program field (Computer Science, Engineering, etc.)
  - Program name (specific program)
  - Expected graduation year
  - GPA (cumulative)

- **Financial Details**
  - Education cost amount
  - Currency selection (USD, PKR, EUR, etc.)
  - Breakdown (optional):
    - Tuition fee
    - Hostel fee
    - Other expenses
  - Family income range
  - Family contribution amount

#### Step 3: Document Upload

**Required Documents:**
1. **CNIC** (Pakistan ID Card)
2. **Guardian CNIC**
3. **Fee Invoice** (University admission letter with fees)
4. **SSC Result** (10th grade)
5. **HSSC Result** (12th grade)
6. **Income Certificate** (Proof of family income)
7. **Utility Bill** (Address proof)

**Optional Documents:**
- Enrollment Certificate
- Transcript
- Degree Certificate
- Income documentation
- Other supporting documents

**File Requirements:**
- Format: PDF, JPG, PNG, WebP
- Max size: 5MB per file
- All required docs must be uploaded before submission

#### Step 4: Submit for Review

1. Review application completeness
2. System validates all required fields
3. Click "Submit Application"
4. Status changes to **PENDING** ✓

**After Submission:**
- ✉️ Confirmation email sent to student
- ✉️ Notification sent to admin
- Application enters review queue

---

### Phase 3: Application Review & Decision

#### Status Progression

```
DRAFT (In Progress)
    ↓
PENDING (Submitted for Review)
    ↓
PROCESSING (Admin initial review)
    ↓
[APPROVED] ← → [REJECTED]
    ↓
ACTIVE (Ready for sponsorship marketplace)
```

#### What Happens During Review

**Admin Review:**
- Verifies all documents
- Reviews application completeness
- Checks for missing information
- May request additional documents

**Case Worker Field Verification** (If assigned):
- Schedule field visit
- Verify student identity (CNIC)
- Verify family situation
- Verify income claims
- Visit home address
- Complete verification report
- Make recommendation (Approve/Reject/Conditional)

**Interview** (If scheduled):
- Board members conduct interview
- Assess motivation and suitability
- Record interview notes
- Vote on approval
- All panel members must provide decision

#### Student Notifications

- **During Processing:** Email updates on status changes
- **When Requesting Docs:** Specific list of missing documents
- **When Interview Scheduled:** Interview date, time, and meeting link
- **Final Decision:** Approval or rejection email with reasoning

---

### Phase 4: Sponsorship (If Approved)

#### Transitioning to Active Phase
When application is APPROVED:
- Student status changes to **ACTIVE**
- Student becomes visible in donor marketplace
- ✉️ Student receives approval notification

#### Waiting for Sponsor
Students wait for donors to:
- Browse the marketplace
- View student profile
- Choose to sponsor

#### Getting Sponsored
When a donor sponsors:
1. Donor completes payment
2. Sponsorship record created
3. Student marked as **SPONSORED**
4. ✉️ Student receives sponsor notification
5. Sponsorship details become available

#### Post-Sponsorship
- View sponsor details (name, organization)
- Message sponsor directly
- Share progress updates
- Receive sponsor communications
- Student phase remains: **ACTIVE**

---

### Phase 5: Progress Tracking

#### Submitting Progress Updates

Students can submit:
- **Academic Progress**
  - Current GPA
  - Courses completed
  - Credits earned
  - Achievements

- **Personal Updates**
  - Challenges faced
  - Goals for next term
  - Additional notes

- **Document Attachments**
  - Report cards
  - Certificates
  - Progress reports

#### Viewing Sponsorship Status
- Sponsorship start date
- Sponsored amount
- Sponsor information
- Payment status
- Active sponsorship details

#### Graduation
- After degree completion, status changes to **GRADUATED**
- Can still access platform for references
- Progress history preserved

---

## Donor Journey

### Phase 1: Account Registration

1. Click "Register as Donor"
2. Enter:
   - Full name
   - Email
   - Password
   - Organization (optional)
3. Complete reCAPTCHA
4. Account created

---

### Phase 2: Browsing the Marketplace

#### Accessing Marketplace
1. Login or click "Browse Students"
2. View grid of approved, unsponsored students
3. Filter or search by:
   - Name
   - University
   - Program
   - Location
   - GPA

#### Viewing Student Profile
Click on any student card to see:
- **Profile**
  - Photo
  - Introduction video (60-90 seconds)
  - Personal introduction text
  - Social media links

- **Academic Info**
  - University
  - Program
  - GPA
  - Expected graduation

- **Financial Need**
  - Education cost
  - Currency
  - Cost breakdown

- **About Student**
  - Background
  - Career goals
  - Academic achievements
  - Community involvement

- **Contact Option**
  - View Details button
  - Sponsor button (if not already sponsored)

---

### Phase 3: Sponsorship Process

#### Understanding the Sponsorship Model

🔑 **Key Principle: ONE DONOR = ONE STUDENT = COMPLETE EDUCATION**

- **Full Coverage:** You sponsor the student's ENTIRE education cost
- **No Partial Sponsorships:** Cannot sponsor just a portion
- **No Multiple Donors:** Each student can only have one sponsor
- **One-Time Commitment:** Complete the education funding with single or installment payments

#### Choosing Sponsorship Payment Option

When sponsoring, select payment frequency:
- **One-Time Payment:** Pay full amount immediately
- **Bi-Monthly (6 payments):** Over 1 year
- **Quarterly (4 payments):** Over 1 year
- **Semi-Annual (2 payments):** Over 1 year
- **Annual (2 payments):** Over 2 years
- **Custom:** Discuss alternative arrangements

#### Payment Processing

1. Click "Sponsor [Student Name]"
2. Review full education cost breakdown
3. Select payment frequency
4. Click "Proceed to Payment"
5. Complete Stripe payment form
   - Credit/debit card required
   - Secure payment processing
   - Support for international cards

6. Payment confirmation
   - ✉️ Invoice sent to email
   - ✉️ Student notified of sponsorship
   - Sponsorship record created
   - Donor portal updated

#### After Payment

**Sponsorship Details:**
- Student's full name and program
- Total sponsored amount
- Payment schedule
- Sponsorship start date

---

### Phase 4: Post-Sponsorship

#### Messaging Sponsored Students

Only after sponsorship:
1. Go to "My Students" tab
2. Click student name
3. Access messaging interface
4. Send/receive messages
5. Discuss progress, ask questions

#### Monitoring Progress

- View student progress updates (when submitted)
- Receive notifications of major milestones
- Track student's academic journey
- Review progress reports

#### Sponsorship Portal Features

**My Students Tab:**
- List of all sponsored students
- Current academic status
- Progress updates
- Payment status
- Quick links to student profiles

**Payments Tab:**
- Payment history
- Invoice downloads
- Payment receipts
- Upcoming payment dates
- Tax documentation

#### Tax & Receipts

- Automatic receipt generation for each payment
- Tax ID included (if provided)
- Receipt downloads available
- Annual tax summary documents

---

## Admin Portal

### Dashboard Overview

Admins see real-time statistics:
- Total applications (by status)
- Applications approved and awaiting sponsor
- Sponsored students count
- Active donors
- Case worker assignments
- Interview schedules

### Application Management

#### Viewing Applications

**Tabs:**
- **Pending Review:** New applications needing initial review
- **Approved:** Approved, awaiting sponsorship
- **Rejected:** Applications rejected
- **Sponsored:** Students with active sponsors

#### Application Review Process

1. Click application
2. Review all submitted information
3. Check student documents
4. Read any field worker notes

**Quick Actions:**
- **View Details:** Full profile with all sections
- **Assign Case Worker:** Select field worker for verification
- **Schedule Interview:** Assign board members and date
- **Approve:** Mark as APPROVED (with document validation)
- **Reject:** Mark as REJECTED with reason
- **Mark Under Review:** Set status to PROCESSING
- **Add Notes:** Document your review process

#### Making Final Decisions

**To Approve:**
1. Verify all required documents received
2. Review case worker field report (if completed)
3. Review interview decisions (if completed)
4. Click "Approve"
5. System validates required documents
6. If missing docs: option to force approve or request documents
7. ✉️ Student receives approval notification
8. Student transitions to ACTIVE phase
9. Student becomes visible in donor marketplace

**To Reject:**
1. Click "Reject"
2. Add detailed rejection reason (required)
3. ✉️ Student receives rejection notice
4. Application marked as REJECTED permanently

---

### Case Worker Management

#### Assigning Field Reviews

1. Open application
2. Click "Assign Case Worker"
3. Select from available case workers
4. Select task type:
   - DOCUMENT_REVIEW: Verify documents only
   - FIELD_VISIT: Home visit verification
   - CNIC_VERIFICATION: Identity verification

5. Add any notes about specific concerns
6. ✉️ Case worker receives notification

#### Monitoring Field Reviews

1. Go to "Case Workers" or "Pending Reviews"
2. View list of ongoing field reviews
3. Status: PENDING, COMPLETED
4. Click to view detailed report
5. Review recommendation:
   - ✅ STRONGLY_APPROVE
   - ✅ APPROVE
   - 🟡 CONDITIONAL_APPROVAL
   - ❌ REJECT

#### Using Case Worker Recommendations

When making final decisions:
- Consider field worker's recommendation
- Review detailed verification notes
- Check documented findings (home visit notes, income verification, etc.)
- Interview decisions may supersede field recommendation

---

### Interview Scheduling

#### Creating Interviews

1. Open application
2. Click "Schedule Interview"
3. Enter interview details:
   - **Date & Time:** When to conduct interview
   - **Meeting Link:** Google Meet/Zoom/Teams URL
   - **Board Members:** Select 2-3 board members from list
   - **Notes:** Any special instructions

4. ✉️ Interview invitations sent to board members
5. ✉️ Interview details sent to student

#### Interview Status

- **SCHEDULED:** Waiting for interview date
- **IN_PROGRESS:** Interview occurring
- **COMPLETED:** Interview finished, decisions recorded
- **CANCELLED:** Interview cancelled

#### Recording Decisions

After interview:
- Each board member submits:
  - Decision: APPROVE, REJECT, ABSTAIN
  - Comments and feedback

#### Final Decision

- Majority vote determines outcome
- If all agree: Decision is clear
- If split decision: Admin makes final call
- Application updated based on result

---

### University Management

#### Current State
- University database is pre-populated with Pakistani universities
- Official universities appear in student application dropdown

#### Adding Custom Universities

When students enter "Other" university:
- Custom university name captured
- Submitted to admin for review
- Admin can approve/add to database
- Other students can then select it

**Process:**
1. Go to Universities section
2. Filter by "Pending" or "Custom"
3. Review university details
4. Approve to add to official database
5. Set degree levels and programs

---

### Board Member Management

#### Creating Board Members

1. Go to "Board Members"
2. Click "Add Board Member"
3. Enter:
   - Full name
   - Email
   - Title (Chairman, Secretary, Member)
   - Active status

4. ✉️ Invitation email sent to board member
5. Board member creates account

#### Managing Board Members

- View all active board members
- Edit details (name, title, email)
- Deactivate members
- View interview history
- See decision records

---

### Reports & Analytics

#### Available Reports

1. **Application Status Report**
   - Total applications by status
   - Processing time averages
   - Approval/rejection rates

2. **Student Demographics**
   - University distribution
   - Geographic distribution (city/province)
   - GPA ranges
   - Program distribution

3. **Sponsorship Report**
   - Total students sponsored
   - Average sponsorship amount
   - Active sponsors
   - Sponsorship amounts by currency

4. **Field Review Report**
   - Cases assigned to each case worker
   - Average review time
   - Recommendations distribution
   - Follow-up completion rate

5. **Interview Report**
   - Interviews scheduled vs completed
   - Board member participation
   - Average decisions per board member
   - Timeline tracking

#### Data Export

All reports can be exported to:
- CSV format
- JSON format
- PDF summary

---

## Case Worker Operations

### Dashboard

Case worker sees:
- Assigned applications awaiting review
- Completed reviews (awaiting admin decision)
- Statistics on assignments

### Starting a Field Review

1. Go to "Pending Assignments"
2. Click application
3. Review task type (Document Review / Field Visit / CNIC Verification)
4. Review any notes from admin
5. Click "Start Review"

### Document Verification

#### Checklist

Mark as verified:
- ☐ CNIC (Student ID photo matches, expiration valid)
- ☐ Guardian CNIC (Valid documentation)
- ☐ Fee Invoice (From university, amount reasonable)
- ☐ SSC Result (Pass confirmation)
- ☐ HSSC Result (Pass confirmation)
- ☐ Income Certificate (Supports family income claim)
- ☐ Utility Bill (Address matches application)

### Field Visit Documentation

#### Home Visit Report

1. **Visit Details**
   - Date and time of visit
   - Address visited
   - People met

2. **Verification Results**
   - Student identity verified: Yes/No
   - Family situation observed
   - Income level assessment
   - Educational environment
   - Challenges observed

3. **Interview Notes**
   - Student assessment
   - Family support confirmation
   - Educational commitment level

4. **Additional Findings**
   - Risk factors identified
   - Positive observations
   - Special circumstances

### Submitting Recommendation

1. Complete all verification sections
2. Provide detailed notes
3. Select recommendation:
   - **STRONGLY_APPROVE:** Clear case, recommend full approval
   - **APPROVE:** Meets requirements
   - **CONDITIONAL_APPROVAL:** Conditional on specific actions
   - **REJECT:** Does not meet criteria

4. Add reasoning
5. Optionally request additional documents
6. Click "Submit Review"
7. ✉️ Admin receives notification
8. Review status changes to COMPLETED

### If Requesting Additional Documents

1. List missing documents
2. Add explanation of why needed
3. Include deadline for submission
4. Student receives request notification
5. Student can reupload documents
6. You can request 2nd submission

---

## Interview & Board Member Process

### Board Member Portal

#### Upcoming Interviews

Board members see:
- Scheduled interview date/time
- Student name and application details
- Meeting link
- Other panel members
- Interview notes from admin

#### Preparing for Interview

1. Review student application
2. Review interview notes
3. Familiarize with student profile
4. Prepare questions if needed
5. Test meeting link before time

#### Conducting Interview

**During Interview:**
- Discussion of:
  - Educational goals
  - Family background
  - Financial situation
  - Motivation and commitment
  - Any concerns or questions

**Interview Duration:** Typically 30-45 minutes

#### Recording Decision

After interview:
1. Click "Record Decision"
2. Select decision:
   - **APPROVE:** Recommend approval
   - **REJECT:** Recommend rejection
   - **ABSTAIN:** No recommendation

3. Add comments (optional but recommended):
   - Key points from discussion
   - Impressions of applicant
   - Specific concerns or strengths

4. Click "Submit Decision"
5. Decision recorded for panel consideration

### Interview Decision Process

#### Single Board Member Decision
- If only one board member assigned
- Decision becomes final recommendation
- Admin reviews and makes final call

#### Panel Decision (2-3 members)
- **Unanimous:** Clear recommendation for final decision
- **Split Decision (2-1):** Admin makes final call
- **All Abstain:** Application held for reconsideration

### Interview Outcomes

**If Approved:**
- Application marked as APPROVED
- ✉️ Student receives approval notification
- Student transitions to ACTIVE phase
- Student visible in donor marketplace

**If Rejected:**
- Application marked as REJECTED
- ✉️ Student receives rejection notification
- Application cannot be resubmitted

---

## Sponsorship Model

### Core Principle

**ONE DONOR × ONE STUDENT = COMPLETE EDUCATION FUNDING**

This is NOT a marketplace for partial sponsorship or investment returns. It is a charitable education sponsorship program.

### What One Complete Sponsorship Includes

- ✅ Full tuition fees
- ✅ Hostel/accommodation
- ✅ Books and materials
- ✅ All other education-related expenses

### What One Sponsor Cannot Do

- ❌ Partially sponsor a student (must be complete education)
- ❌ Sponsor multiple students (one donor = one student)
- ❌ Withdraw sponsorship after payment
- ❌ Change sponsorship amount
- ❌ Request financial returns or ROI

### Payment Options

Donors can spread payments:
- **Bi-Monthly:** 6 equal payments over 1 year
- **Quarterly:** 4 equal payments over 1 year
- **Semi-Annual:** 2 payments over 1 year
- **Annual:** 2 payments over 2 years
- **Lump Sum:** Full payment immediately

### What Happens After Sponsorship

**Donor Gets:**
- Sponsorship confirmation
- Student contact information
- Ability to message student
- Access to student progress updates
- Tax receipts for donations
- Student gratitude and updates

**Student Gets:**
- Complete education funding
- Sponsor relationship and support
- Financial security for studies
- Mentorship opportunity
- Accountability for progress

### Currency Support

Students can request funding in:
- USD (Primary)
- PKR (Pakistan Rupees)
- EUR (Euro)
- GBP (Pound)
- CAD (Canadian)
- AUD (Australian)

Platform automatically handles currency conversion for donors.

---

## Technical Features

### Photo Upload & Display

**Students Can Upload:**
- Format: JPG, PNG, WebP
- Max size: 3MB per file
- Automatically processed by system

**System Processing:**
- Original: Resized to max 1200px width
- Thumbnail: 200×200 auto-cropped version
- Format: All converted to JPEG internally
- Caching: 1-day cache for performance

**Display:**
- Profile photo shown in student cards
- Thumbnail used in lists
- Full photo available in detail views
- Clickable for modal view

### Video Upload & Processing

**Students Can Upload:**
- Format: MP4, MOV, AVI, WebM
- Duration: 60-90 seconds required
- Max size: 100MB per file
- Max file count: 1 introduction video

**System Processing:**
- Video validated for duration
- Quality verified
- Metadata extracted

**Display:**
- Video appears in student profile
- Plays inline with controls
- Shows duration
- Cached for performance

### Document Management

**Upload System:**
- All documents processed via secure upload endpoint
- Max size: 5MB per document
- Multiple file types supported: PDF, JPG, PNG
- Organized by document type

**Document Types:**
- CNIC, Guardian CNIC
- Fee Invoice, Transcripts
- Results (SSC, HSSC)
- Income Certificate
- Utility Bill (proof of address)
- Others

**Security:**
- Scanned for viruses
- Stored securely
- Access controlled by role
- Audit logged

### Messaging System

**Conversation Types:**
- Student ↔ Admin
- Student ↔ Sponsor (only after sponsorship)
- Donor ↔ Admin

**Features:**
- Real-time message delivery
- Message history
- Read/unread tracking
- Notifications
- File attachment support

### Currency Conversion

**Supported Currencies:**
- USD, PKR, EUR, GBP, CAD, AUD

**Real-time Exchange Rates:**
- Fetched from external service
- Updated regularly
- All amounts normalized to USD for reporting

### Progress Updates

**Students Can Submit:**
- GPA and academic performance
- Courses completed
- Achievements
- Challenges faced
- Goals for next term
- Document attachments

**Tracking:**
- Timestamped submissions
- Version history
- Sponsor visibility
- Admin review capability

---

## FAQ & Troubleshooting

### Student Questions

**Q: Can I edit my application after submitting?**
A: No. After clicking "Submit Application," the application is locked and enters review. If admin requests additional documents, you can upload them separately.

**Q: Why is my photo not showing?**
A: Ensure you uploaded JPG, PNG, or WebP format (not other formats). System converts all to JPEG internally. Clear browser cache and reload page.

**Q: How long does the review process take?**
A: Typically 2-4 weeks depending on case worker availability and interview scheduling. You'll receive email updates throughout.

**Q: Can I sponsor myself?**
A: No. Sponsorships come from external donors through the donor portal. Students cannot fund their own applications.

**Q: What if I don't get interviewed?**
A: If case worker field review and initial admin review are positive, interview may be skipped. Decision made based on available documentation.

**Q: Can my parents be my sponsors?**
A: No. Sponsorships must come from external donors. Family members are not eligible.

---

### Donor Questions

**Q: Can I sponsor part of a student's education?**
A: No. The sponsorship model is complete education coverage only. One donor sponsors one student's complete cost.

**Q: Can I sponsor multiple students?**
A: No. Each donor sponsors one student. After that sponsorship completes (student graduates), you could sponsor another student.

**Q: How do I know if the student uses the money correctly?**
A: You receive progress updates from the student. You can also message them directly to ask about their studies and financial use.

**Q: Can I cancel my sponsorship?**
A: No. Once payment is completed, sponsorship is binding. Funds are committed to student's education.

**Q: What if the student drops out?**
A: If student discontinues education, arrangements are made based on local regulations and program policies. Contact admin for discussion.

**Q: Can I change the payment schedule?**
A: Only before completing first payment. Once sponsorship is active, schedule cannot be modified.

**Q: Are donations tax-deductible?**
A: This depends on your country's tax laws and our organization's registration status. Consult your tax advisor. We provide receipts and tax documentation.

---

### Admin Questions

**Q: How do I handle an application with missing documents?**
A: Use the "Request Additional Documents" feature. System generates notification to student with specific list of missing docs and deadline.

**Q: What if a case worker doesn't complete a field review?**
A: Admin can reassign to another case worker or mark review incomplete. Timeline tracking available to monitor delays.

**Q: Can I override a board member's interview decision?**
A: Yes. If interview panel is split, admin makes final call. If unanimous but problematic, admin can challenge the decision with documentation.

**Q: How do I resolve a student complaint?**
A: All communications are logged and traceable. Review message history, field review notes, interview recordings (if available), and make determination based on evidence.

**Q: Can I sponsor a student myself?**
A: No. Admin users cannot also be donors. Conflict of interest policy prevents admin from sponsoring students they review.

---

### Case Worker Questions

**Q: How detailed should my field report be?**
A: Be specific and factual. Include observations, verification results, any concerns or positive findings. Notes guide admin decision-making.

**Q: Can I reject an application in my field review?**
A: You make a recommendation. Final rejection decision comes from admin or interview panel. Your strong rejection can influence final decision.

**Q: What if student doesn't allow home visit?**
A: Document the attempted visit, reason for refusal, and flag for admin. They may decide to proceed without field verification or request alternative verification.

**Q: How long do I have to complete a review?**
A: Target: 10-14 days from assignment. Delays impact application processing. Contact admin if you need extension.

---

### Technical Issues

**Q: I'm getting a 413 error when uploading a file.**
A: File is too large for server limits. Check file size:
- Documents: Max 5MB
- Photos: Max 3MB
- Videos: Max 100MB

**Q: My video shows but won't play.**
A: Ensure video is MP4/MOV/AVI/WebM format and 60-90 seconds. If converted wrong, try re-uploading.

**Q: I can't message a student I sponsor.**
A: Sponsorship not yet recorded. Ensure payment completed and system processed. Try logging out and back in. Or contact admin.

**Q: Application status not updating.**
A: Page may not have refreshed. Try:
1. Refresh page (F5)
2. Clear browser cache
3. Logout and login
4. Try different browser

**Q: reCAPTCHA keeps failing.**
A: Check internet connection. Clear browser cookies. Disable VPN if using one. Try different browser.

---

## Support & Contact

For issues not covered in this manual:
- Email: support@awakeconnect.org
- Response time: Within 24 business hours
- Include: Your role, what you were doing, exact error message (if any)

---

**End of Manual**

---

*This manual reflects the ACTUAL platform functionality as of December 17, 2025.*
*It supersedes previous versions and is the authoritative documentation.*
