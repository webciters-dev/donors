# 🚀 ERROR HANDLING SYSTEM - INTEGRATION CHECKLIST

**For**: Donor Project Dashboard
**Created**: 2025-01-15
**Priority**: HIGH - Do this ASAP to maintain code quality

---

## 📦 Files Created & Ready

| File | Status | Purpose |
|------|--------|---------|
| `server/utils/errorCodes.js` | ✅ Ready | 80+ error codes, 9 categories |
| `server/utils/appError.js` | ✅ Ready | Error handler & middleware |
| `server/utils/logger.js` | ✅ Ready | Structured logging |
| `.copilot-instructions.md` | ✅ Ready | Quality standards & checklist |
| `ERROR_HANDLING_SETUP_COMPLETE.md` | ✅ Ready | This checklist |

---

## ⚙️ Integration Steps (30 minutes)

### Step 1: Update Express App (5 min)

**File**: `server/app.js` or `server/server.js`

Find this:
```javascript
const app = express();

// Other middleware (cors, body parser, etc)
app.use(express.json());
app.use(cors());
```

Add these TWO lines:
```javascript
const app = express();

// === ADD THIS SECTION ===
const { errorHandler, asyncHandler, AppError, ErrorCodes } = require('./utils/appError');
const logger = require('./utils/logger');

// Other middleware (cors, body parser, etc)
app.use(express.json());
app.use(cors());

// ADD THIS LINE (after all middleware, before routes)
app.use(logger.requestLogger());
```

Then at the VERY END of your file (after all routes):
```javascript
// === ADD THIS AT THE END ===
// Error handling middleware must be last
app.use(errorHandler);

app.listen(port, () => {
  logger.info('Server started', { port });
});
```

### Step 2: Convert High-Priority Routes (10 min)

**Start with these routes first**:

#### Photo Upload Route
**Current location**: Probably in `server/routes/uploadRoutes.js`

**Before**:
```javascript
router.post('/upload-photo', async (req, res) => {
  try {
    const file = req.file;
    if (!file) {
      return res.status(400).json({ error: 'No file provided' });
    }
    // ... upload logic ...
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Upload failed' });
  }
});
```

**After**:
```javascript
const { asyncHandler, AppError, ErrorCodes } = require('../utils/appError');

router.post('/upload-photo', asyncHandler(async (req, res) => {
  const file = req.file;
  if (!file) {
    throw new AppError(ErrorCodes.VALIDATION.MISSING_FIELD, 'Photo file is required', {
      field: 'file'
    });
  }
  // ... upload logic ...
  res.json({ success: true, data: photo });
}));
```

#### Case Worker Get Students Route
**Current location**: Probably in `server/routes/caseWorkerRoutes.js`

**Before**:
```javascript
router.get('/students', auth, async (req, res) => {
  try {
    if (req.user.role !== 'CASE_WORKER') {
      return res.status(403).json({ error: 'Forbidden' });
    }
    const students = await Student.find({ caseWorkerId: req.user.id });
    res.json(students);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch students' });
  }
});
```

**After**:
```javascript
const { asyncHandler, AppError, ErrorCodes } = require('../utils/appError');

router.get('/students', auth, asyncHandler(async (req, res) => {
  if (req.user.role !== 'CASE_WORKER') {
    throw new AppError(ErrorCodes.AUTH.FORBIDDEN, 'Case workers only');
  }
  
  const students = await Student.find({ caseWorkerId: req.user.id });
  if (!students || students.length === 0) {
    throw new AppError(ErrorCodes.RESOURCE.STUDENT_NOT_FOUND, 'No students found');
  }
  
  res.json({ success: true, data: students });
}));
```

### Step 3: Add Error Handling to Critical Functions (10 min)

**In database queries**:
```javascript
// Before
const student = await Student.findById(studentId);

// After
const student = await Student.findById(studentId);
if (!student) {
  throw new AppError(ErrorCodes.RESOURCE.STUDENT_NOT_FOUND, 
    `Student ${studentId} not found`);
}
```

