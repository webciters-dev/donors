# VPS Backend Deployment - ES Module Fix

## The Problem (In Simple Terms)

Your backend failed on the VPS because of how JavaScript ES modules work:

1. You write: `dotenv.config()` then `import authRouter`
2. JavaScript actually does: `import authRouter` THEN `dotenv.config()`
3. Result: auth.js runs BEFORE environment variables are loaded
4. Crash: "JWT_SECRET not found"

## The Solution

We moved from **compile-time** JWT_SECRET reading to **runtime** JWT_SECRET reading:

**Before (BROKEN)**:
```javascript
// auth.js - Runs when file is imported, before env vars loaded
const JWT_SECRET = process.env.JWT_SECRET;  // ❌ undefined at import time
if (!JWT_SECRET) throw new Error("...");
```

**After (FIXED)**:
```javascript
// auth.js - Function called when request arrives, after env vars loaded
function getJwtSecret() {  // ✅ called when needed, env vars ready
  const secret = process.env.JWT_SECRET;
  if (!secret) throw new Error("...");
  return secret;
}
```

## Files Changed

### 1. server/src/middleware/auth.js
- ✅ Removed: module-level `const JWT_SECRET = ...`
- ✅ Added: `getJwtSecret()` function
- ✅ Updated: 2 `jwt.verify()` calls to use `getJwtSecret()`

### 2. server/src/server.js
- ✅ Added: `import path from "path"` and `import { fileURLToPath }`
- ✅ Changed: `.env.production` (relative) → absolute path
- ✅ Now correctly finds: `/home/sohail/projects/donors/server/.env.production`

## Deploy to VPS - 3 Steps

### Step 1: Copy the fixed files from Windows to VPS

```bash
# On Windows (in VS Code terminal or Git Bash):
scp server/src/middleware/auth.js sohail@mail:/home/sohail/projects/donors/server/src/middleware/
scp server/src/server.js sohail@mail:/home/sohail/projects/donors/server/src/
```

Or use the automated script:

```bash
bash deploy-vps-fixes.sh
```

### Step 2: Start the server

```bash
ssh sohail@mail

cd /home/sohail/projects/donors/server
export NODE_ENV=production
node src/server.js
```

### Step 3: Verify it works

You should see:
```
2025-12-10 10:XX:XX [info]: Logger initialized
...
Server running on http://localhost:3001
```

## Using PM2 (Better for Production)

```bash
cd /home/sohail/projects/donors
export NODE_ENV=production
pm2 start ecosystem.config.js --env production

# Check status
pm2 status

# View logs
pm2 logs awake-backend --lines 50
```

## Why This Really Works

1. **auth.js**: No longer crashes on import
2. **server.js**: Correctly loads `.env.production` from the right location
3. **Runtime**: When a request comes in, `getJwtSecret()` is called with env vars already loaded

## Rollback (If Needed)

```bash
cd /home/sohail/projects/donors/server
cp src/middleware/auth.js.backup src/middleware/auth.js
cp src/server.js.backup src/server.js
```

## Technical Details

For those interested in the deep analysis, see: `DEEP_CODEBASE_ANALYSIS_ROOT_CAUSE.md`

---

**Status**: ✅ Ready to deploy
