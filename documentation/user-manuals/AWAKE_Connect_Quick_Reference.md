# AWAKE Connect - Quick Reference Guide for Testers

**Version:** 2.0  
**Date:** December 17, 2025  
**Purpose:** Fast overview of platform functionality

---

## System Overview

**AWAKE Connect** connects students needing education funding with donors providing complete sponsorship. One donor sponsors one student's complete education (not partial funding).

---

## User Roles (Quick Summary)

| Role | Can Do | Cannot Do |
|------|--------|-----------|
| **STUDENT** | Create account, submit application, upload docs/photos/videos, message sponsor | Review own application, approve/reject |
| **DONOR** | Browse approved students, sponsor complete education, message sponsored student, pay via Stripe | Sponsor partial amount, sponsor multiple students |
| **ADMIN** | Review applications, assign case workers, schedule interviews, make final decisions | Create other admins, disburse to universities |
| **CASE WORKER** | Conduct field visits, verify documents, submit recommendations | Make final decisions, schedule interviews |
| **BOARD MEMBER** | Conduct interviews, vote on approval/rejection | Approve without interview |
| **SUPER_ADMIN** | Create admin accounts, manage IP whitelist, view audit logs | Manage applications directly |

---

## Student Application Flow

### Step 1: Profile Setup (DRAFT)
- Personal info, guardian details
- Upload photo (JPG/PNG/WebP, max 3MB) → Auto-converted to JPEG
- Record intro video (MP4/MOV/AVI/WebM, 60-90 sec, max 100MB)
- Social media handles (optional)
- Academic background

### Step 2: Application Details (DRAFT)
- University & program selection
- Education cost in selected currency
- Breakdown: tuition, hostel, other expenses
- Family income & contribution

### Step 3: Document Upload (DRAFT)
**Required:**
- CNIC, Guardian CNIC
- Fee Invoice, SSC Result, HSSC Result
- Income Certificate, Utility Bill

**Optional:**
- Enrollment Certificate, Transcript, Degree Certificate

### Step 4: Submit (Status: PENDING)
- ✅ Click "Submit Application"
- ✉️ Confirmation email sent
- ✉️ Admin notification sent
- Application enters review queue

---

## Application Status Progression

```
DRAFT (Editing)
  ↓
PENDING (Submitted, awaiting review)
  ↓
PROCESSING (Admin reviewing)
  ↓
├─ APPROVED → ACTIVE (Visible in donor marketplace)
└─ REJECTED (Process ends)
```

---

## Admin Review Process

1. **Initial Review**
   - Check completeness
   - Verify all documents
   - Decide: Assign field worker? Schedule interview?

2. **Field Verification** (Optional)
   - Case worker visits student
   - Verifies identity, income, situation
   - Submits recommendation

3. **Interview** (Optional)
   - Board members interview student
   - Each votes: APPROVE / REJECT / ABSTAIN
   - Majority wins

4. **Final Decision**
   - Admin makes final call
   - APPROVED → Student moves to ACTIVE phase
   - REJECTED → Application rejected

---

## Donor Sponsorship Flow

### Step 1: Browse Marketplace
- Login or click "Browse Students"
- Search/filter approved, unsponsored students
- View profile, photo, intro video, grades, costs

### Step 2: Choose Sponsorship
- Click "Sponsor [Student Name]"
- Review: **Complete education cost** (not partial)

### Step 3: Select Payment Option
- One-Time: Full amount immediately
- Bi-Monthly: 6 payments over 1 year
- Quarterly: 4 payments over 1 year
- Semi-Annual: 2 payments over 1 year
- Annual: 2 payments over 2 years

### Step 4: Pay via Stripe
- Credit/debit card
- Secure payment processing
- International cards supported

### Step 5: Sponsorship Active
- ✉️ Invoice sent to donor
- ✉️ Student notified of sponsor
- Donor can now message student
- Student transitions to ACTIVE phase

---

## Key Features Quick Guide

### Photo Upload
- Formats: JPG, PNG, WebP
- Max: 3MB
- System converts all to JPEG internally
- Thumbnail version cached

