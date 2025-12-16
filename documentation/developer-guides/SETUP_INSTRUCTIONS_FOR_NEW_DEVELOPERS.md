# AWAKE Connect - Complete Setup Guide for New Developers

## Overview
This guide walks you through cloning the AWAKE Connect project and setting up a complete local PostgreSQL database with all current data and schema.

---

## PART 1: Clone the Repository

### Step 1: Clone the Project
```bash
git clone https://github.com/webciters-dev/donors.git
cd donors
```

### Step 2: Verify You're on Main Branch
```bash
git branch
git checkout main
git pull origin main
```

---

## PART 2: Environment Setup

### Step 1: Install Node.js Dependencies

**Frontend:**
```bash
npm install
```

**Backend:**
```bash
cd server
npm install
cd ..
```

### Step 2: Create Environment Variables

**Create `.env` file in project root:**
```env
# Frontend
VITE_API_BASE_URL=http://localhost:3001/api
VITE_RECAPTCHA_SITE_KEY=your_recaptcha_key_here

# Backend
DATABASE_URL="postgresql://USER:PASSWORD@localhost:5432/donors_dev"
JWT_SECRET=your_jwt_secret_change_this_in_production
JWT_EXPIRES_IN=7d
NODE_ENV=development

# Email Configuration
EMAIL_HOST=mail.aircrew.nl
EMAIL_PORT=587
EMAIL_USER=your_email@example.com
EMAIL_PASS=your_email_password
EMAIL_FROM=AWAKE Connect <noreply@awakeconnect.org>
EMAIL_SECURE=false

# Frontend URL (for CORS)
FRONTEND_URL=http://localhost:8080
FRONTEND_URLS=http://localhost:5173,http://localhost:8080,http://localhost:8081

# Stripe (for payment processing)
STRIPE_PUBLIC_KEY=your_stripe_public_key
STRIPE_SECRET_KEY=your_stripe_secret_key

# Google reCAPTCHA
RECAPTCHA_SECRET_KEY=your_recaptcha_secret_key

# Optional: Monitoring and Features
ENABLE_MONITORING=false
ENABLE_STRUCTURED_LOGGING=false
ENABLE_API_DOCS=false
ENABLE_IP_WHITELIST=false
ENABLE_RATE_LIMITING=true
```

---

## PART 3: PostgreSQL Database Setup

### Prerequisites
- PostgreSQL 12+ installed locally
- pgAdmin or psql command-line tool available

### Step 1: Create Database

**Using psql command line:**
```bash
# Connect to PostgreSQL as admin (Windows)
psql -U postgres

# Then execute:
CREATE DATABASE donors_dev OWNER postgres;
CREATE DATABASE donors_production OWNER postgres;
\q
```

**Or using pgAdmin:**
1. Right-click on "Databases" → New → Database
2. Name: `donors_dev`, Owner: `postgres`
3. Click Save
4. Repeat for `donors_production`

### Step 2: Import Database Schema and Data

The project includes complete database scripts in `database/` directory:

**Option A: Automatic Import Script (Recommended for Windows)**

```bash
cd database
# For development database:
./import_database.bat

# For production database (if needed):
# Modify import_database.bat to point to donors_production before running
```

**Option B: Manual Import via psql**

```bash
cd database

# Import the complete database schema and data
# Choose one of these files depending on your needs:

# 1. Complete database with all data (recommended for local dev):
psql -U postgres -d donors_dev -f complete_local_database_export.sql

# OR

# 2. Latest database backup:
psql -U postgres -d donors_dev -f donors_db_export.sql

# OR

# 3. Data only (no schema):
psql -U postgres -d donors_dev -f donors_data_only.sql
```

**Option C: Using Prisma Migrations (Creates fresh schema)**

If you prefer a fresh database without importing existing data:

```bash
cd server

# Create database schema from Prisma schema
npx prisma migrate deploy

# (Optional) Seed with test data
npx prisma db seed
```

### Step 3: Verify Database Import

**Check if data was imported successfully:**

```bash
psql -U postgres -d donors_dev

# Run these queries to verify:
SELECT COUNT(*) FROM students;
SELECT COUNT(*) FROM users;
SELECT COUNT(*) FROM applications;
SELECT COUNT(*) FROM "field_reviews";
SELECT COUNT(*) FROM donors;
SELECT COUNT(*) FROM sponsorships;

\q
```

