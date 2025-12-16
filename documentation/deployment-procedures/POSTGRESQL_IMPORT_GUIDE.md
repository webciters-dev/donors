# PostgreSQL Database Import & Management Guide

## Quick Start (TL;DR)

For the fastest setup with all current data:

```bash
# 1. Create database
psql -U postgres -c "CREATE DATABASE donors_dev;"

# 2. Import complete database
cd database
psql -U postgres -d donors_dev -f complete_local_database_export.sql

# 3. Verify import
psql -U postgres -d donors_dev -c "SELECT COUNT(*) as table_count FROM information_schema.tables WHERE table_schema='public';"
```

---

## Option 1: Windows Batch Script (Easiest)

### Automatic Setup

**Using the provided batch script:**

```bash
cd database
./import_database.bat
```

This script will:
1. ✅ Check if PostgreSQL is running
2. ✅ Create the `donors_dev` database
3. ✅ Import the complete database schema and data
4. ✅ Verify the import
5. ✅ Report success or errors

### Manual Setup (If script fails)

**File: `import_database.bat`**

```batch
@echo off
setlocal enabledelayedexpansion

echo Importing database...
echo.

REM Configuration
set DB_NAME=donors_dev
set DB_USER=postgres
set SQL_FILE=complete_local_database_export.sql

REM Check if psql is in PATH
where psql >nul 2>nul
if %errorlevel% neq 0 (
    echo Error: psql not found. Make sure PostgreSQL is in your PATH.
    pause
    exit /b 1
)

REM Create database if it doesn't exist
echo Creating database...
psql -U %DB_USER% -tc "SELECT 1 FROM pg_database WHERE datname='%DB_NAME%'" | findstr /r . >nul
if errorlevel 1 (
    echo Database doesn't exist. Creating...
    psql -U %DB_USER% -c "CREATE DATABASE %DB_NAME%;"
) else (
    echo Database already exists.
)

REM Import the SQL file
echo.
echo Importing data...
psql -U %DB_USER% -d %DB_NAME% -f "%SQL_FILE%"

if %errorlevel% equ 0 (
    echo.
    echo Import successful!
) else (
    echo.
    echo Import failed with error code %errorlevel%
    pause
    exit /b %errorlevel%
)

REM Show statistics
echo.
echo Database statistics:
psql -U %DB_USER% -d %DB_NAME% -c "SELECT 'students' as table_name, COUNT(*) FROM students UNION ALL SELECT 'users', COUNT(*) FROM users UNION ALL SELECT 'applications', COUNT(*) FROM applications UNION ALL SELECT 'field_reviews', COUNT(*) FROM \"field_reviews\" UNION ALL SELECT 'donors', COUNT(*) FROM donors;"

pause
```

---

## Option 2: PowerShell Script (Windows)

**File: `import_database.ps1`**

```powershell
# Define variables
$dbName = "donors_dev"
$dbUser = "postgres"
$sqlFile = "complete_local_database_export.sql"

# Check if psql is available
try {
    psql --version | Out-Null
} catch {
    Write-Host "Error: psql not found. Make sure PostgreSQL is in your PATH." -ForegroundColor Red
    exit 1
}

# Create database if it doesn't exist
Write-Host "Checking if database exists..." -ForegroundColor Yellow
$dbExists = psql -U $dbUser -tc "SELECT 1 FROM pg_database WHERE datname='$dbName'" | Select-String -Pattern '\s+1'

if (-not $dbExists) {
    Write-Host "Creating database '$dbName'..." -ForegroundColor Green
    psql -U $dbUser -c "CREATE DATABASE $dbName;"
} else {
    Write-Host "Database already exists." -ForegroundColor Blue
}

# Import the SQL file
Write-Host "Importing data from $sqlFile..." -ForegroundColor Yellow
Write-Host "This may take a few minutes..." -ForegroundColor Yellow
psql -U $dbUser -d $dbName -f $sqlFile

if ($LASTEXITCODE -eq 0) {
    Write-Host "Import successful!" -ForegroundColor Green
    
    # Show statistics
    Write-Host "`nDatabase Statistics:" -ForegroundColor Cyan
    psql -U $dbUser -d $dbName -c @"
    SELECT 
        'students' as entity, COUNT(*) as count FROM students
    UNION ALL
    SELECT 'users', COUNT(*) FROM users
    UNION ALL
    SELECT 'applications', COUNT(*) FROM applications
    UNION ALL
    SELECT 'field_reviews', COUNT(*) FROM "field_reviews"
    UNION ALL
    SELECT 'donors', COUNT(*) FROM donors
    UNION ALL
    SELECT 'sponsorships', COUNT(*) FROM sponsorships
    ORDER BY entity;
