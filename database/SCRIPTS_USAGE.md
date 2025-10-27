# Database Package Scripts Usage Guide

Add these scripts to your `server/package.json` file under the "scripts" section:

```json
{
  "scripts": {
    "db:export": "cd ../database && bash export_database.sh",
    "db:export:win": "cd ../database && export_database.bat",
    "db:import": "cd ../database && bash import_database.sh", 
    "db:import:win": "cd ../database && import_database.bat",
    "db:reset": "cd ../database && bash reset_database.sh",
    "db:reset:win": "cd ../database && powershell -ExecutionPolicy Bypass -File reset_database.ps1",
    "db:reset:keep-admin": "cd ../database && powershell -ExecutionPolicy Bypass -File reset_database.ps1 -KeepAdmin",
    "db:backup": "npm run db:export",
    "db:restore": "npm run db:import", 
    "db:fresh": "npm run db:reset && npm run seed",
    "db:migrate:fresh": "npx prisma migrate reset --force && npm run seed"
  }
}
```

## Usage Examples:

### Export/Backup Operations:
- `npm run db:export` - Export current database (Linux/Mac)
- `npm run db:export:win` - Export current database (Windows)
- `npm run db:backup` - Alias for db:export

### Import/Restore Operations:
- `npm run db:import` - Import database from files (Linux/Mac)
- `npm run db:import:win` - Import database from files (Windows)
- `npm run db:restore` - Alias for db:import

### Reset Operations:
- `npm run db:reset` - Reset database completely (Linux/Mac)
- `npm run db:reset:win` - Reset database completely (Windows)
- `npm run db:reset:keep-admin` - Reset but preserve admin user (Windows)
- `npm run db:fresh` - Reset database and seed with fresh data
- `npm run db:migrate:fresh` - Reset with Prisma migrations and seed

## Platform-Specific Usage:

### Windows Users:
Use the `:win` suffixed commands for better Windows compatibility:
```bash
npm run db:export:win
npm run db:import:win  
npm run db:reset:win
```

### Linux/Mac Users:
Use the standard commands:
```bash
npm run db:export
npm run db:import
npm run db:reset
```

## Cross-Platform:
These commands work on all platforms:
```bash
npm run db:backup    # Export database
npm run db:restore   # Import database  
npm run db:fresh     # Fresh reset with seed data
```