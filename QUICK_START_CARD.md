# AWAKE Connect - Developer Quick Start Card

## Clone & Setup (5 minutes)

```bash
# 1. Clone repository
git clone https://github.com/webciters-dev/donors.git
cd donors

# 2. Create .env file (see template below)
# Copy-paste this and fill in YOUR credentials:
```

### .env Template
```env
DATABASE_URL="postgresql://postgres:YOUR_PASSWORD@localhost:5432/donors_dev"
JWT_SECRET=generate_random_secret_here
FRONTEND_URL=http://localhost:8080
ENABLE_RATE_LIMITING=true
```

## Database Setup (2 minutes)

### Windows
```bash
cd database
./import_database.bat
```

### Mac/Linux
```bash
cd database
chmod +x import_database.sh
./import_database.sh
```

### Manual (All platforms)
```bash
psql -U postgres -c "CREATE DATABASE donors_dev;"
psql -U postgres -d donors_dev -f database/complete_local_database_export.sql
```

## Start Development (1 minute)

### Terminal 1 - Backend
```bash
cd server
npm install
npm run dev
# Starts on http://localhost:3001
```

### Terminal 2 - Frontend
```bash
npm install
npm run dev
# Starts on http://localhost:5173
```

## Verify Everything Works

```bash
# Test backend health
curl http://localhost:3001/api/health

# Open browser
http://localhost:5173
```

---

## Key Directories

```
donors/
├── server/          ← Backend (Express.js, Prisma, PostgreSQL)
├── src/             ← Frontend (React, Vite, Tailwind)
├── database/        ← SQL import scripts
└── .env             ← Environment configuration
```

---

## Essential Commands

| Task | Command |
|------|---------|
| **Start backend** | `cd server && npm run dev` |
| **Start frontend** | `npm run dev` |
| **View database** | `cd server && npx prisma studio` |
| **Create migration** | `cd server && npx prisma migrate dev --name change_name` |
| **View database schema** | `cat server/prisma/schema.prisma` |
| **Commit & push** | `git add . && git commit -m "message" && git push origin main` |
| **Reset database** | `cd server && npx prisma migrate reset --force` |

---

## Test Accounts (from database)

Query to find test accounts:
```bash
psql -U postgres -d donors_dev -c "SELECT email, role FROM users LIMIT 10;"
```

