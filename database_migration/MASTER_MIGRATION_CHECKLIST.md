# MASTER MIGRATION CHECKLIST

## ✅ COMPLETED (Steps 1-3)

### Step 1: Database Backup
- [x] PostgreSQL database dumped with pg_dump
- [x] Backup file: `donors_db_complete_2025-12-04-190704.sql`
- [x] Size: 2.02 MB
- [x] Tables: 25 (all schema, data, sequences included)
- [x] Verified: Contains all CREATE TABLE statements

### Step 2: Files Cataloged
- [x] Uploaded files analyzed
- [x] Total files: 108
- [x] Total size: 32.34 MB uncompressed
- [x] Breakdown:
  - [x] Photos: 74 files (2.63 MB)
  - [x] Videos: 5 files (27.75 MB)
  - [x] Documents: 29 files (1.96 MB)
- [x] Inventory CSV created: `file_inventory.csv`

### Step 3: Archive Created
- [x] tar.gz archive created
- [x] Archive name: `uploads_backup.tar.gz`
- [x] Archive size: 31.05 MB (4% compression)
- [x] Located: `C:\projects\donor\server\uploads_backup.tar.gz`
- [x] Verified: Can be extracted successfully

---

## 🔄 IN PROGRESS (Step 4 - Ready to Execute)

### Step 4: Transfer to VPS
- [ ] Run transfer script: `.\transfer_to_vps.ps1`
- [ ] Test SSH connection to VPS
- [ ] Transfer database backup via SCP (2.02 MB)
- [ ] Transfer files archive via SCP (31.05 MB)
- [ ] Verify files arrived on VPS

**Status:** Ready to execute  
**Time Estimate:** 1-2 minutes  
**Command:**
```powershell
cd C:\projects\donor\database_migration
.\transfer_to_vps.ps1
```

---

## ⏳ PENDING (Steps 5-9 - Execute After Transfer Complete)

### Step 5: Restore Database on VPS
- [ ] SSH to VPS
- [ ] Create database_backup directory
- [ ] Move SQL file to backup directory
- [ ] Export PGPASSWORD environment variable
- [ ] Kill PM2 processes
- [ ] Restore database: `psql -U postgres -d donors_db < database_backup/donors_db_complete_*.sql`
- [ ] Verify restoration with SELECT COUNT queries

**Status:** Ready (awaiting transfer completion)  
**Time Estimate:** 30 seconds  
**Depends on:** Step 4 completing successfully

---

### Step 6: Extract & Verify Files on VPS
- [ ] Back up old uploads directory
- [ ] Extract tar.gz archive
- [ ] Verify file count: 108 files
- [ ] Verify total size: ~32 MB
- [ ] Set ownership: `sudo chown -R sohail:sohail uploads/`
- [ ] Set permissions: `chmod -R 755 uploads/`
- [ ] Clean up archive

**Status:** Ready (awaiting transfer completion)  
**Time Estimate:** 15 seconds  
**Depends on:** Step 4 completing successfully

---

### Step 7: Verify Configuration on VPS
- [ ] Check .env.production paths
- [ ] Verify UPLOAD_DIR points to correct location
- [ ] Verify DATABASE_URL is correct
- [ ] Check EMAIL configuration
- [ ] Update paths if needed with sed

**Status:** Ready (no dependencies)  
**Time Estimate:** 5 seconds

---

### Step 8: Restart Backend on VPS
- [ ] Kill PM2 processes: `pm2 kill`
- [ ] Start fresh PM2 instance: `pm2 start ecosystem.config.json`
- [ ] Wait 3 seconds
- [ ] Check PM2 status: `pm2 status`
- [ ] Test health endpoint: `curl http://localhost:3001/api/health`
- [ ] Review PM2 logs for errors

**Status:** Ready (awaiting all previous steps)  
**Time Estimate:** 10 seconds  
**Expected Result:** Both instances online, health endpoint returns `{"ok":true}`

---

### Step 9: End-to-End Testing
- [ ] Test student login with migrated credentials
- [ ] Test document download from application
- [ ] Test video playback
- [ ] Test new file upload
- [ ] Test email notification
- [ ] Verify database queries work
- [ ] Monitor logs for errors

**Status:** Ready (awaiting backend restart)  
**Time Estimate:** 5 minutes  
**Depends on:** All previous steps completing

---

## 📋 BACKUP FILES SUMMARY

### Database Backup
- **File:** `donors_db_complete_2025-12-04-190704.sql`
- **Location:** `C:\projects\donor\database_migration\`
- **Size:** 2.02 MB
- **Created:** 2025-12-04 19:07:05
- **Contains:** PostgreSQL SQL dump with 25 tables
- **Retention:** Keep until VPS verification complete (at least 1 week)

### Files Archive
- **File:** `uploads_backup.tar.gz`
- **Location:** `C:\projects\donor\server\`
- **Size:** 31.05 MB
- **Created:** 2025-12-04 19:08:37
- **Contains:** 108 files (photos, videos, documents)
- **Retention:** Keep until VPS verification complete (at least 1 week)

### Documentation
- **QUICK_REFERENCE.txt** - Quick start guide
- **EXECUTION_SUMMARY.md** - Comprehensive guide
- **MIGRATION_INSTRUCTIONS.md** - Detailed steps
- **file_inventory.csv** - File listing with details
- **transfer_to_vps.ps1** - Automated transfer script
- **MASTER_MIGRATION_CHECKLIST.md** - This file

---

## 🚀 QUICK START

**From Windows PowerShell:**

```powershell
# Navigate to migration directory
cd C:\projects\donor\database_migration

