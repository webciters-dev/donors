// setup-local-db.js
// Run this script to set up your local PostgreSQL database

const { execSync } = require('child_process');

console.log('🚀 Setting up local PostgreSQL database...');

// Database configuration
const DB_NAME = 'awake_local_db';
const DB_USER = 'awake_user';
const DB_PASSWORD = 'LocalDev123!'; // Change this to your preferred password

try {
  console.log('📝 Step 1: Creating database and user...');
  
  // Create database
  execSync(`psql -U postgres -c "CREATE DATABASE ${DB_NAME};"`, { 
    stdio: 'inherit',
    input: 'postgres_password_here\n' // You'll enter this manually
  });
  
  // Create user
  execSync(`psql -U postgres -c "CREATE USER ${DB_USER} WITH PASSWORD '${DB_PASSWORD}';"`, {
    stdio: 'inherit'
  });
  
  // Grant privileges
  execSync(`psql -U postgres -c "GRANT ALL PRIVILEGES ON DATABASE ${DB_NAME} TO ${DB_USER};"`, {
    stdio: 'inherit'
  });
  
  console.log('✅ Database setup complete!');
  console.log(`📋 Your local DATABASE_URL should be:`);
  console.log(`postgresql://${DB_USER}:${DB_PASSWORD}@localhost:5432/${DB_NAME}?schema=public`);
  
} catch (error) {
  console.log('❌ Error setting up database. Please run these commands manually:');
  console.log(`
Manual Setup Commands:
1. Connect to PostgreSQL: psql -U postgres
2. Create database: CREATE DATABASE ${DB_NAME};
3. Create user: CREATE USER ${DB_USER} WITH PASSWORD '${DB_PASSWORD}';
4. Grant privileges: GRANT ALL PRIVILEGES ON DATABASE ${DB_NAME} TO ${DB_USER};
5. Exit: \\q
  `);
}

console.log(`
🔧 Next Steps:
1. Update your .env file with the DATABASE_URL above
2. Run: npx prisma migrate deploy
3. Run: npm run seed
4. Start your server: npm start
`);