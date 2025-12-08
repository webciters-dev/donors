# DOCUMENT REQUIREMENTS - COMPLETE CHANGE PLAN

## 📋 NEW STRUCTURE (as per screenshot + requirements)

### REQUIRED DOCUMENTS (7 total)
1. CNIC
2. GUARDIAN_CNIC
3. FEE_INVOICE
4. SSC_RESULT
5. HSSC_RESULT
6. INCOME_CERTIFICATE
7. UTILITY_BILL

### OPTIONAL DOCUMENTS (5 total)
1. TRANSCRIPT
2. UNIVERSITY_CARD
3. ENROLLMENT_CERTIFICATE
4. DEGREE_CERTIFICATE
5. SECOND_GUARDIAN_CNIC (NEW)

---

## 🎯 ALL FILES THAT NEED CHANGES

### FILE 1: `profileValidation.js` (Line 5)
**Current:**
```javascript
const REQUIRED_DOCS = ["CNIC", "GUARDIAN_CNIC", "HSSC_RESULT", "UNIVERSITY_CARD", "FEE_INVOICE", "INCOME_CERTIFICATE", "UTILITY_BILL", "TRANSCRIPT"];
```

**New:**
```javascript
const REQUIRED_DOCS = ["CNIC", "GUARDIAN_CNIC", "FEE_INVOICE", "SSC_RESULT", "HSSC_RESULT", "INCOME_CERTIFICATE", "UTILITY_BILL"];
```

**Why:** This is the source of truth for profile validation. Backend and frontend use this.

---

### FILE 2: `MyApplication.jsx` (Line 28)
**Current:**
```javascript
const REQUIRED_DOCS = ["CNIC", "GUARDIAN_CNIC", "HSSC_RESULT", "UNIVERSITY_CARD", "FEE_INVOICE", "INCOME_CERTIFICATE", "UTILITY_BILL", "TRANSCRIPT"];
```

**New:**
```javascript
const REQUIRED_DOCS = ["CNIC", "GUARDIAN_CNIC", "FEE_INVOICE", "SSC_RESULT", "HSSC_RESULT", "INCOME_CERTIFICATE", "UTILITY_BILL"];
```

**Why:** Student-facing required documents list for the upload section.

---

### FILE 3: `MyApplication.jsx` (Lines 454-458)
**Current:**
```javascript
const currentDocChecklist = useMemo(
  () => [
    { key: "TRANSCRIPT", label: "Transcript" },
    { key: "DEGREE_CERTIFICATE", label: "Degree Certificate" },
    { key: "ENROLLMENT_CERTIFICATE", label: "Enrollment / Admission Proof" },
  ],
  []
);
```

**New:**
```javascript
const currentDocChecklist = useMemo(
  () => [
    { key: "TRANSCRIPT", label: "TRANSCRIPT" },
    { key: "UNIVERSITY_CARD", label: "UNIVERSITY/COLLEGE CARD" },
    { key: "ENROLLMENT_CERTIFICATE", label: "Enrollment / Admission Proof" },
    { key: "DEGREE_CERTIFICATE", label: "DEGREE CERTIFICATE" },
    { key: "SECOND_GUARDIAN_CNIC", label: "2ND GUARDIAN CNIC" },
  ],
  []
);
```

**Why:** Optional documents shown to students. Now includes 5 optional docs instead of 3.

---

### FILE 4: `DocumentUploader.jsx` (Lines 26-37)
**Current:**
```javascript
const TYPES = [
  { key: "CNIC", label: "CNIC" },
  { key: "GUARDIAN_CNIC", label: "GUARDIAN CNIC" },
  { key: "SSC_RESULT", label: "SSC RESULT" },
  { key: "HSSC_RESULT", label: "HSSC RESULT" },
  { key: "UNIVERSITY_CARD", label: "UNIVERSITY/COLLEGE CARD" },
  { key: "FEE_INVOICE", label: "FEE INVOICE" },
  { key: "INCOME_CERTIFICATE", label: "INCOME CERTIFICATE" },
  { key: "UTILITY_BILL", label: "UTILITY BILL" },
  { key: "TRANSCRIPT", label: "TRANSCRIPT" },
  { key: "DEGREE_CERTIFICATE", label: "DEGREE CERTIFICATE" },
  { key: "ENROLLMENT_CERTIFICATE", label: "ENROLLMENT CERTIFICATE" },
  { key: "OTHER", label: "OTHER" },
];
```