# Run automated transfer script
.\transfer_to_vps.ps1

# Wait for completion (~1-2 minutes)
# Then copy VPS commands from output
```

**Then on VPS (after transfer complete):**

```bash
# Restore database (Step 5)
cd /home/sohail/projects/donors
mkdir -p database_backup
mv donors_db_complete_*.sql database_backup/
export PGPASSWORD="RoG*741#PoS"
pm2 kill
psql -U postgres -d donors_db < database_backup/donors_db_complete_*.sql

# Extract files (Step 6)
tar -xzf uploads_backup.tar.gz
sudo chown -R sohail:sohail uploads/
chmod -R 755 uploads/
rm uploads_backup.tar.gz

# Restart backend (Step 8)
pm2 start ecosystem.config.json
sleep 3
curl http://localhost:3001/api/health

# Verify (Step 9)
pm2 logs awake-backend --lines 50
```

---

## 🎯 SUCCESS CRITERIA

### After Step 4 (Transfer):
- [ ] Transfer script completes without errors
- [ ] Both files appear in VPS directory
- [ ] Verification shows files on VPS

### After Step 5 (Database Restore):
- [ ] Database restore completes without errors
- [ ] SELECT COUNT queries return expected results
- [ ] No connection errors in logs

### After Step 6 (Files Extract):
- [ ] 108 files extracted successfully
- [ ] File permissions set correctly (755)
- [ ] Ownership set to sohail:sohail

### After Step 8 (Backend Restart):
- [ ] PM2 status shows both instances "online"
- [ ] Health endpoint returns `{"ok":true}`
- [ ] PM2 logs show no errors

### After Step 9 (Testing):
- [ ] Login works with migrated accounts
- [ ] Documents download successfully
- [ ] Videos play without errors
- [ ] New uploads save to correct location
- [ ] Email notifications send successfully

---

## ⚠️ IMPORTANT NOTES

1. **Backup Safety:** Keep local backups for at least 1 week after migration
2. **Database Restore:** Will overwrite current production database - ensure this is intended
3. **File Extraction:** Old uploads will be backed up as `uploads_old_backup_*`
4. **PM2 Kill:** Required to clear Node.js module cache from old code
5. **Permissions:** Must run `sudo chown` for file ownership
6. **Testing:** Thoroughly test after migration before declaring success

---

## 🔄 ROLLBACK PROCEDURE

If migration fails or issues arise:

```bash
# Connect to VPS
ssh sohail@136.144.175.93

# Stop backend
pm2 kill

# Restore from old backup (if exists)
psql -U postgres -d donors_db < database_backup/donors_db_old_backup.sql

# Restore old files
rm -rf uploads
mv uploads_old_backup_* uploads

# Restart
pm2 start ecosystem.config.json
```

---

## 📞 TROUBLESHOOTING

### If Step 4 (Transfer) Fails:
```powershell
# Test SSH connection
ssh sohail@136.144.175.93 "echo 'test'"

# Test connectivity
ping 136.144.175.93

# Check SSH key
ssh-keygen -l -f ~/.ssh/id_rsa
```

### If Step 5 (Database) Fails:
```bash
# Check disk space
df -h

# Check PostgreSQL status
systemctl status postgresql

# Check database exists
psql -U postgres -l | grep donors_db
```

### If Step 8 (Backend) Fails:
```bash
# Check PM2 logs
pm2 logs awake-backend

# Check database connection
psql -U postgres -d donors_db -c "SELECT 1"

# Check port
ss -tuln | grep 3001
```

---

## 📊 MIGRATION TIMELINE

| Step | Action | Duration | Status |
|------|--------|----------|--------|
| 1 | Database backup | 5 min | ✅ Done |
| 2 | Catalog files | 2 min | ✅ Done |
| 3 | Create archive | 3 min | ✅ Done |
| 4 | Transfer to VPS | 2 min | 🟡 Ready |
| 5 | Restore database | 30 sec | ⏳ Pending |
| 6 | Extract files | 15 sec | ⏳ Pending |
| 7 | Verify config | 5 sec | ⏳ Pending |
| 8 | Restart backend | 10 sec | ⏳ Pending |
| 9 | Test system | 5 min | ⏳ Pending |
| **Total** | **Complete** | **18 min** | **In Progress** |

---

## 🎬 NEXT ACTION

**Run this command NOW from Windows:**

```powershell
cd C:\projects\donor\database_migration
.\transfer_to_vps.ps1
```

This starts Step 4 (Transfer) and will guide you through the remaining steps.

---

**Created:** 2025-12-04 19:10:00  
**Status:** Steps 1-3 Complete, Ready for Step 4  
**Version:** 1.0 - Initial Migration Plan

