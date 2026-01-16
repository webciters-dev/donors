# 🚀 Production Deployment Instructions - aircrew.nl

**Created:** January 15, 2026  
**Target:** aircrew.nl VPS  
**Estimated Time:** 5-10 minutes

---

## 📋 Overview

This guide explains how to deploy the latest AWAKE Connect code to production at **aircrew.nl**.

### What Gets Deployed (14 commits since last production release):

| Change | Description |
|--------|-------------|
| Photo Fix | Photos persist after logout/login |
| Video Warning | Better toast timing |
| Case Worker Fix | View Details page no longer blank |
| Email Fix | Confirmation email only on actual submission |
| Date Formats | Correct display, no NaN/undefined |
| Other Resources | New field in financial section |
| Hybrid Notifications | Improved notification system |
| Dual Currency | PKR/USD support |
| Guardian 2 Removed | Simplified form |

---

## 🔄 Deployment Workflow

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│   LOCAL MACHINE │────▶│     GITHUB      │────▶│   VPS SERVER    │
│   (Your PC)     │push │   (Repository)  │pull │  (aircrew.nl)   │
└─────────────────┘     └─────────────────┘     └─────────────────┘
                                                        │
                                                        ▼
                                               ┌─────────────────┐
                                               │   PRODUCTION    │
                                               │  (Live Site)    │
                                               └─────────────────┘
```

**Your code is ALREADY on GitHub** (origin/main is up to date). You just need to pull it to the VPS.

---

## 📝 Step-by-Step Instructions

### Step 1: Push Deployment Script to GitHub (One-time)

On your **local Windows machine**:

```powershell
cd c:\projects\donor
git add deploy-to-production.sh
git commit -m "Add automated production deployment script"
git push origin main
```

### Step 2: SSH into the VPS

Open PowerShell or terminal and connect to your VPS:

```bash
ssh root@aircrew.nl
```

Or if you use a different user:
```bash
ssh your-username@aircrew.nl
```

### Step 3: Navigate to Project & Pull Script

Once connected to VPS:

```bash
cd ~/projects/donors
git pull origin main
```

### Step 4: Run the Deployment Script

Make the script executable and run it:

```bash
chmod +x deploy-to-production.sh
./deploy-to-production.sh
```

The script will automatically:
1. ✅ Create a backup tag
2. ✅ Pull latest code from GitHub
3. ✅ Install frontend dependencies (npm ci)
4. ✅ Install backend dependencies (npm ci)
5. ✅ Run database migrations (Prisma)
6. ✅ Build production frontend (Vite)
7. ✅ Restart PM2 processes
8. ✅ Run verification tests
9. ✅ Display rollback instructions

### Step 5: Verify Deployment

After the script completes, test in your browser:

1. **Clear browser cache**: `Ctrl+Shift+R` (Windows) or `Cmd+Shift+R` (Mac)
2. Visit: https://aircrew.nl
3. Check login works
4. Test a student profile photo upload
5. Check Case Worker → View Details page

---

## ⚡ Quick Reference Commands (On VPS)

### If You Prefer Manual Deployment:

```bash
# SSH into VPS
ssh root@aircrew.nl

# Navigate to project
cd ~/projects/donors

# Create backup tag
git tag v1.0.1-backup-$(date +%Y%m%d)

# Pull latest code
git pull origin main

# Install dependencies
npm ci
cd server && npm ci

# Run database migrations
npx prisma migrate deploy
npx prisma generate
cd ..

# Build frontend
rm -rf dist/
npm run build

# Restart services
pm2 restart all
pm2 status
```

---

## 🔄 Rollback Instructions

If something goes wrong after deployment:

```bash
# On VPS - Rollback to previous version
git checkout v1.0.0-production

# Reinstall and rebuild
cd server && npm ci && npx prisma generate && cd ..
npm ci && npm run build

# Restart
pm2 restart all
```

Or if you created a backup tag during deployment:
```bash
git checkout v1.0.1-backup-YYYYMMDD-HHMMSS
```

---

## 📊 Expected Output

When the deployment script runs successfully, you'll see:

```
╔════════════════════════════════════════════════════════════════╗
║ AWAKE Connect - Production Deployment                         ║
╚════════════════════════════════════════════════════════════════╝
Timestamp: 20260115-143022
Target: aircrew.nl

✓ Working directory: /root/projects/donors
✓ Created backup tag: v1.0.1-backup-20260115-143022

╔════════════════════════════════════════════════════════════════╗
║ Phase 2: Pulling Latest Code from GitHub                       ║
╚════════════════════════════════════════════════════════════════╝
✓ Updated to commit: 947989b

... (phases 3-6)

╔════════════════════════════════════════════════════════════════╗
║  ✓ AWAKE Connect successfully deployed to aircrew.nl          ║
╚════════════════════════════════════════════════════════════════╝
```

---

## 🔍 Troubleshooting

| Issue | Solution |
|-------|----------|
| **SSH connection refused** | Check VPS is running, verify IP/hostname |
| **Permission denied** | Use `sudo` or check file permissions |
| **npm ci fails** | Delete `node_modules` and try again |
| **Prisma migration fails** | Check DATABASE_URL in `.env` |
| **Build fails** | Check for TypeScript/ESLint errors |
| **PM2 not starting** | Run `pm2 logs awake-backend` to see errors |
| **Site not updating** | Clear browser cache with `Ctrl+Shift+R` |

---

## 📁 Files Involved

| File | Location | Purpose |
|------|----------|---------|
| `deploy-to-production.sh` | `/root/projects/donors/` | Automated deployment |
| `ecosystem.config.js` | `/root/projects/donors/` | PM2 configuration |
| `.env` | `/root/projects/donors/server/` | Backend environment |
| `dist/` | `/root/projects/donors/` | Built frontend |

---

## ✅ Post-Deployment Checklist

- [ ] Homepage loads at https://aircrew.nl
- [ ] Login works for all user types
- [ ] Student photo uploads persist after logout
- [ ] Case Worker "View Details" page loads
- [ ] Application form Step 3 shows "Other Resources" field
- [ ] Dates display correctly (no NaN/undefined)
- [ ] Email notifications work (test with password reset)

---

## 💡 Tips

1. **Always create a backup tag** before deploying
2. **Clear browser cache** after deployment to see changes
3. **Check PM2 logs** if something isn't working: `pm2 logs awake-backend`
4. **Test on mobile** as well as desktop
5. **Keep the v1.0.0-production tag** as ultimate fallback

---

## 📞 Quick Commands Reference

```bash
# View PM2 status
pm2 status

# View live logs
pm2 logs awake-backend

# Restart services
pm2 restart all

# Check API health
curl http://localhost:3001/api/health

# Check current git commit
git log --oneline -1

# List all backup tags
git tag | grep backup
```
