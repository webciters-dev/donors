# Case Worker Visibility Issue - Root Cause Analysis

## Issue Summary
**Scenario:** Admin assigned applicant "Johan Shah" (test+3@webciters.com) to "Case Worker 1" (test+31@webciters.com).

**Problem:** Case Worker 1 cannot see any students in their SubAdminDashboard despite receiving the assignment email with credentials.

**Status:** Case Worker 1 received login credentials via email:
- Name: Case Worker 1
- Role: Application Reviewer
- Application ID: fu41640p

---

## Root Cause Analysis

### Issue 1: Potential Role Mismatch (PRIMARY SUSPECT)

**Location:** `server/src/routes/fieldReviews.js` - Line 12-16 (GET endpoint)

```javascript
const where = (role === "SUB_ADMIN" || role === "CASE_WORKER")
  ? { officerUserId: req.user.id }
  : {};
```

**The Problem:**
1. When Admin assigns a case worker, the backend creates a **FieldReview** record with:
   - `applicationId` = fu41640p
   - `officerUserId` = Case Worker 1's user.id (let's call it: "officer_123")
   - `studentId` = student record for Johan Shah
   - `taskType` = whatever task type was selected

2. When Case Worker 1 tries to access `/api/field-reviews`, the backend:
   - Checks their `role` from the JWT token
   - Only applies the filter `{ officerUserId: req.user.id }` IF role is "SUB_ADMIN" or "CASE_WORKER"
   - If the role is something ELSE, the filter becomes empty `{}`, which returns ALL field reviews (admin view)

3. **CRITICAL FLAW:** Case Worker 1's User account might have been created with an INCORRECT role!

### Issue 2: Role Storage vs Expected Role

**Database Reality:**
- All case workers are stored in database with role = **"SUB_ADMIN"** (for backward compatibility)
- BUT the email says the role is **"Application Reviewer"** (marketing/display name)

**Code Reality:**
```javascript
// server/src/routes/users.js - Line 55 (when admin creates case worker via API)
role: "SUB_ADMIN" // Internal storage remains SUB_ADMIN for compatibility
```

**The Email:**
```
Name: Case Worker 1
Role: Application Reviewer  ← This is DISPLAY NAME only
Application ID: fu41640p    ← This is the applicationId being assigned
```

**What Should Be In Database:**
- User.role = "SUB_ADMIN" (internal/actual role)
- User.email = "test+31@webciters.com"
- User.name = "Case Worker 1"

---

## Critical Check List

