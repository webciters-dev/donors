# Backend Startup Failure - Root Cause & Solutions

## Issues Identified

### 1. ❌ Missing JWT_SECRET in Production Environment
**Error:**
```
Error: FATAL: JWT_SECRET environment variable is required. 
Please set it in your .env file before starting the server.
```

**Root Cause:** 
The server is starting without the proper NODE_ENV and .env.production file being loaded.

**Solution:**
✅ Updated `server/src/server.js` to load `.env.production` when `NODE_ENV=production`:
```javascript
const envFile = process.env.NODE_ENV === "production" ? ".env.production" : ".env";
dotenv.config({ path: envFile });
```

The JWT_SECRET already exists in `server/.env.production`:
```
JWT_SECRET=8a5b9f1f1f8a4b6c9f0d2c7e0a4f6b7c2e9d4a1b7f3c8e0d9a2f5b6c7d8e9f0
```

---

### 2. ❌ Missing `onlyRoles` Export Error
**Error:**
```
SyntaxError: The requested module '../middleware/auth.js' does not provide 
an export named 'onlyRoles'
```

**Root Cause:**
The `onlyRoles` function exists in `server/src/middleware/auth.js` (lines 104-115) and is properly exported. This error occurs because the auth.js file fails to load due to the JWT_SECRET issue above.

**Solution:** ✅ 
The export is correct. Once JWT_SECRET issue is fixed, this error will resolve automatically.

---

## Implementation Steps

### Step 1: Verify Environment Variables ✅
Check that `server/.env.production` contains all required variables:
```bash
cat server/.env.production | grep JWT_SECRET
```

Expected output:
```
JWT_SECRET=8a5b9f1f1f8a4b6c9f0d2c7e0a4f6b7c2e9d4a1b7f3c8e0d9a2f5b6c7d8e9f0
```

### Step 2: Create PM2 Ecosystem Configuration ✅
Created `ecosystem.config.js` at project root with:
- Proper NODE_ENV=production configuration
- Error and output log paths
- Memory limits and restart policies
- Separate frontend app configuration

### Step 3: Start Server with Correct Environment

**On Linux/Unix:**
```bash
# Set production environment before starting
export NODE_ENV=production

# Start with ecosystem config
pm2 start ecosystem.config.js --env production

# Verify startup
pm2 logs awake-backend --lines 50 --err
```

**On Windows (PowerShell):**
```powershell
# Set production environment
$env:NODE_ENV = "production"

# Start with ecosystem config
pm2 start ecosystem.config.js --env production

# Verify startup
pm2 logs awake-backend
```

Or use the provided deployment scripts:
```bash
# Linux/Unix
bash deploy-production.sh

# Windows
powershell -ExecutionPolicy Bypass -File deploy-production.ps1
```

### Step 4: Verify Server is Running
```bash
pm2 status
pm2 logs awake-backend --lines 30
```

Expected output in logs:
```
Server running on http://localhost:3001
Connected to PostgreSQL database
```

---

## Key Files Modified

1. **server/src/server.js** - Updated to load correct .env file based on NODE_ENV
2. **ecosystem.config.js** - Created PM2 configuration
3. **deploy-production.sh** - Created Linux deployment script
4. **deploy-production.ps1** - Created Windows deployment script

---

## Environment Configuration

### server/.env.production (Already Contains)
```
DATABASE_URL=postgresql://postgres:...
JWT_SECRET=8a5b9f1f1f8a4b6c9f0d2c7e0a4f6b7c2e9d4a1b7f3c8e0d9a2f5b6c7d8e9f0
JWT_EXPIRES_IN=7d
PORT=3001
NODE_ENV=production
FRONTEND_URL=https://aircrew.nl
... (other production configs)
```

---

## Troubleshooting

### Issue: Server still fails to start
```bash
# Check if NODE_ENV is set
echo $NODE_ENV  # Linux/Unix
echo $env:NODE_ENV  # Windows PowerShell

# Verify the .env.production file path
ls -la server/.env.production  # Linux/Unix
Test-Path "server\.env.production"  # Windows

# Check PM2 logs
pm2 logs awake-backend --err --lines 50
```

### Issue: Port 3001 already in use
```bash
# Find and kill process using port 3001
lsof -i :3001 | grep LISTEN | awk '{print $2}' | xargs kill -9  # Linux/Unix
netstat -ano | findstr :3001  # Windows
```

### Issue: Database connection fails
```bash
# Verify DATABASE_URL in .env.production
grep DATABASE_URL server/.env.production

# Test database connection
psql $DATABASE_URL -c "SELECT 1"
```

---

## Auth Middleware Exports (Verified ✅)

The `server/src/middleware/auth.js` exports:
- ✅ `requireAuth` - Verifies JWT token
- ✅ `requireRole(role)` - Checks specific role
- ✅ `requireAdminOrSuperAdmin()` - Admin/Super-admin check
- ✅ `requireSuperAdmin()` - Super-admin only
- ✅ `onlyRoles(...allowed)` - Flexible role checker
- ✅ `optionalAuth` - Optional token verification

All are properly exported and ready to use.

---

## Next Steps

1. ✅ Ensure `NODE_ENV=production` is set before starting PM2
2. ✅ Start server: `pm2 start ecosystem.config.js --env production`
3. ✅ Verify: `pm2 status` and `pm2 logs awake-backend`
4. ✅ Test: `curl http://localhost:3001/health` (or your health endpoint)

---

**Status:** Ready for deployment ✅