### Video Upload
- Formats: MP4, MOV, AVI, WebM
- Duration: 60-90 seconds REQUIRED
- Max: 100MB
- One per student

### Messages
- Student ↔ Admin (always allowed)
- Donor ↔ Student (only after sponsorship)
- Real-time delivery
- Message history available

### Currency Support
- USD, PKR, EUR, GBP, CAD, AUD
- Donor pays in any currency
- Real-time exchange rates
- All amounts normalized to USD for reporting

---

## Quick Troubleshooting

| Problem | Solution |
|---------|----------|
| Photo not showing | Clear browser cache, reload. Ensure JPG/PNG/WebP format. |
| Video won't upload | Check duration (60-90 sec), format (MP4/MOV/AVI/WebM), size (<100MB) |
| 413 File Too Large error | Document max 5MB, photos max 3MB, videos max 100MB |
| Can't message student | Sponsorship not yet completed. Ensure payment processed. |
| Application status not updating | Refresh browser, clear cache, logout/login |
| reCAPTCHA failing | Check internet, disable VPN, clear cookies, try different browser |

---

## Test Scenarios for QA

### Scenario 1: Student Registration & Application
1. Register as student
2. Fill profile (photo/video upload)
3. Submit education details
4. Upload documents
5. Submit application
- ✅ Verify: Email confirmations sent, application visible to admin

### Scenario 2: Case Worker Field Verification
1. Admin assigns case worker to application
2. Case worker conducts field visit
3. Case worker submits report with recommendation
4. Admin reviews recommendation
- ✅ Verify: Recommendation impacts final decision

### Scenario 3: Interview & Board Members
1. Admin schedules interview with 2-3 board members
2. Board members record decisions (Approve/Reject/Abstain)
3. Admin reviews votes
4. Final decision made
- ✅ Verify: Majority vote determines outcome

### Scenario 4: Donor Sponsorship
1. Donor logs in
2. Browses marketplace
3. Selects student
4. Reviews full education cost
5. Chooses payment frequency
6. Completes Stripe payment
7. Student marked as sponsored
- ✅ Verify: Both donor and student receive notifications, messaging enabled

### Scenario 5: Photo/Video Upload
1. Student uploads photo (non-PNG format like JPG or WebP)
2. System processes and displays
3. Logout and login
4. Verify photo still visible
- ✅ Verify: Photo displays correctly after logout/login (not disappearing after first upload)

### Scenario 6: Currency Handling
1. Student applies with education cost in PKR
2. Donor browses student
3. System shows cost in multiple currencies
4. Donor completes payment in USD
- ✅ Verify: Currency conversion works, amounts correct

---

## Important Notes for Testers

### What SHOULD Work
- ✅ Student applications through complete workflow
- ✅ Photo uploads and display (all formats)
- ✅ Video uploads (60-90 seconds)
- ✅ Admin review and decisions
- ✅ Field worker verification
- ✅ Board member interviews
- ✅ Complete education sponsorships
- ✅ Donor-student messaging after sponsorship
- ✅ Multi-currency support

### What Should NOT Work
- ❌ Partial sponsorships (only complete education)
- ❌ Multiple donors per student (one-to-one only)
- ❌ University disbursements by admin (NOT in system)
- ❌ Admin-to-admin messaging
- ❌ Donor sponsoring as admin

### Known Limitations
- One video per student (not multiple)
- One photo per student (replaces previous)
- Photo formats auto-converted to JPEG (original extension retained in URL for compatibility)
- Videos 60-90 seconds ONLY (no exceptions)
- Complete education sponsorship only (no partial funding)

---

## Contact Support

**Issue found?** Document:
1. Your role (Student/Donor/Admin/etc.)
2. What you were doing
3. Expected vs. actual result
4. Browser and device
5. Screenshots if possible

**Email:** support@awakeconnect.org

---

**Quick Reference Complete**

*For detailed information, see: AWAKE_Connect_Platform_Manual.md*
