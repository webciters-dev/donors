# For Jamshaid: Complete Project Onboarding

## Overview

The AWAKE Connect project has been fully pushed to GitHub with comprehensive setup documentation. You can now clone the project and get a fully functional local environment with all database data.

**Repository:** https://github.com/webciters-dev/donors.git

---

## What Happens When You Clone

1. ✅ You get the **complete codebase** (frontend + backend)
2. ✅ You get **all documentation** including setup guides
3. ✅ You get **database scripts** to populate PostgreSQL
4. ✅ You get **all current data** (students, applications, case workers, etc.)
5. ✅ You can start developing immediately

---

## Step-by-Step: Your First Setup

### Step 1: Clone the Repository (2 minutes)

```bash
git clone https://github.com/webciters-dev/donors.git
cd donors
git checkout main
git pull origin main
```

### Step 2: Create Environment File (1 minute)

Create a `.env` file in the project root:

```env
DATABASE_URL="postgresql://postgres:YOUR_DB_PASSWORD@localhost:5432/donors_dev"
JWT_SECRET=your_jwt_secret_here_make_it_long_and_random
FRONTEND_URL=http://localhost:8080
EMAIL_HOST=mail.aircrew.nl
EMAIL_PORT=587
EMAIL_USER=your_email@example.com
EMAIL_PASS=your_email_password
EMAIL_FROM=AWAKE Connect <noreply@awakeconnect.org>
STRIPE_PUBLIC_KEY=pk_test_xxx
STRIPE_SECRET_KEY=sk_test_xxx
RECAPTCHA_SECRET_KEY=your_recaptcha_key
ENABLE_RATE_LIMITING=true
```

### Step 3: Set Up PostgreSQL Database (5 minutes)

**Create the database:**
```bash
psql -U postgres -c "CREATE DATABASE donors_dev;"
```

**Import the complete database with all data:**

Choose ONE of these methods:

#### Option A: Windows Batch Script (Easiest)
```bash
cd database
./import_database.bat
```

#### Option B: PowerShell
```bash
cd database
.\import_database.ps1
```

#### Option C: Direct psql Command
```bash
cd database
psql -U postgres -d donors_dev -f complete_local_database_export.sql
```

#### Option D: macOS/Linux Bash
```bash
cd database
chmod +x import_database.sh
./import_database.sh
```

### Step 4: Install Dependencies (2 minutes)

```bash
# Install frontend dependencies
npm install

# Install backend dependencies
cd server
npm install
cd ..
```

### Step 5: Start Development (1 minute)

**Terminal 1 - Backend:**
```bash
cd server
npm run dev
```

Expected output: `Server running on port 3001`

**Terminal 2 - Frontend:**
```bash
npm run dev
```

Expected output: `Local: http://localhost:5173/`

### Step 6: Verify Everything Works (1 minute)

1. Open http://localhost:5173 in your browser
2. The application should load
3. Test the health check: `curl http://localhost:3001/api/health`

---

## Database Import Explained

### What Gets Imported?

When you import `complete_local_database_export.sql`, you get:

```
✅ Database schema (30+ tables)
✅ All relationships and constraints
✅ All current data:
   - Students (with profiles, documents)
   - Applications (with statuses and financial details)
   - Case workers (assigned to reviews)
   - Donors (with preferences)
   - Sponsorships (donor-student matches)
   - Messages (communication history)
   - All other data
✅ Indexes for performance
```

### How Large Is It?

- File size: ~2-5 MB (highly compressed)
- Uncompressed in database: ~100-200 MB
- Import time: 30-60 seconds
- Table count: 30+

---

## Verify Database Import Success

After importing, verify everything is set up correctly:

```bash
# Connect to database
psql -U postgres -d donors_dev

# Run these queries to check:
SELECT COUNT(*) FROM students;           -- Should show number > 0
SELECT COUNT(*) FROM users;              -- Should show number > 0
SELECT COUNT(*) FROM applications;       -- Should show number > 0
SELECT COUNT(*) FROM "field_reviews";    -- Should show number > 0
SELECT COUNT(*) FROM donors;             -- Should show number > 0

# Exit
\q
```

All counts should be greater than 0 if import was successful.

---

## Directory Structure

