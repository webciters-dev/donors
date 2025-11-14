// list-databases-prisma.js
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

console.log('🔍 Listing databases using Prisma...');

try {
  await prisma.$connect();
  
  // Query to list all databases
  const databases = await prisma.$queryRaw`
    SELECT 
      datname as database_name,
      pg_size_pretty(pg_database_size(datname)) as size
    FROM pg_database 
    WHERE datistemplate = false
    ORDER BY datname;
  `;

  console.log('\n📊 Available databases:');
  databases.forEach((db, index) => {
    console.log(`${index + 1}. ${db.database_name} (${db.size})`);
  });

  // Get current database name
  const currentDb = await prisma.$queryRaw`SELECT current_database() as current_db`;
  console.log(`\n📍 Currently connected to: ${currentDb[0].current_db}`);

  // Check table counts in current database
  const tableCounts = await prisma.$queryRaw`
    SELECT 
      schemaname,
      tablename,
      n_tup_ins as inserts,
      n_tup_upd as updates,
      n_tup_del as deletes,
      n_live_tup as live_rows
    FROM pg_stat_user_tables 
    ORDER BY live_rows DESC;
  `;

  console.log('\n📈 Table statistics in current database:');
  tableCounts.forEach((table) => {
    console.log(`• ${table.tablename}: ${table.live_rows} rows`);
  });

  await prisma.$disconnect();
  
} catch (error) {
  console.error('❌ Error:', error.message);
  process.exit(1);
}