**In file operations**:
```javascript
// Before
try {
  await uploadToServer(file);
} catch (err) {
  throw new Error('Upload failed: ' + err.message);
}

// After
try {
  await uploadToServer(file);
} catch (err) {
  throw new AppError(
    ErrorCodes.FILE.UPLOAD_FAILED,
    'Failed to save photo to server',
    { filename: file.originalname },
    err  // Pass original error for debugging
  );
}
```

### Step 4: Test the Integration (5 min)

**Test 1: Upload a photo**
```bash
# Should return structured error response with error code
# Check server console for formatted error log
```

**Test 2: Access without auth**
```bash
# Should return 401 with error code AUTH_005
curl https://aircrew.nl/api/case-worker/students
```

**Test 3: Check logs**
```bash
# On VPS, check if log files are being created
ls -la /path/to/logs/
```

**Test 4: Verify database persistence**
```bash
# Upload file, check database
psql -d donors_db -c "SELECT * FROM applications WHERE student_id = YOUR_ID LIMIT 1;"
```

---

## 🎯 Phase 2: Full Conversion (Optional but Recommended)

After testing with 2-3 routes, convert these:

1. **Authentication routes** (`server/routes/authRoutes.js`)
   - Login
   - Logout
   - Register

2. **User management** (`server/routes/userRoutes.js`)
   - Get users
   - Update user
   - Delete user

3. **Application routes** (`server/routes/applicationRoutes.js`)
   - Create application
   - Update status
   - Get applications

4. **Review routes** (`server/routes/reviewRoutes.js`)
   - Create review
   - Update review
   - Get reviews

---

## ✅ Verification Checklist

After integration, verify:

- [ ] Server starts without errors
- [ ] `npm run build` completes successfully
- [ ] App still works on localhost
- [ ] No console.log errors in DevTools
- [ ] Error responses include error code
- [ ] Logs show requestId for every request
- [ ] Database changes persist after page refresh
- [ ] Deployment to VPS succeeds
- [ ] VPS app still works at https://aircrew.nl

---

## 📊 Success Metrics

You'll know it's working when:

✅ Every error has a code (e.g., AUTH_001, FILE_008)
✅ Error responses are consistent across all endpoints
✅ Server logs include requestId, userId, route
✅ Debugging is easier (full context in logs)
✅ Code has less boilerplate (asyncHandler catches errors)
✅ Team knows exactly what each error means

---

## 🚨 Common Integration Issues

### Issue 1: "Cannot find module './utils/appError'"
**Fix**: Make sure files are in `server/utils/` folder
```bash
ls -la server/utils/
# Should show: appError.js, errorCodes.js, logger.js
```

### Issue 2: "asyncHandler is not a function"
**Fix**: Make sure you're importing it
```javascript
const { asyncHandler, AppError, ErrorCodes } = require('./utils/appError');
```

### Issue 3: "errorHandler is not defined"
**Fix**: Add it to Express app at the END of all middleware
```javascript
app.use(errorHandler);  // Must be after all routes
```

### Issue 4: Logs not being created
**Fix**: Check LOG_DIR environment variable
```bash
echo $LOG_DIR  # Should show /path/to/logs/
mkdir -p /path/to/logs/
chmod 755 /path/to/logs/
```

### Issue 5: Errors not being caught
**Fix**: Make sure routes use `asyncHandler`
```javascript
// Wrong - errors not caught
router.get('/api/test', async (req, res) => { ... });

// Right - errors caught
router.get('/api/test', asyncHandler(async (req, res) => { ... }));
```

---

## 📞 Support

**If stuck, check**:
1. `.copilot-instructions.md` - 16-point quality checklist
2. `ERROR_HANDLING_SETUP_COMPLETE.md` - Quick reference
3. Error codes in `server/utils/errorCodes.js`
4. Examples in this file

**Remember**: Better error handling = faster debugging = happier developers

---

**Status**: 🟢 READY TO INTEGRATE
**Time to integrate**: 30 minutes
**ROI**: Hours saved debugging

Let's make this the best-documented error-free app! 🚀

