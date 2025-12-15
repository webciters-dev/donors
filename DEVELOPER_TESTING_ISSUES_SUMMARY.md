# Developer Testing - Issues Summary & Fix Priority

## Overview
Developer has tested the complete application flow and identified **4 major issues** blocking the testing process. This document provides prioritized fixes.

---

## Issue Summary Table

| # | Issue | Severity | Status | Blocker | Fix |
|---|-------|----------|--------|---------|-----|
| 1 | Profile photo not displaying | HIGH | Ready | Photo viewing in admin | See DEVELOPER_TEST_FINDINGS_ISSUE_1.md |
| 2 | reCAPTCHA error on student reply | HIGH | Ready | Student communication | See DEVELOPER_TEST_FINDINGS_ISSUE_2.md |
| 3 | Failed to create board member | HIGH | Ready | Interview setup | See DEVELOPER_TEST_FINDINGS_ISSUE_3.md |
| 4 | Cannot select student for interview | MEDIUM | Blocked by #3 | Interview scheduling | Depends on #3 |

---

## Priority Fixes (In Order)

### PRIORITY 1: Issue #2 - reCAPTCHA Action Missing
**Why First?** - Quickest fix, enables Issue #3 testing
**Time to Fix:** 2 minutes
**Files:** `server/src/middleware/recaptcha.js`

**What to Do:**
```javascript
// Line ~186 in requireBasicRecaptcha definition

allowedActions: [
  'submit', 
  'register', 
  'login', 
  'reset', 
  'form', 
  'createCaseWorker',
  'sendReply',           // ← ADD
  'sendMessage',         // ← ADD
  'createBoardMember'    // ← ADD
]
```

**Fixes:**
- ✅ Student can reply to admin messages (Issue #2)
- ✅ Admin can create board members (Issue #3)
- ✅ Enables interview scheduling testing

---

### PRIORITY 2: Issue #3A - Use Unique Email
**Why Second?** - Tests if board member creation works
**Time to Fix:** 30 seconds

**What to Do:**
1. Open Admin Settings → Board Members tab
2. Try creating board member with:
   - Name: Dr. John Smith
   - Email: **test+100@webciters.com** (use new number)
   - Title: Academic Director

**If Success:**
- Issue #3 is solved ✅
- Move to Priority 3

**If Still Fails:**
- Check browser console Network tab
- Get actual error response
- Share with developer team

---

### PRIORITY 3: Issue #1 - Photo Upload Bug
**Why Third?** - Complex debugging, affects all student views
**Time to Fix:** 30-60 minutes
**Files:** `server/src/routes/photos.js` and `src/components/StudentPhoto.jsx`

**What to Do:**
See DEVELOPER_TEST_FINDINGS_ISSUE_1.md for:
- Diagnostic steps (check file system, database, static serving)
- 5 proposed fixes (debug logging, error handling, cache-busting)
- Testing scenarios

**Impact:**
- Admin can see student photos ✅
- Donors can see photos in marketplace
- Professional appearance of platform

---

### PRIORITY 4: Issue #4 - Approve Student First
**Why Fourth?** - Prerequisite for interview testing
**Time to Fix:** 2 minutes

**What to Do:**
1. Login as admin (test+60@webciters.com / Admin@123)
2. Go to Applications
3. Find test student
4. Click "Approve" button
5. Student status changes to ACTIVE

**Then Try Interview:**
1. Go to Interviews tab
2. Click "Schedule Interview"
3. Student dropdown should now show test student
4. Select board member (created in Priority 2)
5. Set date, time, meeting link
6. Submit

---

## Issue Details Quick Links

| Issue | Document | Key Points |
|-------|----------|-----------|
| #1 Photo | DEVELOPER_TEST_FINDINGS_ISSUE_1.md | Upload succeeds but file doesn't display later |
| #2 reCAPTCHA Reply | DEVELOPER_TEST_FINDINGS_ISSUE_2.md | Action 'sendReply' not in allowedActions list |
| #3 Board Member | DEVELOPER_TEST_FINDINGS_ISSUE_3.md | Likely email conflict; also needs reCAPTCHA action |
| #4 Interview Student | DEVELOPER_TEST_FINDINGS_ISSUE_3.md | Need to approve student first |

---

## Implementation Checklist

### Phase 1: Backend Fixes (15 minutes)
- [ ] Open `server/src/middleware/recaptcha.js`
- [ ] Add to `requireBasicRecaptcha.allowedActions` array:
  - [ ] `'sendReply'`
  - [ ] `'sendMessage'`
  - [ ] `'createBoardMember'`
- [ ] Save file
- [ ] Restart backend: `npm run dev`

### Phase 2: Test Board Member Creation (5 minutes)
- [ ] Login as admin
- [ ] Go to Settings → Board Members
- [ ] Create board member with unique email (test+100@webciters.com)
- [ ] Verify success message
- [ ] Verify board member appears in list

### Phase 3: Test Student Reply (5 minutes)
- [ ] Login as student
- [ ] Go to My Application
- [ ] Find admin message
- [ ] Click "Reply to Admin"
- [ ] Type message and send
- [ ] Verify no reCAPTCHA error

### Phase 4: Test Interview Scheduling (10 minutes)
- [ ] Login as admin
- [ ] Go to Applications
- [ ] Approve test student
- [ ] Go to Interviews tab
- [ ] Schedule new interview
- [ ] Select student (should be in dropdown now)
- [ ] Select board member
- [ ] Set date, time, meeting link
- [ ] Submit and verify emails sent

### Phase 5: Photo Debugging (30-60 minutes)
- [ ] Follow diagnostic steps in Issue #1 document
- [ ] Determine root cause
- [ ] Apply appropriate fix
- [ ] Test photo upload and display

---

## Expected Results After Fixes

### ✅ What Will Work:
1. Student can reply to admin without reCAPTCHA error
2. Admin can create board members
3. Admin can schedule interviews with board members
4. Approved students appear in interview student dropdown
5. Interview scheduling sends emails to student and board members

### ⚠️ Still Needs Work:
1. Student profile photos display in admin review (Issue #1)
2. Student profile photos visible to donors in marketplace

---

## Questions for Developer

Before implementing fixes, ask:

1. **Issue #3 Email Error:**
   - When you see "Failed to create board member", what does browser console show?
   - Check Network tab → POST /api/board-members → Response
   - Share the actual error message

2. **Issue #1 Photo:**
   - When you re-upload photo, does it display?
   - Or does it disappear after page refresh?
   - Does placeholder show or completely blank?

3. **Testing Environment:**
   - Are you testing locally (localhost) or production (aircrew.nl)?
   - Which browser (Chrome, Firefox, Safari)?

---

## Next Steps

1. **Today:** Apply Priority 1 fix (reCAPTCHA actions) - 2 minutes
2. **Today:** Test Priority 2 & 3 (board member + reply) - 10 minutes
3. **Today:** Test Priority 4 (approve student) - 5 minutes
4. **This Week:** Debug Priority 5 (photo issue) - 1-2 hours

---

## Support

If issues persist:
1. Share actual error messages from browser console
2. Share server logs (check terminal for error details)
3. Confirm which endpoint is failing (check Network tab)
4. Provide browser/OS information for reproduction