Or check these typical test accounts:
- **Admin:** admin@test.com (role: ADMIN)
- **Case Worker:** caseworker@test.com (role: SUB_ADMIN)
- **Student:** student@test.com (role: STUDENT)
- **Donor:** donor@test.com (role: DONOR)

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────┐
│                    React Frontend                        │
│              (http://localhost:5173)                     │
└────────────────────┬────────────────────────────────────┘
                     │ REST API calls
                     ↓
┌─────────────────────────────────────────────────────────┐
│           Express.js Backend (API Server)                │
│              (http://localhost:3001)                     │
│                                                          │
│   29 Route Modules:                                     │
│   ├─ auth.js (Login, Register)                          │
│   ├─ users.js (Case Workers)                            │
│   ├─ applications.js (Student Applications)             │
│   ├─ fieldReviews.js (Case Worker Reviews)              │
│   ├─ students.js (Student Profiles)                     │
│   ├─ donors.js (Donor Profiles)                         │
│   ├─ sponsorships.js (Matching)                         │
│   ├─ messages.js (Communication)                        │
│   └─ ...plus 21 more modules                            │
└────────────────────┬────────────────────────────────────┘
                     │ SQL queries (Prisma ORM)
                     ↓
┌─────────────────────────────────────────────────────────┐
│      PostgreSQL Database (localhost:5432)               │
│                                                          │
│   Tables (30+):                                         │
│   ├─ users (Admin, Students, Donors, Case Workers)     │
│   ├─ students (Student profiles & data)                │
│   ├─ applications (Student applications)                │
│   ├─ field_reviews (Case worker reviews)                │
│   ├─ donors (Donor profiles)                            │
│   ├─ sponsorships (Donor-Student matching)              │
│   └─ ...plus 24 more tables                             │
└─────────────────────────────────────────────────────────┘
```

---

## File Structure

```
donors/
├── src/                          ← Frontend (React)
│   ├── pages/                    (43 pages: Student, Donor, Admin, Case Worker)
│   ├── components/               (React components & UI)
│   ├── lib/                      (Utilities: API, validation, formatting)
│   ├── App.jsx                   (Main app with routing)
│   └── index.css                 (Global styles)
│
├── server/                       ← Backend (Express.js)
│   ├── src/
│   │   ├── routes/              (29 API endpoint modules)
│   │   ├── middleware/          (Auth, validation, logging)
│   │   ├── lib/                 (Business logic: email, FX, etc.)
│   │   ├── validation/          (Zod schemas)
│   │   └── server.js            (Express app setup)
│   ├── prisma/
│   │   ├── schema.prisma        (Database schema definition)
│   │   └── migrations/          (Database version history)
│   └── package.json
│
├── database/                     ← SQL Scripts
│   ├── complete_local_database_export.sql   ⭐ Use this
│   ├── donors_db_export.sql
│   ├── donors_data_only.sql
│   ├── import_database.bat      (Windows)
│   ├── import_database.sh       (Mac/Linux)
│   └── reset_database.ps1
│
├── package.json                  ← Frontend dependencies
├── vite.config.js               ← Frontend build config
├── .env                         ← Environment variables
└── README.md
```

---

## User Roles & Access

| Role | Capabilities |
|------|--------------|
| **STUDENT** | Apply for sponsorship, upload docs, track progress, message admins/donors |
| **DONOR** | Browse students, sponsor applications, track disbursements, message students |
| **SUB_ADMIN** (Case Worker) | Review applications, verify documents, provide recommendations |
| **ADMIN** | Manage all operations, assign case workers, approve applications |
| **SUPER_ADMIN** | Full system access, manage admins, security settings |

---

## Key Features Implemented

✅ Student Application System
- Multi-step application form
- Document upload (CNIC, transcripts, etc.)
- Application status tracking

✅ Case Worker Review System
- Task-based assignments (Document Review, Field Visit, CNIC Verification)
- Recommendation system
- Student communication

✅ Donor Sponsorship System
- Browse and filter students
- Match donors to students
- Payment processing (Stripe)
- Disbursement tracking

✅ Communication System
- Real-time messaging
- Role-based access
- Conversation threading

✅ Admin Dashboard
- Application management
- Case worker assignment
- Analytics & reporting
- Board member interviews

---

## Database Tables (Key Ones)

| Table | Purpose |
|-------|---------|
| `users` | All user accounts (login credentials, role) |
| `students` | Student profiles & personal data |
| `applications` | Student applications with financial needs |
| `field_reviews` | Case worker reviews & recommendations |
| `donors` | Donor profiles & preferences |
| `sponsorships` | Donor-Student matches & payments |
| `messages` | Communication between users |
| `documents` | Uploaded files (CNIC, transcripts, etc.) |

---

## Troubleshooting

| Issue | Solution |
|-------|----------|
| **"Cannot connect to database"** | Make sure PostgreSQL is running: `pg_ctl status` |
| **"Database does not exist"** | Create it: `psql -U postgres -c "CREATE DATABASE donors_dev;"` |
| **"Port 3001 already in use"** | Kill the process: `lsof -i :3001` then `kill -9 <PID>` |
| **"Frontend won't connect to backend"** | Ensure backend is running on port 3001 |
| **Prisma client out of date** | Regenerate: `cd server && npx prisma generate` |
| **Migration errors** | Check schema: `cat server/prisma/schema.prisma` |

---

## Git Workflow

```bash
# Before starting work
git pull origin main

# Work on features
git checkout -b feature/your-feature-name
# ...make changes...

# Commit & push
git add .
git commit -m "Add feature: description"
git push origin feature/your-feature-name

# Create Pull Request on GitHub for review
```

---

## Performance Notes

- Backend uses Prisma ORM for type-safe database queries
- Frontend uses React Query for efficient API caching
- Emails sent asynchronously (don't block requests)
- File uploads support resumable uploads
- Database indexed on frequently-queried fields

---

## Monitoring & Debugging

### View live database changes:
```bash
cd server
npx prisma studio
# Opens http://localhost:5555
```

### See all API requests:
Backend terminal shows: `POST /api/applications` etc.

### Debug frontend:
Browser DevTools → Network tab

### Check backend logs:
Backend terminal shows all errors and requests

---

## Support & Resources

- **Schema:** `cat server/prisma/schema.prisma`
- **API Routes:** Browse `server/src/routes/`
- **React Components:** Browse `src/pages/` and `src/components/`
- **Documentation:** Check `*.md` files in project root

---

## Next Steps

1. ✅ Clone project
2. ✅ Import database
3. ✅ Start backend & frontend
4. ✅ Open http://localhost:5173
5. ✅ Login with test account
6. ✅ Start coding!

---

**Welcome to AWAKE Connect! 🚀**