Expected output if data was imported:
```
 count
-------
   XX   (number of records in each table)
```

---

## PART 4: Prisma Setup

### Step 1: Generate Prisma Client

```bash
cd server
npx prisma generate
```

### Step 2: Verify Database Connection

```bash
# Test the connection
npx prisma db execute --stdin < /dev/null

# Or check schema:
npx prisma introspect
```

### Step 3: Update Prisma Client (if needed)

```bash
npx prisma generate
npx prisma format
```

---

## PART 5: Run the Application

### Terminal 1: Start Backend Server

```bash
cd server
npm start
# Or for development with auto-reload:
npm run dev
```

Expected output:
```
Server running on port 3001
Connected to database: donors_dev
```

### Terminal 2: Start Frontend Development Server

```bash
# From project root
npm run dev
```

Expected output:
```
VITE v5.4.19  ready in XX ms

➜  Local:   http://localhost:5173/
➜  press h + enter to show help
```

---

## PART 6: Database Management

### Backup Current Database

```bash
cd database

# Automatic backup script (Windows):
./export_database.bat

# Or manual backup:
pg_dump -U postgres -d donors_dev > donors_dev_backup_$(date +%Y%m%d_%H%M%S).sql
```

### Reset Database to Clean State

```bash
cd server

# WARNING: This deletes all data!
# Option 1: Drop and recreate
npx prisma migrate reset --force

# Option 2: Clear specific tables
npx prisma db execute --stdin < ../database/reset_database.ps1
```

### View Current Schema

```bash
cd server

# See Prisma schema:
cat prisma/schema.prisma

# See in database:
npx prisma studio  # Opens web UI to browse data
```

---

## PART 7: Database Import - Detailed Steps for Each File

### File 1: `complete_local_database_export.sql` (RECOMMENDED)
**Best for:** Full local development with all current data

```bash
psql -U postgres -d donors_dev < complete_local_database_export.sql
```

Contains:
- ✅ All database schema (tables, indexes, constraints)
- ✅ All current data (students, applications, case workers, donors, etc.)
- ✅ All relationships and foreign keys
- ✅ Sample test data for all user types

### File 2: `donors_db_export.sql`
**Best for:** Production-like database setup

```bash
psql -U postgres -d donors_production < donors_db_export.sql
```

Contains:
- All current live data
- Latest schema version
- Production-ready structure

### File 3: `donors_data_only.sql`
**Best for:** Applying only data to existing schema

```bash
# First create schema with Prisma:
npx prisma migrate deploy

# Then import data:
psql -U postgres -d donors_dev < donors_data_only.sql
```

### File 4: `donors_local_export.sql`
**Best for:** Local development snapshot

```bash
psql -U postgres -d donors_dev < donors_local_export.sql
```

---

## PART 8: Test the Setup

### Test 1: Login to Application

1. Open http://localhost:5173
2. Go to "Sign In" page
3. Use a test account (check database for test users)

**Sample Test Accounts:**

Query the database to find test accounts:
```bash
psql -U postgres -d donors_dev

SELECT email, role FROM users LIMIT 10;
```

### Test 2: Test Backend API

```bash
# Health check
curl http://localhost:3001/api/health

# Should return:
# {"ok":true}
```

### Test 3: Check Database Connection from Node

```bash
cd server

# Create test file:
cat > test-connection.js << 'EOF'
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const users = await prisma.user.findMany({ take: 5 });
  console.log('✅ Connected to database!');
  console.log(`Total users: ${await prisma.user.count()}`);
  console.log('Sample users:', users);
}

main().catch(console.error).finally(() => prisma.$disconnect());
EOF

node test-connection.js
```

---

## PART 9: Troubleshooting

### Issue: "Connection refused" to PostgreSQL

**Solution:**
```bash
# Check if PostgreSQL is running (Windows):
Get-Process postgres

# If not, start it:
pg_ctl -D "C:\Program Files\PostgreSQL\14\data" start

# Or restart the service:
Restart-Service -Name postgresql-x64-14
```

### Issue: "Database does not exist"

**Solution:**
```bash
# Create it manually:
psql -U postgres -c "CREATE DATABASE donors_dev;"
```

