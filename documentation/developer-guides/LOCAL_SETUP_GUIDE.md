#  Local PostgreSQL Setup Guide

## Phase 1: Immediate Local Backup Setup

### Step 1: Create Local Database (Manual)

You have PostgreSQL 16.10 running! Now create your local database:

```bash
# Open Command Prompt or PowerShell as Administrator
# Connect to PostgreSQL (you'll be prompted for postgres password)
psql -U postgres

# Inside PostgreSQL shell, run these commands:
CREATE DATABASE awake_local_db;
CREATE USER awake_user WITH PASSWORD 'LocalDev123!';
GRANT ALL PRIVILEGES ON DATABASE awake_local_db TO awake_user;
GRANT ALL ON SCHEMA public TO awake_user;
\q
```

### Step 2: Update Environment Configuration

Replace your current `.env` with local configuration:

```env
DATABASE_URL=postgresql://awake_user:LocalDev123!@localhost:5432/awake_local_db?schema=public
PORT=3001
NODE_ENV=development
FRONTEND_URL=http://localhost:5173
FRONTEND_URLS=http://localhost:5173,http://localhost:8080,http://localhost:8081
JWT_SECRET=8a5b9f1f1f8a4b6c9f0d2c7e0a4f6b7c2e9d4a1b7f3c8e0d9a2f5b6c7d8e9f0
JWT_EXPIRES_IN=7d
STRIPE_SECRET_KEY=sk_test_51SEV0FBA3ZdfR2SV9WU3SDy6hP3aFWWr8PzkWi2O5LEzijbpdoHkV2z21d3qRHGOt6kh2LvWiaoYEHdMnrX7LNZZ00WpCksHPv
STRIPE_WEBHOOK_SECRET=whsec_demo
ETHEREAL_USER="ox6ypr6xrpctnyiy@ethereal.email"
ETHEREAL_PASS="uWvntGAykXbxmRCqzy"
```

### Step 3: Initialize Database Schema

```bash
cd c:\projects\donors\server
npx prisma migrate deploy
npm run seed
```

### Step 4: Backup Your Current Data (Before Migration)

If you have important data on Render, export it first:
```bash
# Export from Render (replace with your actual Render DATABASE_URL)
pg_dump "your_render_database_url" > backup_$(date +%Y%m%d).sql

# Import to local (after local setup)
psql -U awake_user -d awake_local_db < backup_YYYYMMDD.sql
```

## Phase 2: VPS Migration Plan

### Vimexx.nl Ticket Request Template:

```
Subject: PostgreSQL Installation Request - VPS Account [Your Account]

Hello Vimexx Support,

I have a VPS Maximaal account and need PostgreSQL installed for a production web application.

Requirements:
- PostgreSQL 14+ (preferably 16.x)
- Create database: awake_production
- Create user with full privileges
- Enable remote connections for application server
- Configure basic security settings

Please provide:
1. PostgreSQL version installed
2. Connection details (host, port, credentials)
3. Any firewall rules needed for external connections

Thank you!
```

### Migration Benefits Analysis:

**Cost Comparison:**
-  **Your VPS**: €59.99/month (already paying)
-  **Render DB**: $7/month (temporary solution)
-  **Supabase**: $25/month (additional cost)

**Your VPS Advantages:**
- No additional cost (already have it)
- Full control over configuration
- Better performance (dedicated resources)
- Can host multiple projects
- Professional hosting environment

## Timeline Recommendation:

1. **Today**: Set up local PostgreSQL (data safety)
2. **Today**: Open Vimexx ticket for PostgreSQL installation
3. **This week**: Test full application locally
4. **Next week**: Migrate to VPS when PostgreSQL is ready
5. **Future**: Keep local as development environment

This approach gives you:
-  Immediate data backup/safety
-  Continued development capability
-  Cost-effective production solution
-  Professional hosting infrastructure