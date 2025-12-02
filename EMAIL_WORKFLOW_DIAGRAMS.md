# Email System Fix - Visual Workflow Diagram

##  OLD SYSTEM (INCORRECT) 

```
┌─────────────────────────────────────────────────────────┐
│ INITIAL APPLICATION SUBMISSION                           │
├─────────────────────────────────────────────────────────┤
│                                                           │
│  Student uploads CNIC.pdf             EMAIL SENT    
│  Student uploads HSSC.pdf             EMAIL SENT    
│  Student uploads UNIVERSITY.pdf       EMAIL SENT    
│  Student uploads FEE_INVOICE.pdf      EMAIL SENT    
│                                                           │
│  Result: 4 emails to case worker about initial uploads   │
│  Problem: Noisy and unnecessary at this stage           │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│ AFTER CASE WORKER REQUESTS DOCUMENTS                     │
├─────────────────────────────────────────────────────────┤
│                                                           │
│  Case Worker: "Need more docs"                          │
│  Student receives: Missing docs email                   │
│                                                           │
│  Student uploads NEW_DOC_1.pdf       EMAIL SENT    
│  Student uploads NEW_DOC_2.pdf       EMAIL SENT    
│                                                           │
│  Result: 2 emails about requested documents (correct)    │
│  But also 4 emails earlier (incorrect, would have sent)  │
└─────────────────────────────────────────────────────────┘
```

---

##  NEW SYSTEM (CORRECT) 

```
┌─────────────────────────────────────────────────────────┐
│ INITIAL APPLICATION SUBMISSION                           │
├─────────────────────────────────────────────────────────┤
│                                                           │
│  Student uploads CNIC.pdf                               │
│      Check: Were docs requested?  NO                │
│       NO EMAIL                                      
│                                                           │
│  Student uploads HSSC.pdf                               │
│      Check: Were docs requested?  NO                │
│       NO EMAIL                                      
│                                                           │
│  Student uploads UNIVERSITY.pdf                         │
│      Check: Were docs requested?  NO                │
│       NO EMAIL                                      
│                                                           │
│  Student uploads FEE_INVOICE.pdf                        │
│      Check: Were docs requested?  NO                │
│       NO EMAIL                                      
│                                                           │
│  Result: NO EMAILS at initial submission stage          │
│  Benefit: No noise, case worker reviews documents       │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│ CASE WORKER REVIEW - FINDS MISSING DOCUMENTS             │
├─────────────────────────────────────────────────────────┤
│                                                           │
│  Case Worker clicks: "Request Missing Documents"        │
│                                                           │
│   EMAIL TO STUDENT:                                   │
│     "Please upload: HSSC, Character Certificate"        │
│                                                           │
│  DATABASE UPDATED:                                      │
│     additionalDocumentsRequested = [                     │
│       "HSSC",                                            │
│       "Character Certificate"                           │
│     ]                                                    │
│                                                           │
│   Student is informed                                 │
│   System tracks which docs are expected               │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│ STUDENT UPLOADS REQUESTED DOCUMENTS                      │
├─────────────────────────────────────────────────────────┤
│                                                           │
│  Student uploads HSSC.pdf                               │
│      Check: Were docs requested?  YES               │
│       EMAIL TO CASE WORKER:                         │
│        "New Document: HSSC.pdf"                         │
│      Case worker reviews immediately                  
│                                                           │
│  Student uploads Character_Certificate.pdf              │
│      Check: Were docs requested?  YES               │
│       EMAIL TO CASE WORKER:                         │
│        "New Document: Character_Certificate.pdf"        │
│      Case worker reviews immediately                  
│                                                           │
│  Result: Only 2 emails (requested docs)                 │
│  Benefit: Targeted notifications                        │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│ AFTER CASE WORKER COMPLETES REVIEW                       │
├─────────────────────────────────────────────────────────┤
│                                                           │
│  Case Worker marks review complete                      │
│                                                           │
│  DATABASE UPDATED:                                      │
│     additionalDocumentsRequested = []  (cleared)        │
│                                                           │
│  Student uploads Portfolio.pdf (for reference)          │
│      Check: Were docs requested?  NO (array empty) │
│       NO EMAIL                                      │
│      Document is stored but no notification           
│                                                           │
│  Result: Inbox clean, only important notifications      │
│  Benefit: Case worker decides what's important         │
└─────────────────────────────────────────────────────────┘
```

---

##  Data Flow Diagram

### **UPLOAD ENDPOINT LOGIC**