### Issue: "Permission denied" for postgres user

**Solution:**
```bash
# Connect as the owner:
psql -U postgres -d postgres

# Then create database as postgres user:
CREATE DATABASE donors_dev OWNER postgres;
```

### Issue: "Invalid JWT_SECRET"

**Solution:**
```bash
# Generate a strong secret:
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# Add to .env:
JWT_SECRET=<generated_secret>
```

### Issue: Frontend won't connect to backend

**Solution:**
```bash
# Check if backend is running on port 3001:
netstat -ano | findstr :3001

# Check CORS in .env:
FRONTEND_URL=http://localhost:5173

# Restart backend after changing .env
```

---

## PART 10: Development Workflow

### Daily Development

```bash
# Terminal 1 - Backend
cd server && npm run dev

# Terminal 2 - Frontend
npm run dev

# Terminal 3 - Prisma Studio (optional, to view database)
cd server && npx prisma studio
```

### Making Database Changes

```bash
# 1. Modify prisma/schema.prisma
# 2. Create migration:
npx prisma migrate dev --name your_change_name

# 3. Prisma client updates automatically
# 4. Commit the migration:
git add server/prisma/migrations/
git commit -m "Add migration: your_change_name"
```

### Committing Changes

```bash
# Check status:
git status

# Add changes:
git add .

# Commit:
git commit -m "Description of changes"

# Push to main:
git push origin main
```

---

## PART 11: Quick Reference - All Important Paths

```
Project Root: c:\projects\donor\
├── server/
│   ├── prisma/
│   │   ├── schema.prisma          ← Database schema
│   │   └── migrations/             ← All database migrations
│   ├── src/
│   │   ├── routes/                 ← API endpoints (29 files)
│   │   ├── lib/                    ← Business logic & services
│   │   ├── middleware/             ← Auth, validation, logging
│   │   └── server.js               ← Main server file
│   └── package.json
├── src/
│   ├── pages/                      ← React pages (43 files)
│   ├── components/                 ← React components
│   ├── lib/                        ← Frontend utilities
│   └── App.jsx                     ← Main app component
├── database/
│   ├── complete_local_database_export.sql    ← Complete dump (USE THIS)
│   ├── donors_db_export.sql                  ← Production dump
│   ├── donors_data_only.sql                  ← Data only
│   ├── import_database.bat                   ← Import script (Windows)
│   ├── import_database.sh                    ← Import script (Mac/Linux)
│   └── reset_database.ps1                    ← Reset script
├── .env                            ← Environment variables
├── package.json                    ← Frontend dependencies
└── vite.config.js                  ← Frontend build config
```

---

## PART 12: Production vs Development Database

### Development (donors_dev)
- URL: `postgresql://postgres:PASSWORD@localhost:5432/donors_dev`
- Use: Local development and testing
- Can reset/delete data freely

### Production (donors_production)
- URL: `postgresql://USER:PASSWORD@PROD_HOST:5432/donors_production`
- Use: Live application
- **NEVER reset or delete data**
- Backup before any changes

---

## FINAL CHECKLIST

Before you start coding, verify:

- [ ] Repository cloned
- [ ] On `main` branch
- [ ] `.env` file created with valid credentials
- [ ] PostgreSQL running and accessible
- [ ] `donors_dev` database created
- [ ] Database imported successfully
- [ ] `npm install` completed (both root and server/)
- [ ] `npx prisma generate` completed
- [ ] Backend starts with `npm run dev` (port 3001)
- [ ] Frontend starts with `npm run dev` (port 5173)
- [ ] Can login to http://localhost:5173
- [ ] API health check works: `curl http://localhost:3001/api/health`

---

## GETTING HELP

If you encounter issues:

1. **Check database connection:**
   ```bash
   cd server && npx prisma db execute --stdin < /dev/null
   ```

2. **Review logs:**
   - Backend logs in terminal 1
   - Frontend logs in terminal 2 and browser console

3. **Check environment variables:**
   ```bash
   # Verify .env is in project root:
   cat .env | grep DATABASE_URL
   ```

4. **Database schema inspection:**
   ```bash
   cd server && npx prisma studio
   ```

---

**You're all set! Happy coding! 🚀**
