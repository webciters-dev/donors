# PostgreSQL Password Recovery Guide

## Method 1: Reset Password Using pg_hba.conf (Safest)

### Step 1: Locate PostgreSQL configuration
1. Open File Explorer and go to: `C:\Program Files\PostgreSQL\16\data`
2. Find the file `pg_hba.conf`
3. Make a backup copy: `pg_hba.conf.backup`

### Step 2: Temporarily disable password authentication
1. Open `pg_hba.conf` in Notepad (as Administrator)
2. Find the line that looks like:
   ```
   host    all             all             127.0.0.1/32            md5
   ```
3. Change `md5` to `trust` (temporarily):
   ```
   host    all             all             127.0.0.1/32            trust
   ```
4. Save the file

### Step 3: Restart PostgreSQL service
```powershell
# Stop service
net stop postgresql-x64-16

# Start service  
net start postgresql-x64-16
```

### Step 4: Connect and reset password
```powershell
# Connect without password
psql -U postgres

# Inside PostgreSQL, set new password:
ALTER USER postgres PASSWORD 'YourNewPassword123!';
\q
```

### Step 5: Restore security
1. Open `pg_hba.conf` again
2. Change `trust` back to `md5`
3. Restart PostgreSQL service:
   ```powershell
   net stop postgresql-x64-16
   net start postgresql-x64-16
   ```

## Method 2: Check Installation Notes

During PostgreSQL installation, the password might be in:
- Desktop shortcuts
- Start Menu PostgreSQL folder
- `C:\Program Files\PostgreSQL\16\installation.log` (if exists)

## Method 3: Common Default Passwords

Try these common defaults:
- `postgres`
- `admin` 
- `password`
- `123456`
- Your Windows username
- Empty password (just press Enter)

## After Recovery: Set Up Your Database

Once you have access, run these commands in psql:

```sql
-- Create your database
CREATE DATABASE awake_local_db;

-- Create your user
CREATE USER awake_user WITH PASSWORD 'LocalDev123!';

-- Grant permissions
GRANT ALL PRIVILEGES ON DATABASE awake_local_db TO awake_user;
GRANT ALL ON SCHEMA public TO awake_user;

-- Test connection
\c awake_local_db awake_user
```

## Update Your .env File

After setup, use this DATABASE_URL:
```
DATABASE_URL=postgresql://awake_user:LocalDev123!@localhost:5432/awake_local_db?schema=public
```