"@
} else {
    Write-Host "Import failed with exit code $LASTEXITCODE" -ForegroundColor Red
    exit $LASTEXITCODE
}
```

**Run with:**
```powershell
cd database
.\import_database.ps1
```

---

## Option 3: Bash Script (macOS/Linux)

**File: `import_database.sh`**

```bash
#!/bin/bash

# Define variables
DB_NAME="donors_dev"
DB_USER="postgres"
SQL_FILE="complete_local_database_export.sql"

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Check if psql is available
if ! command -v psql &> /dev/null; then
    echo -e "${RED}Error: psql not found. Make sure PostgreSQL is installed.${NC}"
    exit 1
fi

# Check if SQL file exists
if [ ! -f "$SQL_FILE" ]; then
    echo -e "${RED}Error: $SQL_FILE not found in current directory.${NC}"
    exit 1
fi

# Create database if it doesn't exist
echo -e "${YELLOW}Checking if database exists...${NC}"
if psql -U $DB_USER -tc "SELECT 1 FROM pg_database WHERE datname='$DB_NAME'" | grep -q 1; then
    echo -e "${YELLOW}Database already exists.${NC}"
else
    echo -e "${GREEN}Creating database '$DB_NAME'...${NC}"
    createdb -U $DB_USER $DB_NAME
fi

# Import the SQL file
echo -e "${YELLOW}Importing data from $SQL_FILE...${NC}"
echo -e "${YELLOW}This may take a few minutes...${NC}"
psql -U $DB_USER -d $DB_NAME -f "$SQL_FILE"

if [ $? -eq 0 ]; then
    echo -e "${GREEN}Import successful!${NC}"
    
    # Show statistics
    echo -e "\n${GREEN}Database Statistics:${NC}"
    psql -U $DB_USER -d $DB_NAME << EOF
SELECT 
    'students' as entity, COUNT(*) as count FROM students
UNION ALL
SELECT 'users', COUNT(*) FROM users
UNION ALL
SELECT 'applications', COUNT(*) FROM applications
UNION ALL
SELECT 'field_reviews', COUNT(*) FROM "field_reviews"
UNION ALL
SELECT 'donors', COUNT(*) FROM donors
UNION ALL
SELECT 'sponsorships', COUNT(*) FROM sponsorships
ORDER BY entity;
EOF
else
    echo -e "${RED}Import failed!${NC}"
    exit 1
fi
```

**Run with:**
```bash
cd database
chmod +x import_database.sh
./import_database.sh
```

---

## Option 4: Manual psql Commands

If scripts don't work, use these direct commands:

### Step 1: Create Database
```bash
psql -U postgres -c "CREATE DATABASE donors_dev;"
```

### Step 2: Import Schema and Data
```bash
cd database
psql -U postgres -d donors_dev -f complete_local_database_export.sql
```

### Step 3: Verify Import
```bash
psql -U postgres -d donors_dev -c "
SELECT 
    schemaname,
    COUNT(*) as table_count
FROM pg_tables
WHERE schemaname = 'public'
GROUP BY schemaname;
"
```

Expected output:
```
 schemaname | table_count