**New:**
```javascript
const TYPES = [
  { key: "CNIC", label: "CNIC" },
  { key: "GUARDIAN_CNIC", label: "GUARDIAN CNIC" },
  { key: "SSC_RESULT", label: "SSC RESULT" },
  { key: "HSSC_RESULT", label: "HSSC RESULT" },
  { key: "UNIVERSITY_CARD", label: "UNIVERSITY/COLLEGE CARD" },
  { key: "FEE_INVOICE", label: "FEE INVOICE" },
  { key: "INCOME_CERTIFICATE", label: "INCOME CERTIFICATE" },
  { key: "UTILITY_BILL", label: "UTILITY BILL" },
  { key: "TRANSCRIPT", label: "TRANSCRIPT" },
  { key: "DEGREE_CERTIFICATE", label: "DEGREE CERTIFICATE" },
  { key: "ENROLLMENT_CERTIFICATE", label: "ENROLLMENT CERTIFICATE" },
  { key: "SECOND_GUARDIAN_CNIC", label: "2ND GUARDIAN CNIC" },
  { key: "OTHER", label: "OTHER" },
];
```

**Why:** Dropdown menu in document uploader. Added SECOND_GUARDIAN_CNIC. Note: SSC_RESULT is already there, just needs to stay.

---

### FILE 5: `applications.js` (Line 294)
**Current:**
```javascript
const REQUIRED_DOCS = ["CNIC", "GUARDIAN_CNIC", "HSSC_RESULT", "UNIVERSITY_CARD", "FEE_INVOICE", "INCOME_CERTIFICATE", "UTILITY_BILL", "TRANSCRIPT"];
```

**New:**
```javascript
const REQUIRED_DOCS = ["CNIC", "GUARDIAN_CNIC", "FEE_INVOICE", "SSC_RESULT", "HSSC_RESULT", "INCOME_CERTIFICATE", "UTILITY_BILL"];
```

**Why:** Backend validation for application approval (checks for missing docs).

---

### FILE 6: `applications.js` (Line 466)
**Current:**
```javascript
const REQUIRED_DOCS = ["CNIC", "GUARDIAN_CNIC", "HSSC_RESULT", "UNIVERSITY_CARD", "FEE_INVOICE", "INCOME_CERTIFICATE", "UTILITY_BILL", "TRANSCRIPT"];
```

**New:**
```javascript
const REQUIRED_DOCS = ["CNIC", "GUARDIAN_CNIC", "FEE_INVOICE", "SSC_RESULT", "HSSC_RESULT", "INCOME_CERTIFICATE", "UTILITY_BILL"];
```

**Why:** Same backend validation in another endpoint (status update).

---

### FILE 7: `SubAdminDashboard.jsx` (Line 599)
**Current:**
```javascript
const REQUIRED_DOCS = ["CNIC", "GUARDIAN_CNIC", "HSSC_RESULT", "PHOTO", "UNIVERSITY_CARD", "FEE_INVOICE", "INCOME_CERTIFICATE", "UTILITY_BILL"];
const OPTIONAL_DOCS = ["TRANSCRIPT", "DEGREE_CERTIFICATE", "ENROLLMENT_CERTIFICATE"];
```

**New:**
```javascript
const REQUIRED_DOCS = ["CNIC", "GUARDIAN_CNIC", "FEE_INVOICE", "SSC_RESULT", "HSSC_RESULT", "INCOME_CERTIFICATE", "UTILITY_BILL"];
const OPTIONAL_DOCS = ["TRANSCRIPT", "UNIVERSITY_CARD", "ENROLLMENT_CERTIFICATE", "DEGREE_CERTIFICATE", "SECOND_GUARDIAN_CNIC"];
```

**Why:** SubAdmin review modal shows required vs optional. Matches new structure.

---

