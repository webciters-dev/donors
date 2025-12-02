// delete-complete-student.js
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

console.log('️ COMPLETELY REMOVING STUDENT/APPLICANT FROM DATABASE\n');

const studentEmail = 'webciters@gmail.com';

try {
  await prisma.$connect();
  
  console.log(' Current state before deletion:');
  const currentUser = await prisma.user.findUnique({
    where: { email: studentEmail },
    include: {
      student: true
    }
  });
  
  if (!currentUser) {
    console.log(' No student found with email:', studentEmail);
    process.exit(0);
  }
  
  console.log(` Found student user: ${currentUser.email}`);
  console.log(`   Student ID: ${currentUser.studentId}`);
  console.log(`   Student Profile: ${currentUser.student ? 'Yes' : 'No'}`);
  
  // Check for applications
  const applications = await prisma.application.findMany({
    where: { studentId: currentUser.studentId }
  });
  console.log(`   Applications: ${applications.length}`);
  
  console.log('\n Starting complete deletion...');
  
  // Delete in correct order due to foreign key constraints
  
  // 1. Delete applications first
  if (applications.length > 0) {
    const deletedApps = await prisma.application.deleteMany({
      where: { studentId: currentUser.studentId }
    });
    console.log(` Deleted ${deletedApps.count} applications`);
  }
  
  // 2. Delete student profile
  if (currentUser.student) {
    await prisma.student.delete({
      where: { id: currentUser.studentId }
    });
    console.log(` Deleted student profile: ${currentUser.student.name}`);
  }
  
  // 3. Delete user account
  await prisma.user.delete({
    where: { email: studentEmail }
  });
  console.log(` Deleted user account: ${studentEmail}`);
  
  // Verify deletion
  console.log('\n Verification - checking remaining data:');
  const remainingUser = await prisma.user.findUnique({ where: { email: studentEmail } });
  const remainingStudents = await prisma.student.count();
  const remainingApplications = await prisma.application.count();
  const totalUsers = await prisma.user.count();
  
  console.log(`User ${studentEmail}: ${remainingUser ? 'Still exists ' : 'Deleted '}`);
  console.log(`Total users remaining: ${totalUsers}`);
  console.log(`Total students remaining: ${remainingStudents}`);
  console.log(`Total applications remaining: ${remainingApplications}`);
  
  await prisma.$disconnect();
  console.log('\n Complete student deletion successful');
  
} catch (error) {
  console.error(' Error:', error.message);
  process.exit(1);
}