------------+-------------
 public     |          23
```

---

## Database Files Explained

### 1. `complete_local_database_export.sql` ⭐ RECOMMENDED
**Size:** ~2-5 MB (compressed)
**Contains:** Full database dump with schema + all data
**Best for:** Local development, fastest setup
**Import time:** 30-60 seconds

```bash
psql -U postgres -d donors_dev -f complete_local_database_export.sql
```

### 2. `donors_db_export.sql`
**Size:** Similar to above
**Contains:** Production database snapshot
**Best for:** Understanding production data structure
**Import time:** 30-60 seconds

```bash
psql -U postgres -d donors_db -f donors_db_export.sql
```

### 3. `donors_data_only.sql`
**Size:** Smaller (~500 KB)
**Contains:** Data only, no schema
**Best for:** Populating existing schema with data
**Prerequisites:** Schema must exist first
**Import time:** 10-20 seconds

```bash
# First create schema:
npx prisma migrate deploy

# Then import data:
psql -U postgres -d donors_dev -f donors_data_only.sql
```

### 4. `donors_local_export.sql`
**Size:** Similar to complete export
**Contains:** Local development snapshot
**Best for:** Specific local state
**Import time:** 30-60 seconds

```bash
psql -U postgres -d donors_dev -f donors_local_export.sql
```

---

## Verify Import Success

### Check Table Counts
```bash
psql -U postgres -d donors_dev -c "
SELECT 'students' as table_name, COUNT(*) FROM students
UNION ALL SELECT 'users', COUNT(*) FROM users
UNION ALL SELECT 'applications', COUNT(*) FROM applications
UNION ALL SELECT 'field_reviews', COUNT(*) FROM \"field_reviews\"
UNION ALL SELECT 'donors', COUNT(*) FROM donors
UNION ALL SELECT 'sponsorships', COUNT(*) FROM sponsorships;
"
```

### Check Schema Structure
```bash
psql -U postgres -d donors_dev -c "
\dt public.*
"
```

### List All Tables
```bash
psql -U postgres -d donors_dev -c "
SELECT tablename FROM pg_tables WHERE schemaname = 'public' ORDER BY tablename;
"
```

### Check Foreign Keys
```bash
psql -U postgres -d donors_dev -c "
SELECT 
    constraint_name,
    table_name,
    column_name
FROM information_schema.key_column_usage
WHERE constraint_name LIKE 'fk_%'
ORDER BY table_name;
"
```

---

## Database Connection Issues

### PostgreSQL Not Running (Windows)

**Check status:**
```powershell
Get-Service postgresql-x64-14
```

**Start service:**
```powershell
Start-Service -Name postgresql-x64-14
```

**Or using command line:**
```bash
pg_ctl -D "C:\Program Files\PostgreSQL\14\data" start
```

### PostgreSQL Not in PATH

**Find PostgreSQL installation:**
```powershell
# Usually one of these:
C:\Program Files\PostgreSQL\14\bin
C:\Program Files\PostgreSQL\15\bin
```

**Add to PATH permanently (Windows):**
1. Right-click "This PC" → Properties
2. Advanced System Settings → Environment Variables
3. Edit `PATH`, add PostgreSQL bin folder
4. Restart terminal

**Temporary PATH addition (Bash):**
```bash
export PATH="/usr/local/bin/postgresql:$PATH"
psql --version
```

### Permission Denied

**Connect as postgres user:**
```bash
psql -U postgres -W
# Enter postgres user password
```

**If you forgot password:**
```bash
# Windows - edit postgresql.conf to use trust authentication temporarily
# Then restart PostgreSQL and reset password:
ALTER USER postgres PASSWORD 'newpassword';
```

---

## Backup Current Database

### Automatic Backup
```bash
cd database
./export_database.bat  # Windows
./export_database.sh   # Mac/Linux
```

### Manual Backup
```bash
# Full backup with all data and schema
pg_dump -U postgres -d donors_dev > donors_dev_backup_$(date +%Y%m%d_%H%M%S).sql

