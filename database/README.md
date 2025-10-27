# Database Setup for Developers

This directory contains database setup files and utilities for the Donors Management System.

## Quick Setup

1. **Create the database:**
   ```bash
   createdb donors_dev
   ```

2. **Run Prisma migrations:**
   ```bash
   cd server
   npx prisma migrate deploy
   ```

3. **Seed the database:**
   ```bash
   npm run seed
   ```

## Database Export/Import

### Export Current Database
```bash
# Export schema only
pg_dump -h localhost -U your_username -d donors_dev --schema-only > database/schema.sql

# Export with data
pg_dump -h localhost -U your_username -d donors_dev > database/full_dump.sql

# Export seed data only (after running migrations)
pg_dump -h localhost -U your_username -d donors_dev --data-only --disable-triggers > database/seed_data.sql
```

### Import Database
```bash
# Import full database
psql -h localhost -U your_username -d donors_dev < database/full_dump.sql

# Import seed data only (after running migrations)
psql -h localhost -U your_username -d donors_dev < database/seed_data.sql
```

## Development Database Reset

To reset your development database:

```bash
# Option 1: Drop and recreate (PostgreSQL)
dropdb donors_dev && createdb donors_dev
cd server && npx prisma migrate deploy && npm run seed

# Option 2: Use the clear database script
cd server && node clear-database-keep-admin.js
```

## Environment Setup

Create a `.env` file in the server directory:

```env
DATABASE_URL="postgresql://username:password@localhost:5432/donors_dev"
JWT_SECRET="your-dev-jwt-secret-here"
```

## Database Structure

The database uses PostgreSQL with Prisma ORM and includes:

- **Students**: Student profiles and academic information
- **Applications**: Funding applications with status tracking
- **Donors**: Donor profiles and preferences
- **Sponsorships**: Donor-student sponsorship relationships
- **Documents**: File uploads and document management
- **Messages & Conversations**: Communication system
- **Progress Reports**: Student progress tracking
- **Users**: Authentication and role management

## Migration Management

The project uses Prisma migrations located in `server/prisma/migrations/`. 

Current migrations:
- Initial schema setup
- Progress reports addition
- Amount and currency fields
- Legacy field cleanup

## Troubleshooting

### Common Issues

1. **Permission denied**: Ensure your PostgreSQL user has necessary permissions
2. **Database doesn't exist**: Create the database first with `createdb donors_dev`
3. **Connection refused**: Check if PostgreSQL is running and connection string is correct
4. **Migration issues**: Reset with `npx prisma migrate reset` (⚠️ destroys data)

### Useful Commands

```bash
# Check database connection
cd server && npx prisma db pull

# View database in Prisma Studio
cd server && npx prisma studio

# Generate fresh client
cd server && npx prisma generate

# Reset database (⚠️ destroys all data)
cd server && npx prisma migrate reset
```