# AWAKE Connect — Bug Audit Response Document

**Document Created:** January 4, 2026  
**Responding To:** AWAKE_App_Bug_Audit.md (Tester's Bug & Feature Gap Audit)  
**Prepared By:** Development Team

---

## Executive Summary

This document provides a **point-by-point response** to every issue raised in the AWAKE Connect Bug Audit document. Each item is categorized with:
- ✅ **Will Implement** — Agreed and will be implemented
- ⚠️ **Partial Implementation** — Will implement with modifications (explained)
- ❌ **Already Working** — Issue does not exist / already implemented
- 🔍 **Needs Clarification** — Requires further discussion
- 🚫 **Will Not Implement** — Declined with reason

---

## 1. Student Process Flow

### 1.1 STEP 1

| # | Tester's Issue | Required Change | Our Response | Status |
|---|----------------|-----------------|--------------|--------|
| 1.1.1 | "Tell us about yourself and your family (Optional but recommended)" | Should be mandatory | Will change the field from optional to mandatory. Student cannot proceed without completing this field. | ✅ Will Implement |

**Files Affected:** `src/pages/ApplicationForm.jsx`, validation schemas

**Implementation Plan for 1.1.1:**
```
1. Locate the "Tell us about yourself" field in ApplicationForm.jsx
2. Remove "(Optional)" from label text
3. Add "required" attribute to the input field
4. Add validation in handleSubmit() to check field is not empty
5. Add asterisk (*) to label: "Tell us about yourself and your family <span className="text-red-500">*</span>"
6. Add error message if field is empty on submission
```

---

### 1.2 STEP 2

| # | Tester's Issue | Required Change | Our Response | Status |
|---|----------------|-----------------|--------------|--------|
| 1.2.1 | "Manual university and program entry is missing (hardcoded data)" | Should have option to add university and degree manually | **Already exists.** The system loads universities from database (University, UniversityDegreeLevel, UniversityField, UniversityProgram models in Prisma). There is an "Other" option that allows manual entry via `customUniversity` field. Will verify this works correctly. | ❌ Already Working |
| 1.2.2 | "Program Start Date (Optional)" | Should be mandatory and add calendar, no year limit | Will make Program Start Date mandatory. Calendar picker already exists. Will remove any year limits. | ✅ Will Implement |
| 1.2.3 | "CGPA field needs modification" | Add percentage or CGPA option | Will expand CGPA validation from 0-4 to 0-100 to accept both CGPA (0-4) and Percentage (0-100). Label will change to "CGPA/Percentage" with helper text explaining both formats are accepted. This matches Pakistan education norms where Matric/FSc uses percentage and university uses CGPA. | ✅ Will Implement |

**Files Affected:** `src/pages/ApplicationForm.jsx`, `src/schemas/studentProfileAcademic.schema.js`

**Implementation Plan for 1.2.2:**
```
1. Locate startMonth/startYear fields in ApplicationForm.jsx
2. Remove "(Optional)" from label
3. Add "required" attribute to both fields
4. In handleSubmit(), add validation:
   if (!form.startMonth || !form.startYear) {
     toast.error("Program start date is required");
     return;
   }
5. Remove any min/max year restrictions from the year picker
6. Add asterisk to label
```

**Implementation Plan for 1.2.3:**
```
1. In src/schemas/studentProfileAcademic.schema.js:
   - Change: gpa: z.number().min(0).max(4)
   - To:     gpa: z.number().min(0).max(100)

2. In ApplicationForm.jsx:
   - Change label from "CGPA" to "CGPA / Percentage"
   - Update placeholder: "Enter CGPA (0-4) or Percentage (0-100)"
   - Add helper text: "Pakistani Matric/FSc uses percentage (0-100). University uses CGPA (0-4)."
   - Change input max from 4 to 100
```

---

### 1.3 STEP 3 — Financial Details

| # | Tester's Issue | Required Change | Our Response | Status |
|---|----------------|-----------------|--------------|--------|
| 1.3.1 | "Financial Details – Fields required" | Need separate expense fields: Tuition Fee, Hostel Fee, Stationery expense, Books expense, Mess (average), Computer/Laptop, Travel Expense, Other (Open End) | **Will implement all 8 separate expense fields.** Currently we have only `universityFee` + `livingExpenses`. Will add: <br>• `tuitionFee` <br>• `hostelFee` <br>• `stationeryExpense` <br>• `booksExpense` <br>• `messExpense` <br>• `computerLaptop` <br>• `travelExpense` <br>• `otherExpense` (open-ended text + amount) <br><br>These will auto-sum to `totalExpense`. | ✅ Will Implement |
| 1.3.2 | "Total Amount required for AWAKE Loan" | Should be open-ended for student to enter, NOT calculated from above fields | **Clarification needed.** Current system calculates: `totalExpense - scholarshipAmount = amount`. User (you) requested to KEEP auto-calculation but add "Other Resources" field. <br><br>**Our approach:** We will add `otherResources` field (money from family, part-time work, etc.) that also subtracts from total. Formula: `totalExpense - scholarshipAmount - otherResources = amount`. <br><br>If tester wants purely open-ended amount, this conflicts with your instruction to keep auto-calculation. **Please confirm.** | ⚠️ Partial Implementation |

**Files Affected:** `src/pages/ApplicationForm.jsx`, `server/prisma/schema.prisma` (if new DB fields needed)

**Implementation Plan for 1.3.1 (8 Expense Fields):**
```
1. DATABASE CHANGES (server/prisma/schema.prisma):
   - Add new fields to Application model:
     tuitionFee        Decimal?
     hostelFee         Decimal?
     stationeryExpense Decimal?
     booksExpense      Decimal?
     messExpense       Decimal?
     computerLaptop    Decimal?
     travelExpense     Decimal?
     otherExpenseDesc  String?   // Description for "Other"
     otherExpenseAmt   Decimal?  // Amount for "Other"
   - Run: npx prisma migrate dev --name add_expense_breakdown

2. FRONTEND CHANGES (src/pages/ApplicationForm.jsx):
   a. Replace current universityFee + livingExpenses with 8 new fields
   b. Add form state for each field:
      tuitionFee: "0",
      hostelFee: "0",
      stationeryExpense: "0",
      booksExpense: "0",
      messExpense: "0",
      computerLaptop: "0",
      travelExpense: "0",
      otherExpenseDesc: "",
      otherExpenseAmt: "0",
   
   c. Create new auto-calculation function:
      const calculateTotalExpense = () => {
        return Number(form.tuitionFee || 0) +
               Number(form.hostelFee || 0) +
               Number(form.stationeryExpense || 0) +
               Number(form.booksExpense || 0) +
               Number(form.messExpense || 0) +
               Number(form.computerLaptop || 0) +
               Number(form.travelExpense || 0) +
               Number(form.otherExpenseAmt || 0);
      };
   
   d. Update onChange handlers to recalculate total on any field change
   
   e. Render 8 input fields with labels and asterisks:
      - Tuition Fee ({currency}) *
      - Hostel Fee ({currency})
      - Stationery Expense ({currency})
      - Books Expense ({currency})
      - Mess / Food Average ({currency})
      - Computer / Laptop ({currency})
      - Travel Expense ({currency})
      - Other: [text description] Amount: [number]

3. BACKEND CHANGES (server/src/routes/applications.js):
   - Update POST/PATCH to accept new fields
   - Validate each field is non-negative number
   - Store in database

4. DISPLAY CHANGES:
   - Update MyApplication.jsx to show breakdown
   - Update SubAdminDashboard.jsx to show breakdown
   - Update any admin views that show financial details
```

**Implementation Plan for 1.3.2 (Other Resources Field):**
```
1. DATABASE: Add to Application model:
   otherResources    Decimal?  // Family support, part-time income, etc.
   otherResourcesDesc String?  // Description of other resources

2. FRONTEND: Add field after scholarshipAmount:
   - Label: "Other Resources (family support, part-time work, etc.)"
   - Input for amount
   - Optional text field for description
   
3. UPDATE CALCULATION:
   Current:  amount = totalExpense - scholarshipAmount
   New:      amount = totalExpense - scholarshipAmount - otherResources
   
   const calculateRequiredAmount = (totalExpense, scholarshipAmount, otherResources) => {
     const total = Number(totalExpense || 0);
     const scholarship = Number(scholarshipAmount || 0);
     const other = Number(otherResources || 0);
     return Math.max(0, total - scholarship - other);
   };
```

---

### 1.4 My Profile

| # | Tester's Issue | Required Change | Our Response | Status |
|---|----------------|-----------------|--------------|--------|
| 1.4.1 | "Second Guardian Name (Optional)" | Only one guardian required - Remove Second Guardian fields | Will remove the Second Guardian Name and related optional fields from the profile form. | ✅ Will Implement |
| 1.4.2 | "Completed Education" should be "Previous Academic Record" | Rename label + add button to add more records | Will rename "Completed Education" to "Previous Academic Record" and ensure "Add More" button exists for multiple entries. | ✅ Will Implement |
| 1.4.3 | "Introduction Video gets corrupted after saving profile" | Video corruption issue | **Needs investigation.** Upload mechanism uses multer with 100MB limit and XHR with progress tracking. Server serves static files with proper headers. Will test actual upload → save → playback cycle to identify corruption point. May be encoding, storage, or retrieval issue. | 🔍 Needs Investigation |

**Files Affected:** `src/pages/StudentProfile.jsx` or similar, `src/components/VideoUploader.jsx`

**Implementation Plan for 1.4.1 (Remove Second Guardian):**
```
1. Locate guardian fields in StudentProfile.jsx (or StudentProfileFamily component)
2. Find and REMOVE these fields:
   - secondGuardianName
   - secondGuardianRelation
   - secondGuardianPhone
   - secondGuardianCnic
   - secondGuardianOccupation
   (or similar second guardian related fields)

3. Remove from form state initialization
4. Remove from validation schema if exists
5. Remove from API payload in handleSubmit
6. Keep ONLY primary guardian fields

7. DATABASE: Check if these fields exist in schema.prisma
   - If yes, leave them (for backward compatibility with existing data)
   - Just hide from UI
```

**Implementation Plan for 1.4.2 (Previous Academic Record):**
```
1. Find "Completed Education" label in StudentProfile.jsx
2. Change text to "Previous Academic Record"
3. Verify "Add More" button exists for multiple entries:
   
   If not exists, add:
   <Button 
     type="button" 
     variant="outline" 
     onClick={addAcademicRecord}
   >
     + Add Another Record
   </Button>

4. Ensure state supports array of records:
   academicRecords: [
     { degree: "", institution: "", year: "", grade: "" }
   ]

5. Add function to add new record:
   const addAcademicRecord = () => {
     setForm({
       ...form,
       academicRecords: [...form.academicRecords, { degree: "", institution: "", year: "", grade: "" }]
     });
   };
```

**Implementation Plan for 1.4.3 (Video Corruption - Investigation):**
```
INVESTIGATION STEPS:
1. Test video upload end-to-end:
   a. Upload a test video via VideoUploader component
   b. Check server logs for any errors during multer processing
   c. Verify file is saved correctly in /uploads/videos/
   d. Check file size before and after upload (corruption = size mismatch)
   e. Try to play the saved video file directly from server filesystem
   f. Test video playback through the API endpoint

2. POSSIBLE CAUSES:
   - Incomplete upload (network interruption)
   - Multer storage configuration issue
   - Video file encoding not supported
   - Browser video player compatibility
   - File permissions on server

3. LIKELY FIX AREAS:
   - server/src/routes/videos-simple.js (upload handling)
   - src/components/VideoUploader.jsx (client-side upload)
   - src/components/StudentVideo.jsx (playback)
   - Verify Content-Type headers are correct for video files
```

---

### 1.5 Additional Details for Sponsors

| # | Tester's Issue | Required Change | Our Response | Status |
|---|----------------|-----------------|--------------|--------|
| 1.5.1 | "Specific Field/Specialization" | This field is not required - remove it | Will remove the "Specific Field/Specialization" field from the sponsor details form. | ✅ Will Implement |
| 1.5.2 | "Documents/Images Upload" | Must have option to upload multiple images to one field (e.g., CNIC front and back in same field) | Will implement multi-image upload per document type. When student uploads CNIC, they can add multiple images (front, back) that are grouped together. | ✅ Will Implement |
| 1.5.3 | "Profile and Application Submission" | After submission, student should NOT be able to edit unless authorized by admin | Will implement profile lock after submission. Student profile becomes read-only. Only admin can unlock for edits. | ✅ Will Implement |

**Files Affected:** `src/components/DocumentUploader.jsx`, `src/pages/StudentProfile.jsx`, backend authorization logic

**Implementation Plan for 1.5.1 (Remove Specific Field/Specialization):**
```
1. Search codebase for "Specific Field" or "Specialization" field
2. Locate in form (likely StudentProfile.jsx or AdditionalDetails component)
3. Remove the field from:
   - Form JSX
   - Form state
   - Validation schema
   - API submission payload
4. Keep database field if exists (for backward compatibility)
```

**Implementation Plan for 1.5.2 (Multi-Image Upload per Document):**
```
1. MODIFY DocumentUploader.jsx:
   Current: Single file upload per document type
   New: Multiple files per document type

2. UI CHANGES:
   - Change from single file input to multi-file input:
     <input type="file" multiple accept="image/*" />
   
   - Add "Add More Images" button after first upload
   - Show thumbnails of all uploaded images for that document type
   - Allow removal of individual images

3. STATE STRUCTURE:
   Current: { cnic: "file_url" }
   New:     { cnic: ["file_url_1", "file_url_2"] }  // Array of URLs

4. BACKEND CHANGES:
   - Modify upload endpoint to accept multiple files
   - Store as JSON array in database OR create DocumentImage junction table
   
   Option A (JSON array in existing field):
   documents: { cnic: ["url1", "url2"], hostelCard: ["url1"] }
   
   Option B (New junction table):
   DocumentImage { id, documentType, studentId, imageUrl, order }

5. DISPLAY CHANGES:
   - Admin/Case Worker views should show all images in carousel or grid
   - Add expand/lightbox for viewing full size
```

**Implementation Plan for 1.5.3 (Profile Lock After Submission):**
```
1. DATABASE:
   - Add field to Student or Application model:
     profileLocked    Boolean  @default(false)
     lockedAt         DateTime?
     lockedBy         Int?     // Admin who locked (or null if auto-locked)

2. BACKEND:
   - On application submission, set profileLocked = true
   - Add middleware to check profileLocked before allowing profile edits:
     
     // In profile update route
     if (student.profileLocked && user.role !== 'admin' && user.role !== 'super_admin') {
       return res.status(403).json({ 
         error: "Profile is locked. Contact admin to unlock for editing." 
       });
     }
   
   - Add admin endpoint to unlock profile:
     PATCH /api/admin/students/:id/unlock

3. FRONTEND:
   - Check profileLocked status when loading profile edit page
   - If locked, show read-only view with message:
     "Your profile has been submitted and is locked for review. 
      Contact admin if you need to make changes."
   
   - Hide/disable edit buttons when locked
   
   - Admin dashboard: Add "Unlock Profile" button for each student
```

---

### 1.6 Checklist — Mandatory

| # | Tester's Issue | Required Change | Our Response | Status |
|---|----------------|-----------------|--------------|--------|
| 1.6.1 | Need checklist before student can submit | Pop-up checklist with save option, must be completed before submission | Will implement a pre-submission checklist modal/popup. Student must acknowledge/check all items before final submit. Checklist items: <br>• Applicant CNIC <br>• University/Institution Identity Card <br>• Hostel Card <br>• Father/Guardian CNIC <br>• Bonafide Student Certificate <br>• O Level/SSC Certificate <br>• A Level/HSSC Certificate <br>• Latest Examination Result Card <br>• Income Certificate (Salary slip) <br>• Utility Bill (not older than 3 months) <br>• Distinction/Achievement Certificates (if any) <br><br>Will include save progress functionality. | ✅ Will Implement |

**Files Affected:** New component `src/components/SubmissionChecklist.jsx`, `src/pages/ApplicationForm.jsx`

**Implementation Plan for 1.6.1 (Pre-Submission Checklist):**
```
1. CREATE NEW COMPONENT: src/components/SubmissionChecklist.jsx

   const CHECKLIST_ITEMS = [
     { id: 'cnic', label: 'Applicant CNIC', required: true },
     { id: 'universityId', label: 'University/Institution Identity Card', required: true },
     { id: 'hostelCard', label: 'Hostel Card', required: false },
     { id: 'guardianCnic', label: 'Father/Guardian CNIC', required: true },
     { id: 'bonafide', label: 'Bonafide Student Certificate', required: true },
     { id: 'sscCert', label: 'O Level/SSC (Matriculation) Certificate', required: true },
     { id: 'hsscCert', label: 'A Level/HSSC Certificate', required: true },
     { id: 'resultCard', label: 'Latest Examination Result Card', required: true },
     { id: 'incomeCert', label: 'Income Certificate (Salary slip of Father/Guardian)', required: true },
     { id: 'utilityBill', label: 'Utility Bill (not older than 3 months)', required: true },
     { id: 'achievements', label: 'Distinction/Achievement Certificates (if any)', required: false },
   ];

2. COMPONENT STRUCTURE:
   - Modal dialog that opens before final submission
   - List of checkboxes for each item
   - Required items marked with asterisk
   - "Save Progress" button to save checked state
   - "Submit Application" button (disabled until all required items checked)
   - Progress indicator: "8 of 10 required items checked"

3. STATE MANAGEMENT:
   - Store checklist state in localStorage for persistence:
     localStorage.setItem('submissionChecklist', JSON.stringify(checkedItems))
   
   - Or save to database if student has started application:
     Student model: checklistProgress JSON?

4. INTEGRATION:
   - In ApplicationForm.jsx, when user clicks "Submit":
     a. Open SubmissionChecklist modal
     b. User checks all required items
     c. On "Submit Application" in modal, proceed with actual submission
   
   - Block submission if required items not checked:
     if (!allRequiredItemsChecked) {
       toast.error("Please complete the checklist before submitting");
       return;
     }

5. UI DESIGN:
   ┌─────────────────────────────────────────────┐
   │  📋 Pre-Submission Checklist               │
   │  Please confirm you have the following:    │
   │─────────────────────────────────────────────│
   │  ☑ Applicant CNIC *                        │
   │  ☑ University/Institution Identity Card *  │
   │  ☐ Hostel Card                             │
   │  ☑ Father/Guardian CNIC *                  │
   │  ☐ Bonafide Student Certificate *          │
   │  ...                                       │
   │─────────────────────────────────────────────│
   │  Progress: 6/10 required items ████░░░░    │
   │                                             │
   │  [Save Progress]    [Submit Application]   │
   └─────────────────────────────────────────────┘
```

---

## 2. Admin Workflow

| # | Tester's Issue | Required Change | Our Response | Status |
|---|----------------|-----------------|--------------|--------|
| 2.1 | "Sign Up Admin Tab is required along with Home, Find Students, Apply for Aid" | New user sign up button and fields required | **Clarification needed.** The bug audit says "Admin can create case workers" and "Super Admin can create Admins" — you confirmed these are already working and should be ignored. If this is about a public signup page for admins, that would be a security concern. <br><br>If this means adding a navigation tab to the admin dashboard, will implement. **Please clarify.** | 🔍 Needs Clarification |

**Implementation Plan for 2.1 (Pending Clarification):**
```
IF this means "Add Sign Up tab to navigation for new users":
  1. This likely refers to STUDENT signup, not admin signup
  2. Add "Sign Up" or "Apply for Aid" tab to main navigation
  3. Link to student registration/application form
  
  Navigation should show:
  - Home
  - Find Students (Marketplace)
  - Apply for Aid (Student Sign Up)
  - Sign Up (if not logged in)

IF this means "Admin should be able to create new admin accounts":
  - Already exists: Super Admin can create Admins
  - Admin can create Case Workers
  - No changes needed

WILL NOT IMPLEMENT: Public admin registration (security risk)
```

---

### 2.1 Case Worker Workflow

| # | Tester's Issue | Required Change | Our Response | Status |
|---|----------------|-----------------|--------------|--------|
| 2.1.1 | "Case Worker cannot view full application – blank page when clicked" | Fix blank page issue | Will investigate and fix. Likely a routing or data loading issue in case worker dashboard. | ✅ Will Implement |
| 2.1.2 | "Pending Reviews – Student Information not on screen when clicked" | Display student info properly | Will ensure student information displays correctly in pending reviews section. | ✅ Will Implement |
| 2.1.3 | "CNIC not provided – Test student CNIC uploaded but still this message appears" | Fix CNIC detection logic | Will investigate why CNIC upload is not being detected. May be a status check or document type matching issue. | ✅ Will Implement |
| 2.1.4 | "Need another field for admin/case worker to change the AWAKE amount" | Allow case worker to modify approved amount | **Will implement.** Will add UI for case workers to modify the AWAKE loan amount. Will ensure: <br>• Sum recalculates correctly on dashboard <br>• Change persists to database <br>• All related views (student, admin) reflect updated amount | ✅ Will Implement |

**Files Affected:** `src/pages/SubAdminDashboard.jsx`, `src/pages/FieldOfficerDashboard.jsx`, related API routes

**Implementation Plan for 2.1.1 & 2.1.2 (Blank Page Fix):**
```
1. INVESTIGATE:
   - Open browser DevTools while accessing case worker dashboard
   - Click on an application to view full details
   - Check Console for JavaScript errors
   - Check Network tab for failed API calls
   
2. LIKELY CAUSES:
   - Missing route in React Router
   - API endpoint returning error/empty data
   - Component not receiving required props
   - Permission check failing silently

3. DEBUGGING STEPS:
   a. Check FieldOfficerDashboard.jsx or SubAdminDashboard.jsx
   b. Find the "View Full Details" button/link
   c. Trace the navigation/data loading logic
   d. Add console.logs to identify where it breaks
   
4. FIX:
   - If routing issue: Add missing route
   - If API issue: Fix endpoint or error handling
   - If permission issue: Ensure case worker has access
```

**Implementation Plan for 2.1.3 (CNIC Detection Fix):**
```
1. INVESTIGATE:
   - Check how documents are stored in database
   - Check how "CNIC not provided" message is generated
   - Look for document type matching logic

2. LIKELY ISSUE:
   - Document type stored as "cnic" but code checks for "CNIC" (case mismatch)
   - OR document stored with different key
   - OR document upload not linked to correct student ID

3. DEBUGGING:
   a. Query database to see actual document records for test student
   b. Check document upload endpoint to see what type is saved
   c. Check display logic that shows "CNIC not provided"

4. FIX EXAMPLE:
   // Bad (case sensitive):
   if (documents.find(d => d.type === 'CNIC'))
   
   // Good (case insensitive):
   if (documents.find(d => d.type.toLowerCase() === 'cnic'))
```

**Implementation Plan for 2.1.4 (Case Worker Amount Modification):**
```
1. DATABASE:
   - Add field to Application model (if not exists):
     approvedAmount    Decimal?  // Amount approved by case worker/admin
     amountModifiedBy  Int?      // User ID who modified
     amountModifiedAt  DateTime? // When modified

2. BACKEND (server/src/routes/applications.js):
   - Add/modify PATCH endpoint to allow amount update:
     
     PATCH /api/applications/:id/amount
     Body: { approvedAmount: 150000, reason: "Adjusted based on verification" }
     
     // Check user is case worker or admin
     if (!['admin', 'sub_admin', 'case_worker'].includes(user.role)) {
       return res.status(403).json({ error: 'Not authorized' });
     }
     
     // Update database
     await prisma.application.update({
       where: { id },
       data: { 
         approvedAmount,
         amountModifiedBy: user.id,
         amountModifiedAt: new Date()
       }
     });

3. FRONTEND (SubAdminDashboard.jsx / FieldOfficerDashboard.jsx):
   - Add editable amount field in application detail view:
     
     <div className="space-y-2">
       <label>AWAKE Loan Amount (Approved)</label>
       <div className="flex gap-2">
         <Input
           type="number"
           value={approvedAmount}
           onChange={(e) => setApprovedAmount(e.target.value)}
         />
         <Button onClick={handleUpdateAmount}>
           Update Amount
         </Button>
       </div>
       <p className="text-xs text-gray-500">
         Original requested: {formatCurrency(originalAmount)}
       </p>
     </div>

4. DASHBOARD SUM RECALCULATION:
   - When displaying totals, use approvedAmount if set, otherwise original amount:
     
     const getDisplayAmount = (app) => {
       return app.approvedAmount ?? app.amount;
     };
     
     const totalApproved = applications.reduce(
       (sum, app) => sum + getDisplayAmount(app), 0
     );

5. AUDIT TRAIL:
   - Log all amount changes for accountability:
     console.log(`Amount changed from ${oldAmount} to ${newAmount} by user ${userId}`);
   - Consider adding AmountChangeLog table if detailed history needed
```

---

## 3. Donor Workflow

| # | Tester's Issue | Required Change | Our Response | Status |
|---|----------------|-----------------|--------------|--------|
| 3.1 | "Text on Homepage" | Discuss with Azhar Sb for homepage title and description | This is a content decision, not a technical issue. Will implement whatever text is provided. **Awaiting content from stakeholder.** | 🔍 Needs Content |
| 3.2 | "Data of sponsored/available on homepage not clickable" | Should be clickable | Will make sponsored/available counts on homepage clickable, linking to appropriate filtered views. | ✅ Will Implement |
| 3.3 | "Support email" | Change to op.executive@akhuwat.org.pk | Will update support email throughout the application to `op.executive@akhuwat.org.pk`. | ✅ Will Implement |
| 3.4 | "Currency should show both PKR and USD amounts" | Dual currency display | **Already implemented.** `fmtAmountDual()` in `src/lib/currency.js` already displays "Rs 200,000 (≈ $667 USD)" format. Will verify it's used consistently across all monetary displays. | ❌ Already Working |
| 3.5 | "Complete Sponsorship - Monthly/Quarterly pledge issue" | Should show only paid amount and balance, not complete payment | Will modify sponsorship display to show: <br>• Paid amount (what donor has actually paid) <br>• Balance remaining (what is still owed) <br>• Total pledge amount <br>Instead of showing "complete payment" when pledge is partial. | ✅ Will Implement |
| 3.6 | "Progress window Donor Portal - Student will not be able to upload documents in donor portal progress report" | Need to remove this feature | **Will remove.** The "Upload Documents" button in DonorPortal.jsx currently has no onClick handler (non-functional placeholder). Will remove/hide the button entirely as donors should NOT upload documents. | ✅ Will Implement |
| 3.7 | "Student Marketplace - Program dropdown" | Should automatically update according to available programs only | **Confirmed issue.** Program dropdown in Marketplace.jsx is currently HARDCODED with static options. Will make it dynamic, loading only programs that have available students. | ✅ Will Implement |
| 3.8 | "Student Marketplace - Province dropdown" | Change to Country - Should fetch region where student is studying based on available profiles | Will change "Province" dropdown to "Country" and dynamically populate based on where approved students are studying. | ✅ Will Implement |

**Files Affected:** `src/pages/Marketplace.jsx`, `src/pages/DonorPortal.jsx`, `src/pages/LandingPage.jsx`, email templates

**Implementation Plan for 3.2 (Clickable Stats on Homepage):**
```
1. Locate stats display on LandingPage.jsx (or Home component)
   - Find "X students sponsored" and "Y students available" displays

2. Wrap each stat in a Link or clickable element:
   
   <Link to="/marketplace?status=sponsored">
     <div className="stat-card">
       <span className="stat-number">{sponsoredCount}</span>
       <span className="stat-label">Students Sponsored</span>
     </div>
   </Link>
   
   <Link to="/marketplace?status=available">
     <div className="stat-card">
       <span className="stat-number">{availableCount}</span>
       <span className="stat-label">Students Available</span>
     </div>
   </Link>

3. Add hover effect to indicate clickability:
   className="cursor-pointer hover:shadow-lg transition-shadow"

4. In Marketplace.jsx, handle the status filter from URL params:
   const [searchParams] = useSearchParams();
   const statusFilter = searchParams.get('status');
```

**Implementation Plan for 3.3 (Update Support Email):**
```
1. Search entire codebase for email addresses:
   - grep -r "support@" --include="*.js" --include="*.jsx"
   - grep -r "@aircrew.nl" --include="*.js" --include="*.jsx"
   - grep -r "email" --include="*.html"

2. Replace all instances of old support email with:
   op.executive@akhuwat.org.pk

3. FILES LIKELY AFFECTED:
   - server/src/lib/emailService.js (all email templates)
   - src/pages/LandingPage.jsx (footer/contact)
   - src/components/Footer.jsx (if exists)
   - README.md or documentation

4. Verify no hardcoded emails remain after changes
```

**Implementation Plan for 3.5 (Sponsorship Payment Display):**
```
1. UNDERSTAND CURRENT DATA MODEL:
   Sponsorship {
     totalAmount     // Total pledge
     paidAmount      // What's been paid so far (may not exist)
     paymentSchedule // monthly, quarterly, one-time
     payments        // Array of payment records?
   }

2. ADD FIELDS IF NEEDED:
   paidAmount    Decimal  @default(0)
   
   // Calculate balance:
   balance = totalAmount - paidAmount

3. UPDATE DISPLAY (DonorPortal.jsx or SponsorshipCard):
   
   CURRENT:
   "Complete Sponsorship: $500"  // Shows total even if partial
   
   NEW:
   ┌─────────────────────────────────┐
   │ Sponsorship for [Student Name] │
   │                                 │
   │ Total Pledge:    $500          │
   │ Paid to Date:    $150  ✓       │
   │ Balance:         $350          │
   │ Payment Plan:    Monthly       │
   │                                 │
   │ [Make Payment]                  │
   └─────────────────────────────────┘

4. BACKEND:
   - Ensure payment tracking is in place
   - Add paidAmount calculation from Payment records if using payment table
```

**Implementation Plan for 3.6 (Remove Donor Upload Button):**
```
1. Open src/pages/DonorPortal.jsx

2. Find the upload button (search for "Upload" or "Document"):
   <Button variant="outline">
     Upload Documents
   </Button>

3. DELETE or COMMENT OUT the entire button:
   {/* Upload button removed - donors should not upload documents
   <Button variant="outline">
     Upload Documents
   </Button>
   */}

4. Alternatively, wrap in a condition that never renders:
   {false && <Button>Upload Documents</Button>}

5. Clean up any related upload state/functions if they exist
```

**Implementation Plan for 3.7 (Dynamic Program Dropdown):**
```
1. CURRENT STATE (Marketplace.jsx):
   const programs = ["Computer Science", "Engineering", "Medicine", ...];  // Hardcoded

2. NEW APPROACH:
   a. Create API endpoint to get programs with available students:
      GET /api/programs/available
      
      Returns only programs where at least one approved, unsponsored student exists
   
   b. Backend implementation:
      const availablePrograms = await prisma.application.findMany({
        where: { 
          status: 'approved',
          // Not fully sponsored
        },
        select: { program: true },
        distinct: ['program']
      });
      
      return availablePrograms.map(a => a.program);

3. FRONTEND (Marketplace.jsx):
   const [programs, setPrograms] = useState([]);
   
   useEffect(() => {
     fetch('/api/programs/available')
       .then(res => res.json())
       .then(data => setPrograms(data));
   }, []);
   
   // Dropdown now uses dynamic programs list
   <Select>
     <option value="">All Programs</option>
     {programs.map(p => <option key={p} value={p}>{p}</option>)}
   </Select>
```

**Implementation Plan for 3.8 (Province → Country Dropdown):**
```
1. LOCATE in Marketplace.jsx:
   - Find "Province" dropdown
   - Currently shows Pakistani provinces: Punjab, Sindh, KPK, Balochistan, etc.

2. CHANGE LABEL:
   - "Province" → "Country" or "Region"

3. DYNAMIC POPULATION:
   a. Create API endpoint:
      GET /api/countries/available
      
   b. Backend:
      const countries = await prisma.application.findMany({
        where: { status: 'approved' },
        select: { country: true },
        distinct: ['country']
      });
      
      return countries.map(c => c.country);

4. FRONTEND:
   const [countries, setCountries] = useState([]);
   
   useEffect(() => {
     fetch('/api/countries/available')
       .then(res => res.json())
       .then(data => setCountries(data));
   }, []);
   
   <Select>
     <option value="">All Countries</option>
     {countries.map(c => <option key={c} value={c}>{c}</option>)}
   </Select>

5. UPDATE FILTER LOGIC:
   - Change filter from province to country matching
```

---

## 4. Final Notes (General Issues)

| # | Tester's Issue | Required Change | Our Response | Status |
|---|----------------|-----------------|--------------|--------|
| 4.1 | "Please add asterisk sign (*) to fields that are mandatory" | Visual indicator for required fields | Will audit all forms and ensure required fields have `<span className="text-red-500">*</span>` next to their labels. Some already exist (PhotoUpload component). | ✅ Will Implement |
| 4.2 | "Pop-up for any issue/missing item like 'Tips' currently comes on top right corner and easy to miss" | Add pop-ups in center with large text size | **Partial implementation.** Toast notifications are currently configured as `position="top-right"` in App.jsx using Sonner. <br><br>Changing to center position may be disruptive for quick notifications. **Suggested alternative:** <br>• Keep quick success/error toasts at top-right <br>• Use centered modal dialogs for important warnings/tips that require attention <br><br>**Please confirm if you want ALL notifications centered or just important ones.** | ⚠️ Needs Clarification |

**Implementation Plan for 4.1 (Asterisks on Required Fields):**
```
1. AUDIT ALL FORMS:
   - src/pages/ApplicationForm.jsx
   - src/pages/StudentProfile.jsx
   - src/pages/DonorRegistration.jsx (if exists)
   - src/components/*.jsx (form components)

2. FOR EACH REQUIRED FIELD, ADD ASTERISK:
   
   BEFORE:
   <label className="text-sm font-medium">
     Full Name
   </label>
   
   AFTER:
   <label className="text-sm font-medium">
     Full Name <span className="text-red-500">*</span>
   </label>

3. CREATE REUSABLE COMPONENT (optional but cleaner):
   
   // src/components/ui/RequiredLabel.jsx
   export const RequiredLabel = ({ children, required = true }) => (
     <label className="text-sm font-medium">
       {children}
       {required && <span className="text-red-500 ml-1">*</span>}
     </label>
   );
   
   // Usage:
   <RequiredLabel>Full Name</RequiredLabel>

4. ADD LEGEND AT TOP OF FORMS:
   <p className="text-sm text-gray-500 mb-4">
     Fields marked with <span className="text-red-500">*</span> are required
   </p>

5. FIELDS TO MARK AS REQUIRED (based on validation):
   ApplicationForm:
   - Name *
   - Email *
   - Country *
   - University *
   - Degree Level *
   - Field *
   - Program *
   - CGPA *
   - Program Start Date * (after making mandatory)
   - Tell us about yourself * (after making mandatory)
   - Photo *
   
   StudentProfile:
   - Guardian Name *
   - Guardian CNIC *
   - Address *
   - etc.
```

**Implementation Plan for 4.2 (Toast/Notification Positioning):**
```
OPTION A: Move ALL toasts to center (if confirmed)
1. In src/App.jsx:
   BEFORE: <Sonner richColors position="top-right" closeButton />
   AFTER:  <Sonner richColors position="top-center" closeButton />

2. Adjust styling for better visibility:
   <Sonner 
     richColors 
     position="top-center" 
     closeButton
     toastOptions={{
       className: "text-lg",
       style: { fontSize: '16px' }
     }}
   />

OPTION B: Keep toasts at top-right, use modals for important messages (RECOMMENDED)
1. Keep current toast configuration for quick feedback:
   - Success messages: "Saved successfully" → toast (top-right, auto-dismiss)
   - Error messages: "Failed to save" → toast (top-right, auto-dismiss)

2. For IMPORTANT warnings/tips, use centered modal dialog:
   
   import { AlertDialog } from "@/components/ui/alert-dialog";
   
   // When showing important tip:
   <AlertDialog open={showTip}>
     <AlertDialogContent className="max-w-md">
       <AlertDialogHeader>
         <AlertDialogTitle className="text-xl">
           💡 Important Tip
         </AlertDialogTitle>
         <AlertDialogDescription className="text-base">
           Make sure to upload all required documents before submitting.
         </AlertDialogDescription>
       </AlertDialogHeader>
       <AlertDialogFooter>
         <AlertDialogAction onClick={() => setShowTip(false)}>
           Got it!
         </AlertDialogAction>
       </AlertDialogFooter>
     </AlertDialogContent>
   </AlertDialog>

3. Create helper function for important alerts:
   
   // src/lib/alerts.js
   export const showImportantAlert = (title, message) => {
     // Trigger modal display
   };
```

---

## Pre-Existing Critical Issues (Found During Investigation)

These issues were discovered during codebase investigation and must be fixed before any new features:

| # | Issue | Severity | Details | Status |
|---|-------|----------|---------|--------|
| P1 | **auth.js ErrorCodes import** | 🔴 CRITICAL | Login is completely broken. Uses `ErrorCodes.AUTH.INVALID_CREDENTIALS` but imports from wrong file (`../lib/errorCodes.js` has flat structure, should use `../../utils/errorCodes.js` with nested structure). Lines 91, 98, 385, 391, 397 affected. | ✅ Will Fix First |
| P2 | **ESLint config deprecated syntax** | 🟡 MEDIUM | Uses deprecated `extends: [js.configs.recommended]` which is incompatible with ESLint 9.x flat config. Should use spread operator. | ✅ Will Fix |

**Implementation Plan for P1 (auth.js ErrorCodes Fix):**
```
1. CREATE BACKUP:
   Copy-Item "server/src/routes/auth.js" "server/src/routes/auth.js.backup"

2. IDENTIFY THE ISSUE:
   - Current import (line ~10):
     const { ErrorCodes } = require('../lib/errorCodes');
   
   - This file has FLAT structure:
     { AUTH_INVALID_CREDENTIALS: 'AUTH_001', ... }
   
   - Code uses NESTED structure:
     ErrorCodes.AUTH.INVALID_CREDENTIALS  // Undefined!

3. THE FIX:
   Change import from:
     const { ErrorCodes } = require('../lib/errorCodes');
   
   To:
     const { ErrorCodes } = require('../../utils/errorCodes');
   
   This file has NESTED structure:
     { AUTH: { INVALID_CREDENTIALS: 'AUTH_001' }, ... }

4. AFFECTED LINES:
   - Line 91:  ErrorCodes.AUTH.INVALID_CREDENTIALS
   - Line 98:  ErrorCodes.AUTH.INVALID_CREDENTIALS
   - Line 385: ErrorCodes.AUTH.* (password reset)
   - Line 391: ErrorCodes.AUTH.*
   - Line 397: ErrorCodes.AUTH.*

5. VERIFY FIX:
   a. Start server: cd server && npm run dev
   b. Try login with valid credentials
   c. Try login with invalid credentials (should get proper error, not crash)
   d. Test password reset flow
```

**Implementation Plan for P2 (ESLint Config Fix):**
```
1. CREATE BACKUP:
   Copy-Item "eslint.config.js" "eslint.config.js.backup"

2. OPEN eslint.config.js

3. FIND:
   export default [
     { extends: [js.configs.recommended] },
     ...
   ];

4. CHANGE TO:
   export default [
     js.configs.recommended,
     {
       // other config options
     },
     ...
   ];
   
   OR if extends is inside an object:
   
   BEFORE:
   {
     extends: [js.configs.recommended],
     rules: { ... }
   }
   
   AFTER:
   {
     ...js.configs.recommended,
     rules: { ... }
   }

5. VERIFY:
   npx eslint --version  // Confirm ESLint 9.x
   npx eslint .          // Should run without config errors
```

---

## Implementation Priority Order

Based on severity and dependencies:

### Phase 1: Critical Fixes (Must Do First)
1. ☐ Fix auth.js ErrorCodes import (P1) — Login is broken
2. ☐ Fix ESLint config (P2)

### Phase 2: Core Functionality Fixes
3. ☐ Fix Case Worker blank page issue (2.1.1)
4. ☐ Fix CNIC detection logic (2.1.3)
5. ☐ Add Case Worker amount modification UI (2.1.4)
6. ☐ Investigate video corruption (1.4.3)

### Phase 3: Form & Field Changes
7. ☐ Make "Tell us about yourself" mandatory (1.1.1)
8. ☐ Make Program Start Date mandatory (1.2.2)
9. ☐ Expand CGPA validation to 0-100 (1.2.3)
10. ☐ Add 8 expense breakdown fields (1.3.1)
11. ☐ Remove Second Guardian fields (1.4.1)
12. ☐ Rename "Completed Education" to "Previous Academic Record" (1.4.2)
13. ☐ Remove "Specific Field/Specialization" (1.5.1)
14. ☐ Add asterisks to required fields (4.1)

### Phase 4: Feature Additions
15. ☐ Implement multi-image upload per document (1.5.2)
16. ☐ Implement profile lock after submission (1.5.3)
17. ☐ Implement pre-submission checklist (1.6.1)
18. ☐ Make homepage counts clickable (3.2)
19. ☐ Fix sponsorship payment display (3.5)
20. ☐ Make Marketplace program dropdown dynamic (3.7)
21. ☐ Change Province to Country dropdown (3.8)

### Phase 5: Cleanup & Polish
22. ☐ Remove donor upload button (3.6)
23. ☐ Update support email (3.3)
24. ☐ Verify dual currency display everywhere (3.4)

---

## Items Awaiting Clarification

| # | Item | Question | Answer |
|---|------|----------|--------|
| Q1 | 1.3.2 - AWAKE Loan Amount | Tester wants open-ended amount. You want auto-calculation. Should we: (A) Keep auto-calc with Other Resources field, or (B) Make it fully open-ended? | |
| Q2 | 2.1 - Admin Sign Up Tab | Is this about adding navigation tab, or public admin registration? | |
| Q3 | 4.2 - Toast Position | Should ALL notifications be centered, or just important warnings? | |

---

## Sign-Off

**Developer Acknowledgment:**  
I have reviewed the AWAKE_App_Bug_Audit.md document in its entirety and understand each issue raised. This response document captures my planned approach for every item. I will proceed with implementation only after receiving confirmation on the clarification items above.

**Estimated Implementation Time:** TBD after clarifications resolved

---

*This document will be updated as implementation progresses.*
