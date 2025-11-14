// check-all-databases.js
import { PrismaClient } from '@prisma/client';

const databases = [
  'postgresql://postgres:RoG*741%23PoS@localhost:5432/awake_db?schema=public',
  'postgresql://postgres:RoG*741%23PoS@localhost:5432/awake_local_db?schema=public',
  'postgresql://postgres:RoG*741%23PoS@localhost:5432/donors_db?schema=public'
];

for (const dbUrl of databases) {
  const dbName = dbUrl.split('/').pop().split('?')[0];
  console.log(`\n🔍 Checking database: ${dbName}`);
  console.log('='.repeat(50));
  
  const prisma = new PrismaClient({
    datasources: {
      db: {
        url: dbUrl
      }
    }
  });

  try {
    await prisma.$connect();
    
    // Count records in each table
    const userCount = await prisma.user.count();
    const studentCount = await prisma.student.count();
    const donorCount = await prisma.donor.count();
    const applicationCount = await prisma.application.count();
    const sponsorshipCount = await prisma.sponsorship.count();
    
    console.log(`📊 Record counts:`);
    console.log(`- Users: ${userCount}`);
    console.log(`- Students: ${studentCount}`);
    console.log(`- Donors: ${donorCount}`);
    console.log(`- Applications: ${applicationCount}`);
    console.log(`- Sponsorships: ${sponsorshipCount}`);
    
    // Get sample users to check data quality
    if (userCount > 0) {
      const users = await prisma.user.findMany({
        select: {
          email: true,
          role: true,
          createdAt: true
        },
        take: 3
      });
      
      console.log(`\n👥 Sample users:`);
      users.forEach((user, index) => {
        console.log(`${index + 1}. ${user.email} (${user.role}) - ${user.createdAt.toISOString().split('T')[0]}`);
      });
    }

    // Get sample students if any
    if (studentCount > 0) {
      const students = await prisma.student.findMany({
        select: {
          name: true,
          email: true,
          university: true,
          createdAt: true
        },
        take: 3
      });
      
      console.log(`\n🎓 Sample students:`);
      students.forEach((student, index) => {
        console.log(`${index + 1}. ${student.name} (${student.email}) - ${student.createdAt.toISOString().split('T')[0]}`);
      });
    }

    await prisma.$disconnect();
    
  } catch (error) {
    console.log(`❌ Error accessing ${dbName}:`, error.message);
  }
}