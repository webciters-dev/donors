# MIGRATION EXECUTION SUMMARY - Ready to Deploy

## ✅ WHAT'S BEEN PREPARED (Steps 1-3 COMPLETE)

### Local Backups Created:
1. **Database Backup** (2.02 MB)
   - File: `donors_db_complete_2025-12-04-190704.sql`
   - Location: `C:\projects\donor\database_migration\`
   - Contains: 25 tables, all schema, data, sequences, constraints

2. **Files Archive** (31.05 MB)
   - File: `uploads_backup.tar.gz`
   - Location: `C:\projects\donor\server\`
   - Contains: 108 files (photos, videos, documents)
     - 74 photos (2.63 MB)
     - 5 videos (27.75 MB)
     - 29 documents (1.96 MB)

3. **Documentation**
   - `MIGRATION_INSTRUCTIONS.md` - Complete step-by-step guide
   - `file_inventory.csv` - Detailed file listing
   - `transfer_to_vps.ps1` - Automated transfer script

### Total Backup Size: 33.07 MB (easily transferable)

---

## 🚀 READY FOR STEP 4: TRANSFER TO VPS

### Option A: Use Automated PowerShell Script (RECOMMENDED)

```powershell
# From C:\projects\donor\
cd C:\projects\donor\database_migration

# Run the automated transfer script
.\transfer_to_vps.ps1 -VpsUser sohail -VpsIp 136.144.175.93 -VpsPath "/home/sohail/projects/donors"
```

**What it does:**
- ✓ Validates all backup files exist
- ✓ Tests SSH connection to VPS
- ✓ Transfers database backup via SCP
- ✓ Transfers files archive via SCP
- ✓ Verifies files arrived on VPS
- ✓ Provides next steps

---

### Option B: Manual SCP Commands

```powershell
# Define variables
$dbBackup = "C:\projects\donor\database_migration\donors_db_complete_2025-12-04-190704.sql"
$filesArchive = "C:\projects\donor\server\uploads_backup.tar.gz"
$vpsTarget = "sohail@136.144.175.93"
$vpsPath = "/home/sohail/projects/donors"

# Transfer database backup
scp $dbBackup ${vpsTarget}:${vpsPath}/

# Transfer files archive
scp $filesArchive ${vpsTarget}:${vpsPath}/

# Verify transfer
ssh ${vpsTarget} "ls -lh ${vpsPath}/*.{sql,gz}"
```

---

## 📋 STEPS 5-9: ON THE VPS (After Transfer Complete)

Once transfer is complete, execute these on the VPS via SSH:

### STEP 5: Restore Database

```bash
# SSH to VPS
ssh sohail@136.144.175.93

# Navigate and prepare
cd /home/sohail/projects/donors
mkdir -p database_backup
mv donors_db_complete_*.sql database_backup/

# Set password for psql
export PGPASSWORD="RoG*741#PoS"

# Stop current backend
pm2 kill

# Restore database (WARNING: This overwrites current donors_db)
psql -U postgres -d donors_db < database_backup/donors_db_complete_*.sql

# Verify restoration
psql -U postgres -d donors_db << EOF
SELECT COUNT(*) as users_count FROM users;
SELECT COUNT(*) as applications_count FROM applications;
SELECT COUNT(*) as students_count FROM students;
EOF
```

### STEP 6: Extract & Verify Files

```bash
# From /home/sohail/projects/donors/

# Backup old uploads first
mv uploads uploads_old_backup_$(date +%s)

# Extract archive
tar -xzf uploads_backup.tar.gz

# Verify
ls -lah uploads/
find uploads -type f | wc -l    # Should show: 108
du -sh uploads/                 # Should show: ~32 MB

# Fix permissions
sudo chown -R sohail:sohail uploads/
chmod -R 755 uploads/

# Clean up
rm uploads_backup.tar.gz
```

### STEP 7: Verify Configuration

```bash
cd /home/sohail/projects/donors/server

# Check .env.production
cat .env.production | grep -E "UPLOAD_DIR|DATABASE_URL|EMAIL"

# Should show:
# UPLOAD_DIR=/home/sohail/projects/donors/server/uploads
# DATABASE_URL=postgresql://postgres:...@localhost:5432/donors_db
```

### STEP 8: Restart Backend

```bash
cd /home/sohail/projects/donors

# Kill old processes
pm2 kill

# Start fresh
pm2 start ecosystem.config.json
pm2 save
pm2 status

# Wait and test
sleep 3
curl http://localhost:3001/api/health

# Check logs
pm2 logs awake-backend --lines 100
```

### STEP 9: Test Everything

```bash
# Test database queries
curl -X GET http://localhost:3001/api/students -H "Authorization: Bearer YOUR_TOKEN"

