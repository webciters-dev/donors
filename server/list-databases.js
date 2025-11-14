// list-databases.js
import pkg from 'pg';
const { Client } = pkg;

// Extract connection details from DATABASE_URL
const dbUrl = process.env.DATABASE_URL || 'postgresql://postgres:RoG*741%23PoS@localhost:5432/donors_db?schema=public';
const url = new URL(dbUrl);

const client = new Client({
  host: url.hostname,
  port: url.port || 5432,
  user: url.username,
  password: decodeURIComponent(url.password),
  database: 'postgres' // Connect to postgres db to list all databases
});

console.log('🔍 Listing all PostgreSQL databases...');

try {
  await client.connect();
  
  const result = await client.query(`
    SELECT 
      datname as database_name,
      pg_size_pretty(pg_database_size(datname)) as size,
      datcollate as collation,
      (SELECT count(*) FROM pg_stat_activity WHERE datname = pg_database.datname) as active_connections
    FROM pg_database 
    WHERE datistemplate = false
    ORDER BY datname;
  `);

  console.log('\n📊 Available databases:');
  result.rows.forEach((db, index) => {
    console.log(`${index + 1}. ${db.database_name} (${db.size}) - ${db.active_connections} active connections`);
  });

  // Check current database from connection string
  const currentDb = url.pathname.slice(1); // Remove leading slash
  console.log(`\n📍 Currently connected to: ${currentDb}`);

  await client.end();
} catch (error) {
  console.error('❌ Error listing databases:', error.message);
  process.exit(1);
}