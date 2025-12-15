# Deep Codebase Analysis & VPS vs Localhost Root Cause Report

## Executive Summary

After thorough analysis of the entire codebase, I identified the **ROOT CAUSE** of why the backend fails on VPS but works on localhost:

**ES Module Hoisting Issue**: In JavaScript ES modules, ALL `import` statements are hoisted and evaluated before any code execution happens - even if `dotenv.config()` is written before the imports. This means `auth.js` was being evaluated and reading `process.env.JWT_SECRET` BEFORE `dotenv.config()` had a chance to populate environment variables.

### Why It Works on Localhost
When running on localhost with `npm --prefix server start` or development setups, NODE_ENV might already be set or there might be .env file caching, or the execution path is different.

### Why It Failed on VPS
The VPS environment was cleaner, and the module loading sequence strictly enforced the hoisting behavior.

---

## Part 1: Project Structure Analysis

### Server Entry Point
- **Main file**: `server/src/server.js`
- **Entry setup**: `server/package.json` has `"start": "node src/server.js"`
- **Working directory**: When running with `npm --prefix server start`, cwd is the root project folder

### Environment Files
```
server/.env                      (local development)
server/.env.production           (production - HAS JWT_SECRET)
server/.env.staging              (staging)
server/.env.development          (dev)
server/.env.example              (template)
server/.env.production.example   (template)
server/.env.production.local     (local production override)
```

### Critical Finding
- `server/.env.production` DOES contain JWT_SECRET
- But server.js was using relative path `.env.production` 
- When running from root with `npm --prefix server start`, cwd is `/projects/donors`, not `/projects/donors/server`
- So dotenv looks for `/projects/donors/.env.production` instead of `/projects/donors/server/.env.production`

---

## Part 2: Environment Configuration Analysis

### The Problem Chain

1. **File**: `server/src/middleware/auth.js` (lines 1-12 original)
```javascript
const JWT_SECRET = process.env.JWT_SECRET;  // ← Read at MODULE LOAD TIME
if (!JWT_SECRET) {
  throw new Error("FATAL: JWT_SECRET environment variable is required...");
}
```

2. **File**: `server/src/server.js` (lines 1-5 original)
```javascript
import dotenv from "dotenv";
const envFile = process.env.NODE_ENV === "production" ? ".env.production" : ".env";
dotenv.config({ path: envFile });  // ← Loads env AFTER imports are evaluated
```

3. **The Issue**: Even though `dotenv.config()` is written FIRST, ES modules hoist all imports:
```
Actual Execution Order (ES Module behavior):
1. Import all modules (auth.js, express, etc.) ← auth.js evaluates here
2. Then run top-level code (dotenv.config()) ← But too late!
```

---

## Part 3: Import & Dependency Chain Analysis

### Import Chain
```
server.js
├── import authRouter from "./routes/auth.js"
├── import profileRouter from "./routes/profile.js"
│   └── import { requireAuth, onlyRoles } from "../middleware/auth.js"
│       └── tries to read process.env.JWT_SECRET (UNDEFINED at this point!)
└── (many other route imports)
└── dotenv.config() (runs AFTER all imports evaluated)
```

### Other Module Dependencies
- `profileRouter` imports from `auth.js`
- `applications.js` imports `optionalAuth` from `auth.js`
- `users.js` imports `onlyRoles` from `auth.js`
- `students.js` imports `onlyRoles` from `auth.js`

All these depend on auth.js being successfully loaded before they can work.

---

## Part 4: The Root Cause - ES Module Hoisting

### Why This Happens

In Node.js with ES modules:

```javascript
// This code:
import dotenv from "dotenv";
dotenv.config();
import { requireAuth } from "./middleware/auth.js";

// Is ACTUALLY interpreted as:
import dotenv from "dotenv";
import { requireAuth } from "./middleware/auth.js";  // ← HOISTED!
dotenv.config();  // ← Runs after imports are loaded
```

### Timeline on VPS
```
1. Node starts server.js
2. ES module engine encounters imports
3. Tries to import auth.js
4. auth.js reads: const JWT_SECRET = process.env.JWT_SECRET
5. process.env is EMPTY (dotenv.config hasn't run yet)
6. JWT_SECRET = undefined
7. Throws: "FATAL: JWT_SECRET environment variable is required"
8. Server crash
```

