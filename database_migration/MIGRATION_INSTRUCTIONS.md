# Database & File Migration to VPS - Step by Step

## MIGRATION SUMMARY

- **Database Backup**: `donors_db_complete_2025-12-04-190704.sql` (2.02 MB)
- **Files Archive**: `uploads_backup.tar.gz` (31.05 MB)
- **Total Backup**: 33.07 MB
- **Files Included**: 
  - Database: 25 tables with all schema, data, sequences, constraints
  - Uploads: 108 files (74 photos, 5 videos, 29 documents)

---

## STEP 4: TRANSFER TO VPS

### From Windows Machine (C:\projects\donor\):

```powershell
# Set up paths
$dbBackup = "C:\projects\donor\database_migration\donors_db_complete_2025-12-04-190704.sql"
$filesArchive = "C:\projects\donor\server\uploads_backup.tar.gz"
$vpsUser = "sohail"
$vpsIp = "136.144.175.93"
$vpsPath = "/home/sohail/projects/donors"

# Transfer database backup
scp $dbBackup ${vpsUser}@${vpsIp}:${vpsPath}/

# Transfer files archive
scp $filesArchive ${vpsUser}@${vpsIp}:${vpsPath}/

# Verify transfer
ssh ${vpsUser}@${vpsIp} "ls -lh ${vpsPath}/*.{sql,gz} 2>/dev/null"
```

---

## STEP 5: RESTORE DATABASE ON VPS

### Execute on VPS via SSH:

```bash
# Connect to VPS
ssh sohail@136.144.175.93

# Navigate to project directory
cd /home/sohail/projects/donors

# Create backup directory
mkdir -p database_backup

# Move SQL file to backup directory
mv donors_db_complete_*.sql database_backup/

# List what we have
ls -lh database_backup/
```

### Restore the database:

```bash
# Set password for psql
export PGPASSWORD="RoG*741#PoS"

# Stop backend services first
pm2 kill

# Restore database (this will overwrite current donors_db)
psql -U postgres -d donors_db < database_backup/donors_db_complete_*.sql

# Verify restoration - check row counts
psql -U postgres -d donors_db << EOF
SELECT COUNT(*) as users_count FROM users;
SELECT COUNT(*) as applications_count FROM applications;
SELECT COUNT(*) as students_count FROM students;
SELECT COUNT(*) as donors_count FROM donors;
SELECT COUNT(*) as documents_count FROM documents;
SELECT COUNT(*) as interviews_count FROM interviews;
SELECT COUNT(*) as sponsorships_count FROM sponsorships;
EOF
```

---

## STEP 6: EXTRACT & VERIFY UPLOADED FILES ON VPS

### On VPS:

```bash
# Navigate to project
cd /home/sohail/projects/donors

# Back up existing uploads (just in case)
mv uploads uploads_old_backup_$(date +%s)

# Extract archive
tar -xzf uploads_backup.tar.gz

# Verify extraction
ls -lah uploads/

# Check file counts
find uploads -type f | wc -l

# Check total size
du -sh uploads/

# Set correct permissions
sudo chown -R sohail:sohail uploads/
chmod -R 755 uploads/

# Clean up archive
rm uploads_backup.tar.gz
```

**Expected Results:**
- Total files: 108
- Total size: ~32 MB
- Directories: photos, videos, thumbnails

---

## STEP 7: VERIFY .ENV CONFIGURATION ON VPS

### Check and update if needed:

```bash
cd /home/sohail/projects/donors/server

# Check current config
cat .env.production | grep -E "UPLOAD_DIR|DATABASE|EMAIL"

# If UPLOAD_DIR needs updating:
sed -i 's|/old/path|/home/sohail/projects/donors/server/uploads|g' .env.production

# Verify it's correct
cat .env.production | grep UPLOAD_DIR
```

---

## STEP 8: RESTART PM2 & TEST BACKEND

### On VPS:

```bash
cd /home/sohail/projects/donors

# Start PM2
pm2 start ecosystem.config.json
pm2 save

# Check status
pm2 status

# Test health endpoint (wait 2 seconds first)
sleep 2
curl http://localhost:3001/api/health

# Check logs for errors
pm2 logs awake-backend --lines 50
```

**Expected Output:**
- PM2 status: Both instances should show "online"
- Health endpoint: `{"ok":true}`
- No error messages in logs

---

## STEP 9: END-TO-END TESTING

### Test on production website:

1. **Test Database**
   - Try logging in as a user
   - Should pull data from migrated database
   
2. **Test File Serving**
   - Download a document from application
   - Play a student video
   - Verify file access works
   
3. **Test New Uploads**
   - Upload a new document as student
   - Upload new photo
   - Verify files save to correct location

4. **Test Email**
   - Trigger a notification
   - Check email was sent to support@aircrew.nl

5. **Monitor Backend**
   - Watch logs: `pm2 logs awake-backend --lines 200`
   - Look for any database connection errors
   - Verify no file serving errors

---

## ROLLBACK PROCEDURE (If something goes wrong)

```bash
# Stop current instance
pm2 kill

# Restore old database (if backup exists)
psql -U postgres -d donors_db < database_backup/donors_db_old_backup.sql

# Restore old files
rm -rf uploads
mv uploads_old_backup_* uploads

# Restart
pm2 start ecosystem.config.json
```

---

## FILES INCLUDED IN BACKUP

### Database Tables (25 total):
- users, students, donors, board_members
- applications, documents, interviews
- sponsorships, disbursements
- conversation_messages, conversations
- field_reviews, interview_decisions
- interview_panel_members, password_resets
- progress_report_attachments, progress_reports
- university_degree_levels, university_fields
- university_programs, universities
- fx_rates, Message, _prisma_migrations
- student_progress

### Uploaded Files (108 total):
- **Photos**: 74 files (2.63 MB) - Student/donor profile pictures
- **Videos**: 5 files (27.75 MB) - Student introduction videos
- **Documents**: 29 files (~1.96 MB) - Application documents
- **Thumbnails**: 0 files

---

## MIGRATION CHECKLIST

- [ ] Database backup created (2.02 MB)
- [ ] Files archive created (31.05 MB)
- [ ] Files transferred to VPS
- [ ] Database restored on VPS
- [ ] File permissions verified
- [ ] PM2 restarted
- [ ] Health endpoint returns {"ok":true}
- [ ] Test login works with migrated data
- [ ] Test file download works
- [ ] Test new file upload works
- [ ] Email notifications working

---

## SUPPORT

If you encounter any issues:

1. Check PM2 logs: `pm2 logs awake-backend`
2. Check database connection: `psql -U postgres -d donors_db -c "SELECT 1"`
3. Check file permissions: `ls -la /home/sohail/projects/donors/uploads/`
4. Check disk space: `df -h`

