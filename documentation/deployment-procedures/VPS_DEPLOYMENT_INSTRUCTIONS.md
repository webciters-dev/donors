# VPS Deployment Instructions - AWAKE Connect

## Current Status ✅

Your source files on VPS are **perfectly synchronized** with GitHub:
- ✅ ApplicationForm.jsx (MD5: 1c0fbe10...) 
- ✅ StudentProfile.jsx (MD5: 44d07592...)
- ✅ StudentDashboard.jsx (MD5: a7d77bd7...)

Both required toast messages are compiled in dist/:
- ✅ "Step 3 Complete!" from ApplicationForm.jsx
- ✅ "Application submitted successfully!" from StudentDashboard.jsx

## Issue: Browser Cache

The VPS has correct code, but **your browser is caching old dist files**. The solution is simple.

## Step 1: Deploy New Code on VPS (Run These Commands)

```bash
# SSH into VPS first
ssh your-user@aircrew.nl
cd ~/projects/donors

# Clean build and restart
rm -rf dist/ node_modules/.vite node_modules/.esbuild
npm ci
npm run build
pm2 restart all
```

**Expected output:**
- npm ci: installed 444 packages
- npm run build: 1870 modules transformed, built in ~27 seconds
- pm2 restart: both processes online

## Step 2: Clear Browser Cache (CRITICAL!)

In your browser on your local machine:

**Chrome/Firefox/Edge (Windows):**
1. Press `Ctrl + Shift + Delete` to open Clear Browsing Data
2. Select "All time" 
3. Check: Cookies, Cache, Cached images
4. Click "Clear data"
5. Close all tabs for aircrew.nl
6. Visit `http://aircrew.nl` fresh

**Safari (Mac):**
1. Develop menu → Empty Web Storage
2. Develop menu → Clear All Storage
3. Close browser tabs
4. Reopen aircrew.nl

**Hard Refresh (Quick Alternative):**
- Windows: `Ctrl + Shift + R` while on the page
- Mac: `Cmd + Shift + R`

## Step 3: Test Application Form

1. Go to `http://aircrew.nl/apply?step=1`
2. Complete steps through to Step 3
3. After Step 3 submission, you should see: **"Step 3 Complete! Continue to Step 4"** toast ✅
4. You'll then see the application status page
5. If you navigate to dashboard, you'll see: **"Application submitted successfully!"** ✅

## Step 4: Verify StudentProfile Display

1. Go to `http://aircrew.nl/student/profile`
2. Scroll to "Future Education" section
3. Should show **READ-ONLY blue box** (not editable dropdowns)
4. If still showing dropdowns, your browser cache has stale code

**If still seeing dropdowns after cache clear:**
```bash
# On VPS, check if dist has old code
grep -n "ReadOnly\|<select" dist/assets/index-*.js | head -3
```

## Step 5: Verify One More Time (On VPS)

After clearing browser cache and hard refresh, verify source files match compiled code:

```bash
cd ~/projects/donors

# Check source code has correct content
echo "=== Source File Verification ==="
grep -n "Step 3 Complete" src/pages/ApplicationForm.jsx
grep -n "Application submitted successfully" src/pages/StudentDashboard.jsx
grep -n "ReadOnly\|value={" src/pages/StudentProfile.jsx | grep -A2 "Future Education" | head -3

# Check compiled code
echo "=== Compiled Code Verification ==="
DIST_JS=$(find dist/assets -name "index-*.js" | head -1)
echo "Checking: $DIST_JS"
grep -c "Step 3 Complete" "$DIST_JS"
grep -c "Application submitted successfully" "$DIST_JS"
```

## Troubleshooting

### Still seeing old messages after cache clear?

1. **Check if dist files were actually rebuilt:**
   ```bash
   ls -lht dist/assets/ | head -3
   ```
   Should show recent timestamps (within last few minutes)

2. **Check if PM2 is serving latest:**
   ```bash
   pm2 log awake-backend | head -20
   ```
   Look for startup messages with latest dist paths

3. **Nuke everything and rebuild:**
   ```bash
   cd ~/projects/donors
   rm -rf dist node_modules
   npm ci
   npm run build
   pm2 kill
   pm2 start ecosystem.config.json
   ```

### Browser still showing old UI?

This indicates the browser is loading a cached version of the entire page or assets. Try:

1. Open DevTools (F12)
2. Go to Network tab
3. Hard refresh (Ctrl+Shift+R)
4. Look for requests to `index-*.js` 
5. Should show new filename hash (not old one)

If it's loading old filename, browser cache is stubborn:
- Try private/incognito window
- Try different browser
- Wait 5 minutes and try again

## One-Command Deployment (For Future)

Save this command for future deployments - it does everything at once:

```bash
cd ~/projects/donors && git pull origin main && rm -rf dist node_modules/.vite node_modules/.esbuild && npm ci && npm run build && pm2 restart all && echo "✓ Deployment Complete - Clear browser cache and hard refresh!"
```

## For Your Development Workflow

Every time you:
1. Commit and push code from local
2. SSH to VPS and run the one-command above
3. Hard refresh browser with Ctrl+Shift+R

This ensures:
- ✅ Latest code pulled from GitHub
- ✅ Caches cleaned
- ✅ Fresh build
- ✅ PM2 restarted
- ✅ Ready for testing

---

**Remember:** The code IS correct on VPS. The browser is just being lazy with caching. Force it to reload! 🚀