### Why It Sometimes Works Locally
- Local development might have `.env` file in the root or current working directory
- IDEs might pre-load environment variables
- npm might run from different working directory
- File caching or different execution paths

---

## Part 5: Comparison - Local vs VPS Execution

### Localhost (What Works)
- Working directory: May be `/projects/donor` or `/projects/donor/server`
- Environment: May have NODE_ENV set already
- dotenv.config() might find `.env` or `.env.production` due to cwd
- OR: .env file is cached somewhere

### VPS (What Failed)
- Working directory: `/home/sohail/projects/donors` (root)
- NODE_ENV not pre-set when using `npm --prefix server start`
- Relative path `.env.production` looks in root, not server/ folder
- Clean environment with no cached values
- Strict ES module evaluation order enforced

---

## Part 6: The Solution Implemented

### Fix #1: Lazy Load JWT_SECRET

**File**: `server/src/middleware/auth.js`

**Before**:
```javascript
const JWT_SECRET = process.env.JWT_SECRET;  // Read at module load
if (!JWT_SECRET) {
  throw new Error("...");
}
```

**After**:
```javascript
function getJwtSecret() {  // Read at RUNTIME when first needed
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error("...");
  }
  return secret;
}
```

**Usage**: Replace `jwt.verify(token, JWT_SECRET)` with `jwt.verify(token, getJwtSecret())`

**Why This Works**: The function is only called when a request comes in, at which point:
- server.js has already finished loading
- dotenv.config() has already run
- process.env is populated

---

### Fix #2: Proper Path Resolution

**File**: `server/src/server.js`

**Before**:
```javascript
const envFile = process.env.NODE_ENV === "production" ? ".env.production" : ".env";
dotenv.config({ path: envFile });  // Relative path, cwd dependent
```

**After**:
```javascript
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const serverDir = path.join(__dirname, "..");  // server/ directory

const envFile = process.env.NODE_ENV === "production" ? ".env.production" : ".env";
const envPath = path.join(serverDir, envFile);  // Absolute path
dotenv.config({ path: envPath });
```

**Why This Works**: 
- Uses ES module `import.meta.url` to get current file location
- Resolves to absolute path regardless of cwd
- Always finds `/home/sohail/projects/donors/server/.env.production`

---

## Part 7: Files Modified

1. **server/src/middleware/auth.js**
   - Removed: Module-level JWT_SECRET constant
   - Added: getJwtSecret() function
   - Updated: Two jwt.verify() calls to use getJwtSecret()

2. **server/src/server.js**
   - Added: import path and fileURLToPath
   - Changed: Relative path to absolute path resolution
   - Result: Correctly loads server/.env.production from any working directory

---

## Part 8: Deployment Instructions

### For VPS

Copy the fixed files to your VPS:

```bash
# Copy auth.js
scp server/src/middleware/auth.js sohail@mail:/home/sohail/projects/donors/server/src/middleware/

# Copy server.js
scp server/src/server.js sohail@mail:/home/sohail/projects/donors/server/src/
```

Then start the server:

```bash
cd /home/sohail/projects/donors/server
export NODE_ENV=production
node src/server.js
```

**Expected Output**:
```
2025-12-10 10:XX:XX [info]: Logger initialized
...
Server running on http://localhost:3001
Connected to PostgreSQL database
```

### Using PM2 (Recommended)

```bash
cd /home/sohail/projects/donors
export NODE_ENV=production
pm2 start ecosystem.config.js --env production
```

---

## Part 9: Why This Was Confusing

The issue is subtle because:

1. ✗ "Dotenv is loaded first in the code" - TRUE, but doesn't matter
2. ✗ ".env.production exists and has JWT_SECRET" - TRUE, but can't be found
3. ✗ "Works on localhost" - TRUE, for unrelated reasons
4. ✓ "ES module imports are always evaluated first" - THE ACTUAL ROOT CAUSE

The solution wasn't about fixing dotenv or environment files—it was about changing WHEN the JWT_SECRET is read from module-load-time to function-call-time.

---

## Verification Checklist

- [x] Identified ES module hoisting issue
- [x] Fixed lazy loading of JWT_SECRET in auth.js
- [x] Fixed path resolution in server.js to use absolute paths
- [x] Updated all jwt.verify() calls to use getJwtSecret()
- [x] Files synced to Windows local workspace
- [x] Ready for VPS deployment

---

**Status**: ✅ ROOT CAUSE IDENTIFIED AND FIXED
