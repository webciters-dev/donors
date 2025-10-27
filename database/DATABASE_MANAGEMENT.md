# Database Management for Donors Management System

This directory contains all database-related utilities and documentation for the Donors Management System.

## 🚀 Quick Start for New Developers

**Option 1: Automated Setup (Recommended)**
```bash
cd database
bash quick_setup.sh  # Linux/Mac/Git Bash
```

**Option 2: Manual Setup**
```bash
# Create database
createdb donors_dev

# Setup server and run migrations
cd server
npm install
npx prisma migrate deploy
npm run seed
```

## 📁 Files Overview

| File | Description | Platform |
|------|-------------|----------|
| `quick_setup.sh` | Automated setup for new developers | Linux/Mac |
| `export_database.sh` | Export database to SQL files | Linux/Mac |
| `import_database.sh` | Import database from SQL files | Linux/Mac |
| `export_database.bat` | Export database to SQL files | Windows |
| `import_database.bat` | Import database from SQL files | Windows |
| `reset_database.ps1` | Reset database with fresh data | Windows |
| `README.md` | Detailed setup instructions | All |
| `SCRIPTS_USAGE.md` | npm scripts usage guide | All |

## 🛠️ Database Operations

### Export Database (Create Backup)
```bash
# Linux/Mac
./export_database.sh

# Windows
export_database.bat

# Via npm (from server directory)
npm run db:export       # Linux/Mac
npm run db:export:win   # Windows
```

**Generates:**
- `schema.sql` - Database structure only
- `seed_data.sql` - Data only (for existing schema)
- `full_dump.sql` - Complete database (structure + data)
- `sample_data.sql` - Limited sample data for testing
- `database_info.txt` - Export metadata

### Import Database (Restore Backup)
```bash
# Linux/Mac
./import_database.sh

# Windows  
import_database.bat

# Via npm (from server directory)
npm run db:import       # Linux/Mac
npm run db:import:win   # Windows
```

**Import Options:**
1. Import full database (structure + data)
2. Import schema only, then data
3. Import sample data only
4. Create empty database for Prisma migrations

### Reset Database (Fresh Start)
```bash
# Linux/Mac
./reset_database.sh

# Windows
powershell reset_database.ps1

# Via npm (from server directory)
npm run db:reset        # Linux/Mac
npm run db:reset:win    # Windows
npm run db:fresh        # Reset + seed data
```

## 📊 Database Schema

The database includes the following main entities:

- **Students** - Student profiles and academic information
- **Applications** - Funding applications with status tracking
- **Donors** - Donor profiles and preferences
- **Sponsorships** - Donor-student relationships
- **Documents** - File uploads and document management
- **Messages & Conversations** - Communication system
- **Progress Reports** - Student progress tracking
- **Users** - Authentication and role management

## 🔧 Development Workflow

### For New Team Members:
1. Clone the repository
2. Run `cd database && bash quick_setup.sh`
3. Update `server/.env` with your database credentials
4. Start development: `cd server && npm run dev`

### For Regular Development:
- Export before major changes: `npm run db:backup`
- Reset for testing: `npm run db:fresh`
- Share database state: Export and commit the `.sql` files

### For Database Changes:
1. Create Prisma migration: `npx prisma migrate dev`
2. Test migration with fresh database: `npm run db:fresh`
3. Export and commit updated schema: `npm run db:export`

## 🌐 Cross-Platform Compatibility

The scripts support multiple platforms:

- **Linux/Mac**: Use `.sh` scripts
- **Windows**: Use `.bat` scripts or PowerShell `.ps1`
- **Cross-platform**: Use npm scripts from `server/` directory

## 🔍 Troubleshooting

### Common Issues:

**"PostgreSQL tools not found"**
- Install PostgreSQL and add to PATH
- Ubuntu: `sudo apt install postgresql postgresql-contrib`
- macOS: `brew install postgresql`
- Windows: Download from postgresql.org

**"Database does not exist"**
- Create database: `createdb donors_dev`
- Check connection: `psql -d donors_dev`

**"Permission denied"**
- Check PostgreSQL user permissions
- Update DATABASE_URL in .env file
- Ensure PostgreSQL service is running

**"Migration failed"**
- Reset database: `npm run db:fresh`
- Check Prisma schema for errors
- Verify all required fields are present

### Useful Commands:

```bash
# Check database connection
psql -d donors_dev

# View database in Prisma Studio
cd server && npx prisma studio

# Check table contents
psql -d donors_dev -c "SELECT COUNT(*) FROM students;"

# Reset Prisma migrations
cd server && npx prisma migrate reset

# Generate fresh Prisma client
cd server && npx prisma generate
```

## 📚 Additional Resources

- [Prisma Documentation](https://www.prisma.io/docs/)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
- [Project Main README](../README.md)
- [Server Documentation](../server/README.md)

## 🤝 Contributing

When making database changes:

1. Create and test your migration locally
2. Export the updated database schema
3. Commit both migration files and exported schema
4. Update this documentation if needed
5. Test the import process on a fresh database

This ensures all team members can easily sync database changes.