# Data only
pg_dump -U postgres -d donors_dev --data-only > donors_dev_data_backup.sql

# Schema only
pg_dump -U postgres -d donors_dev --schema-only > donors_dev_schema_backup.sql
```

### Backup to Compressed Format
```bash
# Smaller file size (highly compressed)
pg_dump -U postgres -d donors_dev -Fc > donors_dev_backup.dump

# Restore from compressed backup:
pg_restore -U postgres -d donors_dev donors_dev_backup.dump
```

---

## Reset Database to Clean State

### WARNING: This deletes all data!

**Option 1: Prisma Reset (recommended)**
```bash
cd server
npx prisma migrate reset --force
```

**Option 2: Drop and recreate**
```bash
# Drop database
psql -U postgres -c "DROP DATABASE donors_dev;"

# Create new database
psql -U postgres -c "CREATE DATABASE donors_dev;"

# Apply schema
cd server && npx prisma migrate deploy
```

**Option 3: Delete all data but keep schema**
```bash
psql -U postgres -d donors_dev << EOF
-- Delete all data while preserving schema
TRUNCATE TABLE 
    messages,
    sponsorships,
    disbursements,
    "field_reviews",
    applications,
    documents,
    students,
    "conversation_messages",
    conversations,
    users,
    donors
CASCADE;
EOF
```

---

## Performance Tips

### Create Indexes for Common Queries
```bash
psql -U postgres -d donors_dev << EOF
CREATE INDEX IF NOT EXISTS idx_applications_studentId ON applications(studentId);
CREATE INDEX IF NOT EXISTS idx_applications_status ON applications(status);
CREATE INDEX IF NOT EXISTS idx_field_reviews_officerUserId ON "field_reviews"("officerUserId");
CREATE INDEX IF NOT EXISTS idx_sponsorships_donorId ON sponsorships("donorId");
CREATE INDEX IF NOT EXISTS idx_sponsorships_studentId ON sponsorships("studentId");
EOF
```

### Analyze Query Performance
```bash
psql -U postgres -d donors_dev -c "
EXPLAIN ANALYZE
SELECT * FROM applications WHERE status = 'APPROVED' LIMIT 10;
"
```

---

## Common PostgreSQL Queries for Development

### View All Users
```bash
psql -U postgres -d donors_dev -c "
SELECT id, name, email, role, \"createdAt\" FROM users ORDER BY \"createdAt\" DESC LIMIT 20;
"
```

### View All Students
```bash
psql -U postgres -d donors_dev -c "
SELECT id, name, email, university, gpa, \"createdAt\" FROM students ORDER BY \"createdAt\" DESC LIMIT 20;
"
```

### View All Applications
```bash
psql -U postgres -d donors_dev -c "
SELECT 
    a.id, 
    s.name as student_name, 
    a.term, 
    a.status, 
    a.amount,
    a.currency,
    a.\"submittedAt\"
FROM applications a
JOIN students s ON a.\"studentId\" = s.id
ORDER BY a.\"submittedAt\" DESC LIMIT 20;
"
```

### Find Test Accounts
```bash
psql -U postgres -d donors_dev -c "
SELECT email, role, \"createdAt\" FROM users 
WHERE email LIKE '%test%' OR email LIKE '%demo%'
ORDER BY \"createdAt\" DESC;
"
```

---

## Final Checklist

Before starting development:

- [ ] PostgreSQL is installed and running
- [ ] `donors_dev` database created
- [ ] Database imported successfully
- [ ] Can connect with: `psql -U postgres -d donors_dev`
- [ ] Tables exist: `\dt` shows 20+ tables
- [ ] Data populated: Tables have non-zero row counts
- [ ] Prisma can connect: `npx prisma db execute --stdin < /dev/null`

---

**All set! Your database is ready for development! 🚀**