### FILE 8: `FieldOfficerDashboard.jsx` (Lines 534-535)
**Current:**
```javascript
const REQUIRED_DOCS = ["CNIC", "GUARDIAN_CNIC", "HSSC_RESULT", "UNIVERSITY_CARD", "FEE_INVOICE", "INCOME_CERTIFICATE", "UTILITY_BILL", "TRANSCRIPT"];
const OPTIONAL_DOCS = ["TRANSCRIPT", "DEGREE_CERTIFICATE", "ENROLLMENT_CERTIFICATE"];
```

**New:**
```javascript
const REQUIRED_DOCS = ["CNIC", "GUARDIAN_CNIC", "FEE_INVOICE", "SSC_RESULT", "HSSC_RESULT", "INCOME_CERTIFICATE", "UTILITY_BILL"];
const OPTIONAL_DOCS = ["TRANSCRIPT", "UNIVERSITY_CARD", "ENROLLMENT_CERTIFICATE", "DEGREE_CERTIFICATE", "SECOND_GUARDIAN_CNIC"];
```

**Why:** Field Officer review modal shows required vs optional. Matches new structure.

---

### FILE 9: `AdminApplicationDetail.jsx` (Line 835)
**Current:**
```javascript
const REQUIRED_DOCS = ["CNIC", "GUARDIAN_CNIC", "HSSC_RESULT", "PHOTO", "FEE_INVOICE", "INCOME_CERTIFICATE", "UTILITY_BILL", "UNIVERSITY_CARD", "ENROLLMENT_CERTIFICATE", "TRANSCRIPT"];
```

**New:**
```javascript
const REQUIRED_DOCS = ["CNIC", "GUARDIAN_CNIC", "FEE_INVOICE", "SSC_RESULT", "HSSC_RESULT", "INCOME_CERTIFICATE", "UTILITY_BILL"];
```

**Why:** Admin detail view. Remove PHOTO (legacy), UNIVERSITY_CARD (now optional), TRANSCRIPT (now optional), ENROLLMENT_CERTIFICATE (now optional), add SSC_RESULT.

---

## ✅ DATABASE CHECK

**Prisma schema DocumentType enum** - `schema.prisma` (lines 391-404)

**Current includes:**
- CNIC ✅
- GUARDIAN_CNIC ✅
- PHOTO ✓ (leave as-is, it's for profile, not document)
- SSC_RESULT ✅
- HSSC_RESULT ✅
- UNIVERSITY_CARD ✅
- FEE_INVOICE ✅
- INCOME_CERTIFICATE ✅
- UTILITY_BILL ✅
- TRANSCRIPT ✅
- DEGREE_CERTIFICATE ✅
- ENROLLMENT_CERTIFICATE ✅
- OTHER ✅

**Needed additions:**
- SECOND_GUARDIAN_CNIC ❌ **NEEDS TO BE ADDED**

---

## 📊 SUMMARY OF CHANGES

**Total Files to Update: 9**
1. profileValidation.js - Update REQUIRED_DOCS
2. MyApplication.jsx - Update REQUIRED_DOCS (1 location) + currentDocChecklist (1 location)
3. DocumentUploader.jsx - Add SECOND_GUARDIAN_CNIC to TYPES
4. applications.js - Update REQUIRED_DOCS (2 locations)
5. SubAdminDashboard.jsx - Update REQUIRED_DOCS + OPTIONAL_DOCS
6. FieldOfficerDashboard.jsx - Update REQUIRED_DOCS + OPTIONAL_DOCS
7. AdminApplicationDetail.jsx - Update REQUIRED_DOCS
8. schema.prisma - Add SECOND_GUARDIAN_CNIC to DocumentType enum

**Total Code Changes: 11 locations**

**Risk Level: LOW**
- Changes are isolated to constants
- No logic changes, only data structure
- All changes are synchronized (update same values in multiple files)
- Database migration needed for new enum value (SECOND_GUARDIAN_CNIC)

---

## ⚠️ DATABASE MIGRATION REQUIRED

**After adding SECOND_GUARDIAN_CNIC to schema.prisma, you'll need to:**
```bash
npm run migrate dev
```

This will create a migration for the new DocumentType enum value.

---

## READY TO PROCEED?

All changes maintain backwards compatibility and won't break any existing functionality:
- ✅ Old documents in DB will still work (just won't be in required/optional lists)
- ✅ No API changes
- ✅ No breaking changes to validation logic
- ✅ Students can still upload any document type in "OTHER" category