# Test file serving
curl http://localhost:3001/uploads/photos/[filename]

# Check PM2 logs for errors
pm2 logs awake-backend
```

---

## 🎯 EXECUTION CHECKLIST

### Local (Windows):
- [x] Database backup created (2.02 MB)
- [x] Files archive created (31.05 MB)
- [x] Inventory CSV created
- [ ] **RUN: Transfer script or manual SCP commands**

### VPS (After Transfer):
- [ ] Create database_backup directory
- [ ] Restore database with psql
- [ ] Extract files tar.gz
- [ ] Set file permissions (chown/chmod)
- [ ] Update .env if needed
- [ ] Restart PM2
- [ ] Test health endpoint
- [ ] Verify file serving
- [ ] Test database queries

---

## ⚡ QUICK START (Copy-Paste Ready)

### Transfer (Windows PowerShell):
```powershell
cd C:\projects\donor\database_migration
.\transfer_to_vps.ps1
```

### Restore (VPS - After transfer completes):
```bash
ssh sohail@136.144.175.93

# Run all at once:
cd /home/sohail/projects/donors && \
mkdir -p database_backup && \
mv donors_db_complete_*.sql database_backup/ && \
export PGPASSWORD="RoG*741#PoS" && \
pm2 kill && \
psql -U postgres -d donors_db < database_backup/donors_db_complete_*.sql && \
echo "✓ Database restored" && \
tar -xzf uploads_backup.tar.gz && \
sudo chown -R sohail:sohail uploads/ && \
chmod -R 755 uploads/ && \
rm uploads_backup.tar.gz && \
echo "✓ Files extracted" && \
pm2 start ecosystem.config.json && \
sleep 3 && \
curl http://localhost:3001/api/health && \
pm2 logs awake-backend --lines 50
```

---

## 🔍 WHAT GETS MIGRATED

### Database (donors_db):
- ✓ All 25 tables
- ✓ All user accounts and authentication data
- ✓ All student applications and documents
- ✓ All donor information and sponsorships
- ✓ All interviews and decisions
- ✓ Complete data relationships and constraints

### File System (/uploads/):
- ✓ All student profile photos
- ✓ All student introduction videos
- ✓ All application documents
- ✓ All video thumbnails

### Configuration:
- ✓ .env.production already has correct paths
- ✓ ecosystem.config.json already configured
- ✓ All backend code already on VPS

---

## ❌ ROLLBACK (If needed)

```bash
# Stop backend
pm2 kill

# Restore from old backup
psql -U postgres -d donors_db < database_backup/donors_db_old_backup.sql

# Restore old files
rm -rf uploads
mv uploads_old_backup_* uploads

# Restart
pm2 start ecosystem.config.json
```

---

## 📞 SUPPORT / TROUBLESHOOTING

### SSH Connection Issues:
- Verify SSH key is configured
- Check VPS is reachable: `ping 136.144.175.93`
- Check firewall allows port 22

### Database Restore Issues:
- Check disk space: `df -h`
- Check postgres running: `systemctl status postgresql`
- Check logs: `psql -U postgres -l`

### File Permission Issues:
- Verify ownership: `ls -la /home/sohail/projects/donors/uploads/`
- Fix: `sudo chown -R sohail:sohail uploads/`

### Backend Not Starting:
- Check logs: `pm2 logs awake-backend`
- Verify database connection: `psql -U postgres -d donors_db -c "SELECT 1"`
- Check port: `ss -tuln | grep 3001`

---

## 📊 MIGRATION STATUS

**Overall Progress: 40% Complete (Steps 1-3 done, ready for Step 4)**

```
✅ Step 1: Create database backup
✅ Step 2: Catalog uploaded files  
✅ Step 3: Create tar.gz archive
🟡 Step 4: Transfer to VPS (NEXT - You run the script/commands above)
⏳ Step 5: Restore database
⏳ Step 6: Extract files on VPS
⏳ Step 7: Verify configuration
⏳ Step 8: Restart backend
⏳ Step 9: End-to-end testing
```

---

## 🎬 NEXT ACTION

**RUN THIS NOW** (In Windows PowerShell):

```powershell
cd C:\projects\donor\database_migration
.\transfer_to_vps.ps1
```

This will:
1. Test SSH connection
2. Transfer database (2.02 MB)
3. Transfer files (31.05 MB)
4. Verify on VPS
5. Show you next VPS commands to run

Total transfer time: ~1-2 minutes depending on connection

**After transfer completes**, copy the VPS restoration commands and execute them on your VPS.

