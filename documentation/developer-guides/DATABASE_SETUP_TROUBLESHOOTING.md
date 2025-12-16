# Database Setup Troubleshooting Guide

> **For developers having issues setting up the local database**

---

## ❌ Problem: Database Files Don't Exist

**What the developer is seeing:**
```
ERROR: Could not find import_database.sh
ERROR: No SQL export files available
```

**Why this happens:**
- Previous developers may have deleted temporary database exports
- Database export files (`.sql`) are not part of the repository
- Each developer needs to initialize their own database

**✅ Solution:** Use Prisma to generate a fresh database

---

## 🔧 Complete Database Setup from Scratch

### Prerequisites
- ✅ PostgreSQL installed and running
- ✅ `npm` and `Node.js` installed
- ✅ Project cloned from GitHub
- ✅ Dependencies installed (`npm install`)

### Step-by-Step Setup

#### 1. Create PostgreSQL Database & User

**On Windows (PowerShell as Administrator):**
```powershell
# Connect to PostgreSQL
psql -U postgres

# Inside psql, run:
CREATE DATABASE awake_local_dev;
CREATE USER awake_dev WITH PASSWORD 'DevPassword123!';
GRANT ALL PRIVILEGES ON DATABASE awake_local_dev TO awake_dev;
GRANT ALL ON SCHEMA public TO awake_dev;
\q
```

**On Mac/Linux:**
```bash
psql -U postgres

# Inside psql:
CREATE DATABASE awake_local_dev;
CREATE USER awake_dev WITH PASSWORD 'DevPassword123!';
GRANT ALL PRIVILEGES ON DATABASE awake_local_dev TO awake_dev;
GRANT ALL ON SCHEMA public TO awake_dev;
\q
```

✅ **Database created successfully**

---

#### 2. Configure Environment File

Create file: `/server/.env`

```env
# Required settings
DATABASE_URL=postgresql://awake_dev:DevPassword123!@localhost:5432/awake_local_dev?schema=public
PORT=3001
NODE_ENV=development

# Frontend
FRONTEND_URL=http://localhost:5173
FRONTEND_URLS=http://localhost:5173,http://localhost:8080

# JWT (development values)
JWT_SECRET=dev_secret_key_for_local_testing
JWT_EXPIRES_IN=7d

# Email (Ethereal - free test email service)
ETHEREAL_USER=test@ethereal.email
ETHEREAL_PASS=test_password

# Stripe (test keys)
STRIPE_SECRET_KEY=sk_test_local
STRIPE_WEBHOOK_SECRET=whsec_test_local

# Optional
ENABLE_STRUCTURED_LOGGING=false
ENABLE_MONITORING=false
```

✅ **Environment configured**

---

#### 3. Generate Prisma Client

```bash
cd server
npm run db:generate
```

Expected output:
```
✔ Generated Prisma Client to ./node_modules/.prisma/client in XXXms
```

✅ **Prisma client generated**

---

#### 4. Push Schema to Database

```bash
npm run db:push
```

Expected output:
```
✔ Your database is now in sync with your Prisma schema.
```

✅ **Database schema created**

---

#### 5. Seed Sample Data

```bash
npm run seed
```

Expected output:
```
Seeding database with admin user...
Admin user created successfully
Database seeding complete!
```

✅ **Sample data added**

---

#### 6. Verify Setup

```bash
npm run dev
```

You should see:
```
Server running on port 3001
```

In another terminal:
```bash
curl http://localhost:3001/api/health
```

Expected response:
```json
{ "ok": true }
```

✅ **Setup complete and working!**

---

## 🚨 Troubleshooting Specific Errors

### Error 1: "role 'awake_dev' does not exist"

**Cause:** User wasn't created properly

**Fix:**
```bash
# Recreate the user
psql -U postgres -c "DROP USER IF EXISTS awake_dev;"
psql -U postgres -c "CREATE USER awake_dev WITH PASSWORD 'DevPassword123!';"
```