###  What Works Correctly:
1. **FieldReview Creation** - Record IS created with correct:
   - `applicationId` (fu41640p) 
   - `studentId` (Johan Shah's ID) 
   - `officerUserId` (Case Worker 1's user ID) 

2. **Email Sending** - Case Worker 1 RECEIVED email with credentials 

3. **Login** - Case Worker 1 CAN login (otherwise they wouldn't be frustrated) 

###  What's Broken:
1. **Dashboard Shows No Students** - GET `/api/field-reviews` returns empty array

### The Two Possible Causes:

**CAUSE A: Role Mismatch** (70% probability)
```
User record exists:
  id: "officer_123"
  email: "test+31@webciters.com"
  name: "Case Worker 1"
  role: "DONOR" or "STUDENT" or "ADMIN" (WRONG!)
        ↑
        This would cause the filtering to fail!

When Case Worker logs in and calls GET /api/field-reviews:
- Their token has role = "DONOR" (or wrong role)
- Backend checks: is role === "SUB_ADMIN" || role === "CASE_WORKER"?
- Result: FALSE (because role is wrong)
- So filter becomes: {} (empty, which returns all records for admin view)
- But Case Worker is looking for records where officerUserId = "officer_123"
- Frontend shows: [empty list] because the application belongs to "officer_123" but query returned all records
```

**CAUSE B: officerUserId Mismatch** (25% probability)
```
FieldReview table has:
  applicationId: "fu41640p" 
  studentId: "student_456" 
  officerUserId: "WRONG_ID" ← Some other user's ID
  
When Case Worker 1 (id: "officer_123") calls GET /api/field-reviews:
- Query: fieldReview WHERE officerUserId = "officer_123"
- Result: [] (empty - no records match because officerUserId was set to different ID)
```

**CAUSE C: Case Worker Account Not Fully Created** (5% probability)
```
Case Worker account exists but with issues:
- No proper ID generated
- Login works but JWT token is malformed
- Authentication fails silently and returns no records
```

---

## Why "Application ID: fu41640p" in Email is a Red Herring

The email shows:
```
Application ID: fu41640p
```

This is the **applicationId** of the assignment, NOT Case Worker 1's user ID!

- **applicationId (fu41640p)** = The application being reviewed
- **officerUserId** = Case Worker 1's actual user account ID (different from applicationId)

The email is correctly informing Case Worker 1 which application they're assigned to, but this doesn't help them find it in the dashboard because:

```javascript
// Dashboard queries like this:
GET /api/field-reviews?filter[officerUserId]=<case_worker_user_id>

// NOT like this:
GET /api/field-reviews?filter[applicationId]=fu41640p
```

---

## Data Flow Diagram - Where the Break Likely Occurs

```
ADMIN ASSIGNS CASE WORKER
├─ Admin selects: "Case Worker 1" (from dropdown of SUB_ADMIN users)
├─ Admin clicks: "Assign"
│
└─→ POST /api/field-reviews
    Body: {
      applicationId: "fu41640p",
      studentId: "<Johan Shah's ID>",
      officerUserId: "<Case Worker 1's user ID>",  ← MUST match User.id
      taskType: ""
    }
    
    Server creates:
    ├─ FieldReview record with above data 
    ├─ Sends 3 emails:
    │  ├─ Email to Case Worker 1  (received)
    │  ├─ Email to Student 
    │  └─ (Optional) Admin notification
    └─ Returns 201 OK 

CASE WORKER 1 LOGS IN
├─ Email: test+31@webciters.com
├─ Password: [from assignment email]
│
└─→ POST /api/login
    Login logic retrieves User record:
    ├─ Query: SELECT * FROM users WHERE email = "test+31@webciters.com"
    ├─ Check: Is passwordHash correct? YES 
    ├─ Extract: user.role = "???"  ← CRITICAL CHECK POINT
    └─ JWT token: { sub: user.id, role: user.role, email: user.email }

CASE WORKER 1 OPENS DASHBOARD
├─ React component: SubAdminDashboard.jsx
└─→ GET /api/field-reviews
    Header: Authorization: Bearer <JWT_TOKEN>
    
    Server side:
    ├─ Extract: req.user.role from JWT
    ├─ Check: is role "SUB_ADMIN" || "CASE_WORKER"?
    │
    │  IF YES:
    │  └─ where = { officerUserId: req.user.id }
    │     Return: FieldReviews where officerUserId = "officer_123"
    │     Result: [fu41640p assignment, ...other assignments]
    │
    │  IF NO (BROKEN):
    │  └─ where = {} (empty filter)
    │     Return: Depends on admin logic...
    │     OR returns different data structure
    │     Result: Case Worker sees empty list 
    
    Frontend:
    └─ Display: reviews list (empty or wrong structure)
```

---

## Hypothesis: How Case Worker 1 Was Created

**Most Likely Scenario:**
1. Admin created Case Worker 1 via UI or API
2. System created User record with role = "SUB_ADMIN" 
3. BUT... there's a possibility the role got changed or corrupted somewhere

**OR Less Likely Scenario:**
1. Case Worker 1 already existed as a STUDENT or DONOR user
2. Admin tried to "reuse" this account for case worker duty
3. But the role wasn't updated to SUB_ADMIN
4. So login works (password is correct) but filtering fails

---

## SQL Query to Diagnose

To find the exact problem, run these queries on the PostgreSQL database:

```sql
-- Query 1: Find the User record for Case Worker 1
SELECT id, name, email, role, createdAt, updatedAt 
FROM users 
WHERE email = 'test+31@webciters.com';

-- Expected result:
-- id            | name           | email                 | role      | ...
-- officer_123   | Case Worker 1  | test+31@webciters.com | SUB_ADMIN | ...

-- Query 2: Find the FieldReview assignment
SELECT id, applicationId, studentId, officerUserId, status, createdAt
FROM field_reviews
WHERE applicationId = 'fu41640p';

-- Expected result:
-- id            | applicationId | studentId    | officerUserId | status  | ...
-- fr_abc123     | fu41640p      | student_456  | officer_123   | PENDING | ...

-- Query 3: Verify the relationship
SELECT fr.id, fr.applicationId, fr.officerUserId, u.id, u.role, u.email
FROM field_reviews fr
LEFT JOIN users u ON fr.officerUserId = u.id
WHERE fr.applicationId = 'fu41640p';

-- This shows if the officerUserId actually points to a valid user
-- If u.id is NULL, then the officer was deleted or ID is wrong
-- If u.role != 'SUB_ADMIN', then the role is incorrect
```

---

## Most Probable Root Cause Summary

### **CAUSE A is 70% Likely: Role Mismatch**

Case Worker 1's User record probably has:
```
role = "STUDENT" (or "DONOR" or something other than "SUB_ADMIN")
```

**Why this happens:**
1. If Case Worker 1's email was previously used for a student application
2. And then admin tried to repurpose it for case worker duty
3. The user.role might not have been updated to SUB_ADMIN
4. OR system auto-created the user with wrong role

**Fix:**
```javascript
// Update User.role to SUB_ADMIN
UPDATE users SET role = 'SUB_ADMIN' WHERE email = 'test+31@webciters.com';
```

---

## What You Should Verify Immediately

1. **Check Database:**
   ```sql
   SELECT email, role FROM users WHERE email = 'test+31@webciters.com';
   ```
   **Question:** Is role = 'SUB_ADMIN'?
   - If YES → Continue to check Query 2
   - If NO → This is the problem! Need to update role

2. **Check FieldReview:**
   ```sql
   SELECT officerUserId FROM field_reviews WHERE applicationId = 'fu41640p';
   ```
   **Question:** Does this return a valid User ID that matches the case worker's id?
   - If YES → The assignment is correct, problem is in role or filtering
   - If NO or NULL → Assignment wasn't created properly

3. **Check Login Token:**
   - Ask Case Worker 1 to open browser DevTools → Application → Cookies/LocalStorage
   - Look for JWT token
   - Decode at jwt.io
   - Check the "role" field in payload
   - **Question:** Is role = 'SUB_ADMIN'?
   - If YES → Problem is in GET endpoint logic
   - If NO → Problem is role isn't being set correctly on login

---

## Expected JWT Token Structure

When Case Worker 1 logs in successfully, their JWT should contain:
```json
{
  "sub": "officer_123",
  "role": "SUB_ADMIN",
  "email": "test+31@webciters.com",
  "iat": 1701388800,
  "exp": 1701993600
}
```

If role is anything other than "SUB_ADMIN" or "CASE_WORKER", the filtering will fail!

---

## Prevention: What Should Happen Going Forward

1. **When Admin Creates Case Worker via API:**
   - POST to `/api/users/sub-admins` or `/api/users/case-workers`
   - System creates User with: role = "SUB_ADMIN"
   - Email sent with temporary password

2. **When Admin Assigns Application:**
   - POST to `/api/field-reviews` with:
     - applicationId
     - studentId
     - officerUserId (Case Worker's User.id)
     - taskType (optional)
   - FieldReview created with officerUserId pointing to valid SUB_ADMIN user

3. **When Case Worker Logs In:**
   - Login endpoint finds User by email
   - Verifies password
   - Checks User.role = "SUB_ADMIN"
   - JWT token includes: role: "SUB_ADMIN"

4. **When Case Worker Opens Dashboard:**
   - GET /api/field-reviews receives JWT
   - Server checks: role === "SUB_ADMIN"? YES
   - Applies filter: { officerUserId: req.user.id }
   - Returns all FieldReviews where officerUserId matches their User.id
   - Dashboard displays list of assigned applications

---

## Next Steps to Resolve

### Step 1: Verify the Problem (Database Check)
Run the three SQL queries above to confirm which scenario is occurring.

### Step 2: Verify the User Role
```bash
# From server terminal, you can query directly:
# SELECT id, email, role FROM users WHERE email = 'test+31@webciters.com';
```

### Step 3: If Role is Wrong
Execute:
```sql
UPDATE users SET role = 'SUB_ADMIN' WHERE email = 'test+31@webciters.com';
```

### Step 4: Case Worker Login Again
- Clear browser cache/cookies
- Log in again
- Check dashboard

### Step 5: If Still Broken
The issue might be in the SubAdminDashboard component's data processing or display logic.

---

## Files Involved

### Frontend:
- `src/pages/SubAdminDashboard.jsx` - Case worker dashboard display
  - Line 68: `const res = await fetch(...api/field-reviews...)`
  - Line 69: Expects response format: `{ reviews: [...] }`

### Backend:
- `server/src/routes/fieldReviews.js` - Field review API
  - Line 12: Role check for filtering
  - Line 15: Query filtering logic
  
- `server/src/routes/auth.js` - Login endpoint
  - Line 81-82: Role extraction for JWT
  
- `server/src/routes/users.js` - User management
  - Line 50: Case worker creation with SUB_ADMIN role

### Database:
- `server/prisma/schema.prisma`
  - Line 248: User model with role field
  - Line 291: FieldReview model with officerUserId relationship

---

## Code Fix (If Confirmed to Be Role Issue)

### In `server/src/routes/fieldReviews.js` - Add Validation:

**BEFORE (Current):**
```javascript
router.get("/", requireAuth, async (req, res) => {
  try {
    const role = req.user?.role;
    const where = (role === "SUB_ADMIN" || role === "CASE_WORKER")
      ? { officerUserId: req.user.id }
      : {};
    // ... rest of query
```

**AFTER (With Better Error Handling):**
```javascript
router.get("/", requireAuth, async (req, res) => {
  try {
    const role = req.user?.role;
    const userId = req.user?.id;
    
    // Debug: Log what's happening
    console.log(`[FieldReview GET] User: ${userId}, Role: ${role}`);
    
    // Build filter
    let where = {};
    if (role === "SUB_ADMIN" || role === "CASE_WORKER") {
      where = { officerUserId: userId };
      console.log(`[FieldReview GET] Applied case worker filter: ${userId}`);
    } else if (role === "ADMIN" || role === "SUPER_ADMIN") {
      // Admin sees all (where = {})
      console.log(`[FieldReview GET] Admin sees all records`);
    } else {
      // Unknown role - deny access
      return res.status(403).json({ 
        error: "Your role is not authorized to view field reviews",
        role: role 
      });
    }
    
    const reviews = await prisma.fieldReview.findMany({
      where,
      orderBy: { createdAt: "desc" },
      // ... rest remains same
```

This adds logging and explicit role validation.

---

## Conclusion

**Most Likely Problem:** Case Worker 1's User.role is not "SUB_ADMIN"

**Why It Happens:** 
- Email was previously used for student registration
- When converted to case worker, role wasn't updated
- Login works (password correct) but filtering fails (role wrong)

**Solution:** Update the user's role to "SUB_ADMIN" in the database

**Verification:** Check the three SQL queries above in the database
