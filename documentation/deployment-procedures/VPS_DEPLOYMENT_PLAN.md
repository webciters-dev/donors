# VPS Deployment Plan - Changes Overview

## Summary of Changes

### Backend Changes (2 files)
1. **server/src/middleware/auth.js**
   - Changed: JWT_SECRET from module-level constant to lazy-loaded function
   - Why: ES module hoisting was causing it to be read before dotenv.config()
   - Impact: Server will now start without JWT_SECRET error
   - Lines affected: 1-15 (header), 32, 129
   - Rollback: Easy - restore from git

2. **server/src/server.js**
   - Changed: Added proper path resolution for .env.production file
   - Why: Relative path `.env.production` was looking in wrong directory
   - Impact: Correctly loads JWT_SECRET from server/.env.production
   - Lines affected: 1-14 (header - added import path and fileURLToPath)
   - Rollback: Easy - restore from git

### Frontend Changes (7 files)
1. **src/pages/StudentProfile.jsx** - Line 69
   - Changed: `authHeader` wrapped with `useMemo()`
   - Why: Prevent infinite API polling when clicking PROFILE
   - Impact: Eliminates 26+ repeated /api/uploads requests

2. **src/pages/MyApplication.jsx** - Line 35
   - Changed: `authHeader` wrapped with `useMemo()`
   - Why: Same infinite polling fix
   - Impact: Cleaner network tab

3. **src/pages/SubAdminApplicationDetail.jsx** - Line 31
   - Changed: `authHeader` wrapped with `useMemo()`
   - Why: Same infinite polling fix
   - Impact: Smoother dashboard experience

4. **src/pages/AdminApplicationDetail.jsx** - Line 28
   - Changed: `authHeader` wrapped with `useMemo()`
   - Why: Same infinite polling fix
   - Impact: Better performance

5. **src/pages/FieldOfficerDashboard.jsx** - Line 16
   - Changed: `authHeader` wrapped with `useMemo()`
   - Why: Same infinite polling fix
   - Impact: Reduced network requests

6. **src/pages/AdminApplications.jsx** - Line 20
   - Changed: `authHeader` wrapped with `useMemo()`
   - Why: Same infinite polling fix
   - Impact: Cleaner user experience

7. **src/pages/SubAdminDashboard.jsx** - Line 25
   - Changed: `authHeader` wrapped with `useMemo()`
   - Why: Same infinite polling fix
   - Impact: Better performance

## Risk Assessment

### LOW RISK Changes
- ✅ auth.js - Only changes when JWT_SECRET is accessed (at request time, not module load)
- ✅ server.js - Only changes where .env file is loaded from (still loads same file)
- ✅ Frontend memoization - Only reduces unnecessary re-renders (no behavior change)

### Pre-Deployment Tests (on localhost first)
- [ ] Backend starts without errors
- [ ] Can login as student
- [ ] Can view profile without infinite requests
- [ ] Can upload/remove video
- [ ] Can submit application

### Rollback Strategy (if needed)
```bash
# On VPS, revert to last known good:
cd /home/sohail/projects/donors
git checkout server/src/middleware/auth.js
git checkout server/src/server.js
git checkout src/pages/*.jsx
npm run build
pm2 restart all
```

## Deployment Steps

### Phase 1: Pre-Deployment (Windows)
1. ✅ Test on localhost (npm run dev)
2. ✅ Verify no build errors (npm run build)
3. ✅ Create backups locally

### Phase 2: VPS Backup
1. SSH to VPS
2. Create backup directory with timestamp
3. Backup current code

### Phase 3: Code Deployment
1. Pull latest from git OR copy files via SCP
2. npm install (if needed)
3. npm run build (frontend)

### Phase 4: Verification
1. Start backend with NODE_ENV=production
2. Check logs for errors
3. Test login
4. Test profile page (check network tab)
5. Monitor for 24 hours

### Phase 5: Rollback (if needed)
1. git checkout changed files
2. npm run build
3. Restart services
4. Verify

## Files Ready for Deployment

✅ server/src/middleware/auth.js - READY
✅ server/src/server.js - READY
✅ src/pages/StudentProfile.jsx - READY
✅ src/pages/MyApplication.jsx - READY
✅ src/pages/SubAdminApplicationDetail.jsx - READY
✅ src/pages/AdminApplicationDetail.jsx - READY
✅ src/pages/FieldOfficerDashboard.jsx - READY
✅ src/pages/AdminApplications.jsx - READY
✅ src/pages/SubAdminDashboard.jsx - READY

## Critical Notes

⚠️ **MUST TEST ON LOCALHOST FIRST** before VPS deployment
⚠️ **Keep git history** for easy rollback
⚠️ **No database changes** - safe to rollback
⚠️ **No configuration changes** - safe to rollback
⚠️ **Monitor VPS for 30 minutes** after deployment

---

Ready to proceed? Confirm and I'll help with careful step-by-step deployment.