Then run: `npm run db:push`

---

### Error 2: "FATAL: password authentication failed"

**Cause:** Database URL has wrong credentials

**Fix:**
1. Verify credentials in `.env` match what you created:
   ```
   DATABASE_URL=postgresql://awake_dev:DevPassword123!@localhost:5432/awake_local_dev?schema=public
   ```
   
2. Check if password has special characters - if so, URL-encode them:
   ```
   Password: P@ss!123
   Encoded:  P%40ss%21123
   URL: postgresql://awake_dev:P%40ss%21123@localhost:5432/...
   ```

3. Reset password:
   ```bash
   psql -U postgres -c "ALTER USER awake_dev WITH PASSWORD 'NewPassword123!';"
   ```
   Update `.env` with new password

---

### Error 3: "database 'awake_local_dev' does not exist"

**Cause:** Database wasn't created

**Fix:**
```bash
psql -U postgres -c "CREATE DATABASE awake_local_dev;"
```

Then run: `npm run db:push`

---

### Error 4: "Cannot find module '@prisma/client'"

**Cause:** Prisma client not generated

**Fix:**
```bash
cd server
npm install
npm run db:generate
```

---

### Error 5: "Error: P1001: Can't reach database server at 'localhost:5432'"

**Cause:** PostgreSQL not running

**Fix:**
```bash
# On Windows - Start PostgreSQL service
net start postgresql-x64-16

# On Mac - Start Homebrew PostgreSQL
brew services start postgresql@16

# On Linux - Start PostgreSQL
sudo systemctl start postgresql
```

---

### Error 6: Database connection works but schema is wrong/old

**Cause:** Schema doesn't match `schema.prisma`

**Fix - Reset everything (⚠️ deletes all data):**
```bash
npm run db:reset
```

Then answer "Y" to confirm. This will:
1. Delete the database
2. Recreate it
3. Apply schema
4. Run seed

---

## ✅ After Successful Setup

You now have:
- ✅ Local PostgreSQL database
- ✅ Correct schema (all tables created)
- ✅ Sample admin user for testing
- ✅ Running development server
- ✅ Ready to start coding

---

## 📊 Database Contents After Seeding

After running `npm run seed`, you have:

**Admin User:**
```
Email: admin@example.com
Password: (check seed.cjs for details)
Role: ADMIN
```

**Other Tables:**
All tables from `/server/prisma/schema.prisma` are created and ready:
- Users
- Students
- Donors
- Applications
- Interviews
- Board Members
- And many more...

---

## 🔄 Common Workflows

### Reset to Fresh Database
```bash
npm run db:reset
```

### Apply Prisma Schema Changes
After modifying `schema.prisma`:
```bash
npm run db:push          # Development (no named migration)
npm run db:migrate       # Production (creates named migration)
```

### Export Current Database
```bash
npm run db:export        # Exports to SQL file
npm run db:export:win    # Windows batch script
```

### View Database in GUI
```bash
# Using pgAdmin (web interface)
# Running on: http://localhost:5050

# Or use DBeaver (free desktop app)
# Connection: localhost:5432, user: awake_dev
```

---

## 📞 Still Having Issues?

1. **Check Prerequisites:**
   - [ ] PostgreSQL installed and running?
   - [ ] Can you connect: `psql -U postgres`?
   - [ ] Node.js and npm installed?

2. **Verify Each Step:**
   - [ ] User `awake_dev` created?
   - [ ] Database `awake_local_dev` created?
   - [ ] `.env` file has correct DATABASE_URL?
   - [ ] `npm install` completed?
   - [ ] `npm run db:generate` succeeded?

3. **Check Logs:**
   - Server error output when running `npm run dev`
   - Look for specific error code in error output
   - Search this guide for that error

4. **Contact:**
   - Ask in team chat with full error message
   - Share output of: `npm run db:push`
   - Share output of: `npm run seed`

---

**Good luck! You're almost there! 🚀**
