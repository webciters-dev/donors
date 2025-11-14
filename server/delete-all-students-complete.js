// delete-all-students-complete.js
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

console.log('🗑️ COMPLETELY REMOVING ALL STUDENTS FROM DATABASE\n');

try {
  await prisma.$connect();
  
  // Show current counts
  const currentCounts = {
    users: await prisma.user.count({ where: { role: 'STUDENT' } }),
    students: await prisma.student.count(),
    applications: await prisma.application.count()
  };
  
  console.log('📊 Current counts:');
  console.log(`   Student Users: ${currentCounts.users}`);
  console.log(`   Student Profiles: ${currentCounts.students}`);
  console.log(`   Applications: ${currentCounts.applications}`);
  
  console.log('\n🎯 Starting complete deletion...');
  
  // Delete in correct order due to foreign key constraints
  
  // 1. Delete all applications first
  const deletedApps = await prisma.application.deleteMany();
  console.log(`✅ Deleted ${deletedApps.count} applications`);
  
  // 2. Delete all student profiles
  const deletedStudents = await prisma.student.deleteMany();
  console.log(`✅ Deleted ${deletedStudents.count} student profiles`);
  
  // 3. Delete all student user accounts
  const deletedUsers = await prisma.user.deleteMany({
    where: { role: 'STUDENT' }
  });
  console.log(`✅ Deleted ${deletedUsers.count} student user accounts`);
  
  // Verify deletion
  console.log('\n📊 Verification - remaining data:');
  const remainingCounts = {
    totalUsers: await prisma.user.count(),
    studentUsers: await prisma.user.count({ where: { role: 'STUDENT' } }),
    students: await prisma.student.count(),
    applications: await prisma.application.count()
  };
  
  console.log(`Total Users: ${remainingCounts.totalUsers}`);
  console.log(`Student Users: ${remainingCounts.studentUsers}`);
  console.log(`Student Profiles: ${remainingCounts.students}`);
  console.log(`Applications: ${remainingCounts.applications}`);
  
  await prisma.$disconnect();
  console.log('\n✅ Complete student cleanup successful!');
  console.log('📝 Note: Admin and case worker accounts preserved');
  
} catch (error) {
  console.error('❌ Error:', error.message);
  process.exit(1);
}