// check-database-ages.js
import { PrismaClient } from '@prisma/client';

const databases = [
  { name: 'awake_db', url: 'postgresql://postgres:RoG*741%23PoS@localhost:5432/awake_db?schema=public' },
  { name: 'awake_local_db', url: 'postgresql://postgres:RoG*741%23PoS@localhost:5432/awake_local_db?schema=public' },
  { name: 'donors_db', url: 'postgresql://postgres:RoG*741%23PoS@localhost:5432/donors_db?schema=public' }
];

console.log('🔍 Checking database creation times and latest activity...\n');

for (const db of databases) {
  console.log(`📅 Database: ${db.name}`);
  console.log('='.repeat(50));
  
  const prisma = new PrismaClient({
    datasources: {
      db: {
        url: db.url
      }
    }
  });

  try {
    await prisma.$connect();
    
    // Get database creation/modification info
    const dbInfo = await prisma.$queryRaw`
      SELECT 
        datname,
        (pg_stat_file('base/'||oid ||'/PG_VERSION')).modification as last_modified
      FROM pg_database 
      WHERE datname = ${db.name}
    `;

    if (dbInfo.length > 0) {
      console.log(`📊 Database modified: ${new Date(dbInfo[0].last_modified).toISOString()}`);
    }

    // Get latest user creation (indicates recent activity)
    try {
      const latestUser = await prisma.user.findFirst({
        orderBy: { createdAt: 'desc' },
        select: { email: true, role: true, createdAt: true }
      });

      if (latestUser) {
        console.log(`👤 Latest user created: ${latestUser.email} (${latestUser.role}) on ${latestUser.createdAt.toISOString()}`);
      }
    } catch (userError) {
      console.log(`❌ Cannot read users: ${userError.message}`);
    }

    // Get latest student creation
    try {
      const latestStudent = await prisma.student.findFirst({
        orderBy: { createdAt: 'desc' },
        select: { name: true, email: true, createdAt: true }
      });

      if (latestStudent) {
        console.log(`🎓 Latest student: ${latestStudent.name} on ${latestStudent.createdAt.toISOString()}`);
      }
    } catch (studentError) {
      console.log(`❌ Cannot read students: ${studentError.message}`);
    }

    // Get latest application
    try {
      const latestApplication = await prisma.application.findFirst({
        orderBy: { submittedAt: 'desc' },
        select: { 
          student: { select: { name: true } },
          status: true, 
          submittedAt: true 
        }
      });

      if (latestApplication) {
        console.log(`📝 Latest application: ${latestApplication.student.name} on ${latestApplication.submittedAt.toISOString()}`);
      }
    } catch (appError) {
      console.log(`❌ Cannot read applications: ${appError.message}`);
    }

    // Check schema version (from migrations table)
    try {
      const migrations = await prisma.$queryRaw`
        SELECT migration_name, finished_at 
        FROM "_prisma_migrations" 
        ORDER BY finished_at DESC 
        LIMIT 3
      `;

      if (migrations.length > 0) {
        console.log(`🔧 Latest migration: ${migrations[0].migration_name}`);
        console.log(`   Applied: ${new Date(migrations[0].finished_at).toISOString()}`);
      }
    } catch (migrationError) {
      console.log(`❌ Cannot read migrations: ${migrationError.message}`);
    }

    await prisma.$disconnect();
    console.log('');
    
  } catch (error) {
    console.log(`❌ Error accessing ${db.name}:`, error.message);
    console.log('');
  }
}

console.log('🎯 Recommendation: The database with the LATEST activity should be your primary database.');