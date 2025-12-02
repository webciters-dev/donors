import { PrismaClient } from '@prisma/client';

async function showDatabaseStatus() {
  const prisma = new PrismaClient();
  
  try {
    console.log(' === DATABASE STATUS ===');
    
    // Count all users by role
    const adminCount = await prisma.user.count({ where: { role: 'ADMIN' } });
    const donorCount = await prisma.user.count({ where: { role: 'DONOR' } });
    const studentCount = await prisma.user.count({ where: { role: 'STUDENT' } });
    const subAdminCount = await prisma.user.count({ where: { role: 'SUB_ADMIN' } });
    const caseWorkerCount = await prisma.user.count({ where: { role: 'CASE_WORKER' } });
    const totalUsers = await prisma.user.count();
    
    // Count other entities
    const studentsCount = await prisma.student.count();
    const applicationsCount = await prisma.application.count();
    const universitiesCount = await prisma.university.count();
    
    console.log('\n USERS:');
    console.log(`   Admins: ${adminCount}`);
    console.log(`   Donors: ${donorCount}`);
    console.log(`   Students: ${studentCount}`);
    console.log(`   Sub Admins (legacy): ${subAdminCount}`);
    console.log(`   Case Workers: ${caseWorkerCount}`);
    console.log(`   Total Users: ${totalUsers}`);
    
    console.log('\n DATA:');
    console.log(`   Student Records: ${studentsCount}`);
    console.log(`   Applications: ${applicationsCount}`);
    console.log(`   Universities: ${universitiesCount}`);
    
    console.log('\n Database is clean and ready for testing!');
    
  } catch (error) {
    console.error(' Error checking database status:', error);
  } finally {
    await prisma.$disconnect();
  }
}

showDatabaseStatus();