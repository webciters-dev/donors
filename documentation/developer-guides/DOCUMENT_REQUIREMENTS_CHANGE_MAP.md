# Document Requirements Change Map

## Purpose
This document maps ALL locations in the codebase where document requirements are defined, validated, or displayed. Use this to make coordinated changes across Frontend, Backend, and Database.

---

## 📍 REQUIRED_DOCS Definition Locations

### 1. **Frontend - MyApplication.jsx** ⭐ PRIMARY
- **File**: `c:\projects\donor\src\pages\MyApplication.jsx`
- **Line**: 28
- **Current Value**: `["CNIC", "GUARDIAN_CNIC", "HSSC_RESULT", "UNIVERSITY_CARD", "FEE_INVOICE", "INCOME_CERTIFICATE", "UTILITY_BILL", "TRANSCRIPT"]`
- **Purpose**: Defines required documents shown to students. Used for:
  - Application submission validation (line 1364)
  - Document completion percentage calculation (line 1077)
  - Required document display (line 1104+)

### 2. **Frontend - profileValidation.js** ⭐ PRIMARY
- **File**: `c:\projects\donor\src\lib\profileValidation.js`
- **Line**: 5
- **Current Value**: `["CNIC", "GUARDIAN_CNIC", "HSSC_RESULT", "UNIVERSITY_CARD", "FEE_INVOICE", "INCOME_CERTIFICATE", "UTILITY_BILL", "TRANSCRIPT"]`
- **Purpose**: Defines required documents for profile completion calculations
- **Used By**:
  - `calculateProfileCompleteness()` - calculates % of profile completion
  - `calculateOverallCompleteness()` - combines profile + document completion (line 69+)

### 3. **Frontend - SubAdminDashboard.jsx** ⭐ SECONDARY
- **File**: `c:\projects\donor\src\pages\SubAdminDashboard.jsx`
- **Line**: 559
- **Current Value**: `["CNIC", "GUARDIAN_CNIC", "HSSC_RESULT", "PHOTO", "UNIVERSITY_CARD", "FEE_INVOICE", "INCOME_CERTIFICATE", "UTILITY_BILL"]`
- **⚠️ NOTE**: This includes "PHOTO" but doesn't include "TRANSCRIPT"
- **Purpose**: ReviewModal component for SubAdmin to see required documents
- **Used For**: Document status display in review modal

### 4. **Frontend - FieldOfficerDashboard.jsx** ⭐ SECONDARY
- **File**: `c:\projects\donor\src\pages\FieldOfficerDashboard.jsx`
- **Line**: 493
- **Current Value**: `["CNIC", "GUARDIAN_CNIC", "HSSC_RESULT", "UNIVERSITY_CARD", "FEE_INVOICE", "INCOME_CERTIFICATE", "UTILITY_BILL", "TRANSCRIPT"]`
- **Purpose**: ReviewModal component for Field Officer to see required documents
- **Used For**: Document status display in review modal (line 571+)

### 5. **Frontend - AdminApplicationDetail.jsx** ⭐ SECONDARY
- **File**: `c:\projects\donor\src\pages\AdminApplicationDetail.jsx`
- **Line**: 832
- **Current Value**: `["CNIC", "GUARDIAN_CNIC", "HSSC_RESULT", "PHOTO", "FEE_INVOICE", "INCOME_CERTIFICATE", "UTILITY_BILL", "UNIVERSITY_CARD", "ENROLLMENT_CERTIFICATE", "TRANSCRIPT"]`
- **⚠️ NOTE**: This has different document types including "PHOTO", "ENROLLMENT_CERTIFICATE"
- **Purpose**: Admin detail view to check missing required documents
- **Used For**: Missing required documents badge display

---

## 📍 OPTIONAL_DOCS Definition Locations

### 1. **Frontend - SubAdminDashboard.jsx**
- **File**: `c:\projects\donor\src\pages\SubAdminDashboard.jsx`
- **Line**: 601
- **Current Value**: `["TRANSCRIPT", "DEGREE_CERTIFICATE", "ENROLLMENT_CERTIFICATE"]`

### 2. **Frontend - FieldOfficerDashboard.jsx**
- **File**: `c:\projects\donor\src\pages\FieldOfficerDashboard.jsx`
- **Line**: 535
- **Current Value**: `["TRANSCRIPT", "DEGREE_CERTIFICATE", "ENROLLMENT_CERTIFICATE"]`