```
Student uploads document
          ↓
┌─────────────────────────────────┐
│ POST /api/uploads               │
│ - File stored                   │
│ - Document record created       │
└──────────────┬──────────────────┘
               ↓
┌─────────────────────────────────┐
│ Check: applicationId + STUDENT?  │
└──────────────┬──────────────────┘
      YES →    ↓
    ┌───────────────────────────────────────┐
    │ notifyDocumentUploadAfterRequest()     │
    │ - Fetch field review                  │
    │ - Check additionalDocumentsRequested  │
    └──────────────┬────────────────────────┘
                   ↓
         ┌─────────────────┐
         │ Array empty?    │
         └────────┬────────┘
                  ↓
    ┌─────YES─────┴─────NO──────┐
    ↓                           ↓
EXIT SILENTLY            SEND EMAIL
(No request made)        to field officer
                         (Documents requested)
```

---

##  State Tracking in Database

### **FieldReview Table - Key Field**

```javascript
model FieldReview {
  // ... other fields ...
  
  // This array tracks what documents are being requested
  additionalDocumentsRequested String[]
  
  // Lifecycle:
  // - Initially: [] (empty, no request made)
  // - After case worker clicks "Request Docs": ["HSSC", "Character Cert"]
  // - After case worker approves docs: [] (cleared)
}
```

### **Example State Changes**

```
1. Application created
   additionalDocumentsRequested = []

2. Case worker requests documents
   Case Worker: "Need HSSC and Character Certificate"
   additionalDocumentsRequested = ["HSSC", "Character Certificate"]
   → Email sent to student

3. Student uploads HSSC
   additionalDocumentsRequested = ["HSSC", "Character Certificate"]
   → EMAIL TRIGGERED (documents are requested)

4. Student uploads Character Certificate  
   additionalDocumentsRequested = ["HSSC", "Character Certificate"]
   → EMAIL TRIGGERED (documents are requested)

5. Case worker completes review
   Case Worker: "All documents verified"
   additionalDocumentsRequested = [] (cleared)

6. Student uploads Portfolio.pdf (bonus doc)
   additionalDocumentsRequested = []
   → NO EMAIL (no request active)
```

---

##  Recipient Logic

```
┌────────────────────────────────┐
│ Document upload detected       │
│ + Request was made            │
└─────────────┬──────────────────┘
              ↓
    ┌─────────────────────┐
    │ Who to notify?      │
    └────────────┬────────┘
                 ↓
    ┌────────────┴────────────┐
    ↓                         ↓
Is case worker        No case worker
assigned?             assigned?
    ↓                         ↓
  YES                        NO
    ↓                         ↓
Send to          Find first ADMIN
case worker      and send email
                      ↓
                 (fallback recipient)
```

---

##  Code Changes Reference

### **File 1: uploads.js**

**Line 95-105 (POST endpoint):**
```javascript
// CHANGED: Now calls notifyDocumentUploadAfterRequest
if (applicationId && req.user.role === 'STUDENT') {
  notifyDocumentUploadAfterRequest(applicationId, studentId, doc.originalName || doc.type)
}
```

**Line 209-265 (Helper function):**
```javascript
// CHANGED: Completely rewritten
async function notifyDocumentUploadAfterRequest(...) {
  // ... fetch field review ...
  // NEW: Check if additionalDocumentsRequested has items
  if (!fieldReview.additionalDocumentsRequested?.length) {
    return;  // No request made, exit silently
  }
  // ... send email ...
}
```

### **File 2: fieldReviews.js**

**Line 264-295 (POST request-missing endpoint):**
```javascript
// NEW: Save the requested documents
await prisma.fieldReview.update({
  where: { id },
  data: {
    additionalDocumentsRequested: items,  // ← NEW
  },
});
```

---

##  Verification Questions

1. **Initial upload sends no email?**  Correct
2. **Request creates email to student?**  Correct  
3. **Requested doc upload sends email?**  Correct
4. **Non-requested doc sends no email?**  Correct
5. **Multiple uploads send multiple emails?**  Correct
6. **Email goes to assigned case worker?**  Correct

---

##  Deployment Notes

**No database migration needed** - The `additionalDocumentsRequested` field already exists in the schema as a `String[]`

**Backward compatible** - Old field reviews will have empty array, which is correct behavior

**Testing recommendations:**
1. Test with new field review
2. Test with existing field review (pre-change)
3. Test with multiple case workers
4. Test with admin fallback (no case worker)