```
donors/                          ← Main project
├── src/                         ← React Frontend (43 pages)
│   ├── pages/                   (Student, Donor, Admin, Case Worker pages)
│   ├── components/              (Reusable React components)
│   └── lib/                     (Utilities: API, validation, formatting)
│
├── server/                      ← Express.js Backend
│   ├── src/
│   │   ├── routes/             (29 API endpoint modules)
│   │   ├── middleware/         (Auth, validation, logging)
│   │   ├── lib/                (Business logic: email, currency conversion, etc.)
│   │   └── server.js           (Main Express app)
│   ├── prisma/
│   │   ├── schema.prisma       (Database schema - defines all tables)
│   │   └── migrations/         (Database version control)
│   └── package.json
│
├── database/                    ← SQL Import Scripts
│   ├── complete_local_database_export.sql   ← Use this one
│   ├── donors_db_export.sql                 (Production dump)
│   ├── donors_data_only.sql                 (Data only)
│   ├── import_database.bat                  (Windows batch)
│   ├── import_database.sh                   (Bash script)
│   └── reset_database.ps1                   (PowerShell)
│
├── .env                         ← Your environment variables
├── package.json                 ← Frontend dependencies
├── QUICK_START_CARD.md         ← One-page reference
├── SETUP_INSTRUCTIONS_FOR_NEW_DEVELOPERS.md ← Full 12-part guide
└── POSTGRESQL_IMPORT_GUIDE.md  ← Database import details
```

---

## Essential Commands Reference

```bash
# Start development
cd server && npm run dev          # Terminal 1: Backend on port 3001
npm run dev                       # Terminal 2: Frontend on port 5173

# View database live
cd server && npx prisma studio   # Opens http://localhost:5555

# Create database migration
cd server && npx prisma migrate dev --name your_change_name

# See database schema
cat server/prisma/schema.prisma

# Check backend health
curl http://localhost:3001/api/health

# Git operations
git pull origin main              # Get latest changes
git add .                        # Stage your changes
git commit -m "Description"      # Commit
git push origin main             # Push to GitHub
```

---

## Key Things to Know

### Database Role
- **Internal role name:** `SUB_ADMIN`
- **Display name:** "Case Worker"
- Why? The system uses `SUB_ADMIN` for database compatibility but displays "Case Worker" in the UI

### Email System
- Uses professional SMTP: `mail.aircrew.nl`
- Emails sent asynchronously (don't block requests)
- Rate limited: 5 emails per minute
- Never fail the request if email fails

### Authentication
- JWT tokens with 7-day expiration
- Roles: STUDENT, DONOR, ADMIN, SUB_ADMIN, SUPER_ADMIN, CASE_WORKER
- Token stored in browser localStorage
- Auto-refresh on 401 response

### API Structure
- Base URL: `http://localhost:3001/api`
- All requests need `Authorization: Bearer <token>` header
- Responses follow consistent format: `{error: "msg"}` or `{data: ...}`

---

## Test Accounts

After importing the database, you'll have test accounts. Find them with:

```bash
psql -U postgres -d donors_dev -c "SELECT email, role FROM users LIMIT 10;"
```

You can also create new test accounts by signing up through the frontend.

---

## Project Highlights

✅ **Complete Student Application System**
- Multi-step application form
- Document upload with validation
- Real-time status tracking

✅ **Case Worker Review System**
- Task-based assignments (Document Review, Field Visit, CNIC Verification)
- Recommendation system with verification
- Student communication

✅ **Donor Sponsorship Matching**
- Browse and filter students
- Match donors to students
- Stripe payment integration
- Disbursement tracking

✅ **Professional Communication System**
- Real-time messaging
- Role-based access control
- Conversation threading

✅ **Admin Dashboard**
- Full application management
- Case worker assignment
- Analytics and reporting
- Board member interview system

---

## Common Issues & Solutions

| Issue | Solution |
|-------|----------|
| "Connection refused" | Make sure PostgreSQL is running |
| "Database does not exist" | Run: `psql -U postgres -c "CREATE DATABASE donors_dev;"` |
| "Port 3001 in use" | Kill the process: `lsof -i :3001 \| kill -9` |
| "Cannot find psql" | Add PostgreSQL bin to PATH or specify full path |
| "Module not found" | Run: `npm install` in both root and server/ |
| "Prisma out of date" | Run: `cd server && npx prisma generate` |

---

## Next Steps

1. ✅ Follow the 5-step setup above
2. ✅ Get the application running locally
3. ✅ Explore the codebase
4. ✅ Read the relevant guides in the docs
5. ✅ Start coding!

---

## Documentation Available

In the project root, you'll find these files:

- **QUICK_START_CARD.md** - One-page quick reference
- **SETUP_INSTRUCTIONS_FOR_NEW_DEVELOPERS.md** - Complete 12-part guide
- **POSTGRESQL_IMPORT_GUIDE.md** - All database import options
- **CODEBASE_AUDIT_REPORT.md** - Complete system audit results
- **README.md** - Project overview

---

## Get Help

If you get stuck:

1. Check the relevant documentation file
2. Look at the error message in the terminal
3. Search the codebase for similar issues
4. Check git logs for related commits

---

## Welcome to AWAKE Connect! 🚀

You now have everything you need to clone the project, set up a complete local environment with all database data, and start developing.

Good luck, and happy coding!

**Happy to help if you have any questions!**
