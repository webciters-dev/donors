# Developer Local Setup Guide - Quick Start (Updated)

> **For developers cloning the project for the first time**

---

## 🚀 Quick Setup (15 minutes)

This guide assumes you have **PostgreSQL 14+** installed locally. If not, [install PostgreSQL first](https://www.postgresql.org/download/).

### Step 1: Clone & Install Dependencies

```bash
# Clone the repository
git clone https://github.com/webciters-dev/donors.git
cd donors

# Install server dependencies
cd server
npm install

# Go back to root
cd ..
```

---

### Step 2: Create Local Database

**On Windows (PowerShell):**
```powershell
# Start PostgreSQL (if not running)
# Then create database and user:

psql -U postgres -c "CREATE DATABASE awake_local_dev;"
psql -U postgres -c "CREATE USER awake_dev WITH PASSWORD 'DevPassword123!';"
psql -U postgres -c "GRANT ALL PRIVILEGES ON DATABASE awake_local_dev TO awake_dev;"
psql -U postgres -c "GRANT ALL ON SCHEMA public TO awake_dev;"
```

**On Mac/Linux:**
```bash
# Start PostgreSQL (if not running)
# Then create database and user:

psql -U postgres -c "CREATE DATABASE awake_local_dev;"
psql -U postgres -c "CREATE USER awake_dev WITH PASSWORD 'DevPassword123!';"
psql -U postgres -c "GRANT ALL PRIVILEGES ON DATABASE awake_local_dev TO awake_dev;"
psql -U postgres -c "GRANT ALL ON SCHEMA public TO awake_dev;"
```

---

### Step 3: Configure Environment Variables

Create `.env` file in `/server/` directory:

```env
# Database
DATABASE_URL=postgresql://awake_dev:DevPassword123!@localhost:5432/awake_local_dev?schema=public

# Server
PORT=3001
NODE_ENV=development

# Frontend URLs
FRONTEND_URL=http://localhost:5173
FRONTEND_URLS=http://localhost:5173,http://localhost:8080

# JWT (use these for development)
JWT_SECRET=dev_secret_key_12345_change_in_production
JWT_EXPIRES_IN=7d

# Email (using Ethereal for testing - no real emails sent)
ETHEREAL_USER=your_ethereal_email@ethereal.email
ETHEREAL_PASS=your_ethereal_password

# Stripe (test keys - replace with yours)
STRIPE_SECRET_KEY=sk_test_YOUR_KEY_HERE
STRIPE_WEBHOOK_SECRET=whsec_test_YOUR_KEY_HERE

# Recaptcha (optional - use dummy values for testing)
RECAPTCHA_SECRET_KEY=test_key_123

# Other settings
ENABLE_STRUCTURED_LOGGING=false
ENABLE_MONITORING=false
```

⚠️ **Never commit `.env` file!** (It's already in `.gitignore`)

---

### Step 4: Initialize Database Schema & Seed Data

```bash
cd server

# Generate Prisma client
npm run db:generate

# Create tables from schema
npm run db:push

# Seed with sample admin user
npm run seed
```

✅ **Database is now ready with sample data!**

---

### Step 5: Start Development Server

```bash
# From /server directory
npm run dev
```

You should see:
```
Server running on port 3001
Listening on http://localhost:3001
```

---

### Step 6: Verify Setup

Test the server is working:

```bash
# In another terminal, test health endpoint
curl http://localhost:3001/api/health
```

Expected response:
```json
{ "ok": true }
```

---

## 📋 What You Have Now

✅ **PostgreSQL database** - `awake_local_dev`  
✅ **Schema created** - All tables from `schema.prisma`  
✅ **Sample data** - Admin user and test data  
✅ **Running server** - On `http://localhost:3001`  

---

## 🔧 Common Issues & Solutions

### Issue: "psql: command not found" (Mac/Linux)

**Solution:** Add PostgreSQL to PATH
```bash
# For Mac
echo 'export PATH="/usr/local/opt/postgresql@16/bin:$PATH"' >> ~/.zshrc
source ~/.zshrc

# For Linux
sudo apt-get install postgresql-client
```

---

### Issue: "FATAL: role 'postgres' does not exist" (Mac)

**Solution:** Use default user instead
```bash
createdb awake_local_dev
createuser awake_dev
```

---

### Issue: "password authentication failed for user 'awake_dev'"

**Solution:** Verify DATABASE_URL in `.env` matches credentials
```env
# Check this matches what you created:
DATABASE_URL=postgresql://awake_dev:DevPassword123!@localhost:5432/awake_local_dev?schema=public
```

---

### Issue: "Cannot find module '@prisma/client'"

**Solution:** Regenerate Prisma client
```bash
npm run db:generate
```

---

### Issue: Database already exists but schema is old

**Solution:** Reset database (deletes all data)
```bash
npm run db:reset
```

---

## 📚 Next Steps

**Start developing:**
1. Server code is in `/server/src/`
2. Client code is in `/client/`
3. API routes are in `/server/src/routes/`

**Running tests:**
```bash
cd server
npm run test              # Run all tests
npm run test:ui          # Run with UI
npm run test:coverage    # Coverage report
```

**Database migrations:**
```bash
# After changing schema.prisma:
npm run db:push          # Apply changes (development)
npm run db:migrate       # Create named migration (production)
```

---

## 🚨 Important Notes

### Error Reporting Framework

This project includes a comprehensive **error reporting system**:
- All errors are logged with context (user, route, action)
- Check `/server/src/lib/errorCodes.js` for error codes
- Errors don't crash the server (graceful handling)
- See `/documentation/analysis-reports/ERROR_REPORTING_FRAMEWORK_COMPLETE.md` for details

### Production Code

The error reporting framework is already implemented in:
- ✅ `/server/src/lib/errorCodes.js` - 40+ error codes
- ✅ `/server/src/lib/errorLogger.js` - Structured logging
- ✅ `/server/src/lib/enhancedError.js` - Error response builders
- ✅ All routes have proper error handling

**Don't modify these files without understanding the framework!**

---

## 📞 Need Help?

1. **Check documentation:** `/documentation/developer-guides/`
2. **Check error logs:** `/server/logs/` (if enabled)
3. **Contact:** Original developer or team lead

---

## ✅ Verification Checklist

Before starting development, verify:
- [ ] PostgreSQL running locally
- [ ] Database `awake_local_dev` created
- [ ] User `awake_dev` created with correct password
- [ ] `.env` file configured in `/server/`
- [ ] `npm install` completed
- [ ] `npm run db:push` executed successfully
- [ ] `npm run seed` completed
- [ ] `npm run dev` starts without errors
- [ ] `curl http://localhost:3001/api/health` returns `{"ok": true}`

---

**Happy coding! 🚀**