---

## 📍 Backend Validation Locations

### 1. **Backend - applications.js** ⭐ PRIMARY
- **File**: `c:\projects\donor\server\src\routes\applications.js`
- **Lines**: 
  - Line 296: Approval validation
  - Line 466: Approval validation (with forceApprove option)
- **Current Value**: `["CNIC", "GUARDIAN_CNIC", "HSSC_RESULT", "UNIVERSITY_CARD", "FEE_INVOICE", "INCOME_CERTIFICATE", "UTILITY_BILL", "TRANSCRIPT"]`
- **Purpose**: Validates that applications have all required documents before approval
- **Features**:
  - Checks missing documents
  - Prevents approval if docs missing (unless forceApprove=true)
  - Returns list of missing documents in error response

---

## 📍 Database Schema

### **Prisma Schema**
- **File**: `c:\projects\donor\server\prisma\schema.prisma`
- **Lines**: 391-404
- **DocumentType Enum**:
  ```
  enum DocumentType {
    CNIC
    GUARDIAN_CNIC
    PHOTO
    SSC_RESULT
    HSSC_RESULT
    UNIVERSITY_CARD
    FEE_INVOICE
    INCOME_CERTIFICATE
    UTILITY_BILL
    TRANSCRIPT
    DEGREE_CERTIFICATE
    ENROLLMENT_CERTIFICATE
    OTHER
  }
  ```

---

## 🔴 INCONSISTENCIES FOUND

### **Issue 1: PHOTO Document**
- ✅ Defined in Prisma schema
- ✅ Used in AdminApplicationDetail.jsx
- ✅ Used in SubAdminDashboard.jsx
- ❌ NOT in MyApplication.jsx (where students upload)
- ❌ NOT in profileValidation.js
- ❌ NOT in backend validation

### **Issue 2: ENROLLMENT_CERTIFICATE & DEGREE_CERTIFICATE**
- ✅ Optional in SubAdminDashboard.jsx
- ✅ Optional in FieldOfficerDashboard.jsx
- ✅ Defined in MyApplication.jsx as optional (currentDocChecklist)
- ❌ REQUIRED in AdminApplicationDetail.jsx

### **Issue 3: TRANSCRIPT**
- ✅ Required in MyApplication.jsx
- ✅ Required in FieldOfficerDashboard.jsx
- ✅ Required in profileValidation.js
- ❌ NOT in SubAdminDashboard.jsx required list

---

## ✅ To Make Changes Safely:

### Step 1: Update the PRIMARY sources (these control the logic):
1. `c:\projects\donor\src\lib\profileValidation.js` - Line 5
2. `c:\projects\donor\server\src\routes\applications.js` - Lines 296, 466
3. `c:\projects\donor\src\pages\MyApplication.jsx` - Line 28

### Step 2: Update the SECONDARY sources (these are UI displays):
1. `c:\projects\donor\src\pages\SubAdminDashboard.jsx` - Lines 559, 601
2. `c:\projects\donor\src\pages\FieldOfficerDashboard.jsx` - Lines 493, 535
3. `c:\projects\donor\src\pages\AdminApplicationDetail.jsx` - Line 832

### Step 3: Verify Database:
- Ensure new document types exist in Prisma schema DocumentType enum
- Run database migrations if schema changes

---

## 📋 Change Template

When making changes, use this format:

```javascript
// OLD:
const REQUIRED_DOCS = ["CNIC", "GUARDIAN_CNIC", "HSSC_RESULT", "UNIVERSITY_CARD", "FEE_INVOICE", "INCOME_CERTIFICATE", "UTILITY_BILL", "TRANSCRIPT"];

// NEW:
const REQUIRED_DOCS = ["CNIC", "GUARDIAN_CNIC", "HSSC_RESULT", "UNIVERSITY_CARD", "FEE_INVOICE", "INCOME_CERTIFICATE", "UTILITY_BILL", "TRANSCRIPT", "NEW_DOC_TYPE"];
```

---

## 🎯 Total Files Affected: 6
1. MyApplication.jsx
2. profileValidation.js
3. SubAdminDashboard.jsx
4. FieldOfficerDashboard.jsx
5. AdminApplicationDetail.jsx
6. applications.js (backend)
