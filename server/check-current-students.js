// check-current-students.js
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

console.log('📊 CHECKING CURRENT STUDENTS/APPLICANTS IN DATABASE\n');

try {
  await prisma.$connect();
  
  // Count all users by role
  console.log('👥 USER COUNTS BY ROLE:');
  console.log('='.repeat(50));
  
  const userCounts = await prisma.user.groupBy({
    by: ['role'],
    _count: {
      role: true,
    },
  });
  
  userCounts.forEach(count => {
    console.log(`${count.role}: ${count._count.role}`);
  });
  
  // Show all student users
  console.log('\n🎓 STUDENT USER ACCOUNTS:');
  console.log('='.repeat(50));
  
  const studentUsers = await prisma.user.findMany({
    where: { role: 'STUDENT' },
    select: {
      id: true,
      email: true,
      name: true,
      createdAt: true,
      studentId: true
    }
  });
  
  console.log(`Total student users: ${studentUsers.length}`);
  studentUsers.forEach((user, index) => {
    console.log(`${index + 1}. ${user.email} (${user.name || 'No name'})`);
    console.log(`   Student ID: ${user.studentId || 'None'}`);
    console.log(`   Created: ${user.createdAt.toISOString().split('T')[0]}`);
    console.log('');
  });
  
  // Show student profiles
  console.log('📋 STUDENT PROFILES:');
  console.log('='.repeat(50));
  
  const studentProfiles = await prisma.student.findMany({
    select: {
      id: true,
      name: true,
      email: true,
      university: true,
      program: true,
      gpa: true,
      createdAt: true
    }
  });
  
  console.log(`Total student profiles: ${studentProfiles.length}`);
  studentProfiles.forEach((student, index) => {
    console.log(`${index + 1}. ${student.name} (${student.email})`);
    console.log(`   University: ${student.university || 'Not set'}`);
    console.log(`   Program: ${student.program || 'Not set'}`);
    console.log(`   CGPA: ${student.gpa || 'Not set'}`);
    console.log(`   Created: ${student.createdAt.toISOString().split('T')[0]}`);
    console.log('');
  });
  
  // Show applications
  console.log('📄 APPLICATION RECORDS:');
  console.log('='.repeat(50));
  
  const applications = await prisma.application.findMany({
    select: {
      id: true,
      studentId: true,
      status: true,
      amount: true,
      currency: true,
      submittedAt: true,
      student: {
        select: {
          name: true,
          email: true
        }
      }
    }
  });
  
  console.log(`Total applications: ${applications.length}`);
  if (applications.length === 0) {
    console.log('   No applications found in database');
  } else {
    applications.forEach((app, index) => {
      console.log(`${index + 1}. Student: ${app.student?.name} (${app.student?.email})`);
      console.log(`   Status: ${app.status}`);
      console.log(`   Amount: ${app.amount} ${app.currency}`);
      console.log(`   Submitted: ${app.submittedAt.toISOString().split('T')[0]}`);
      console.log('');
    });
  }
  
  // Summary counts
  console.log('📈 SUMMARY:');
  console.log('='.repeat(50));
  
  const totalUsers = await prisma.user.count();
  const totalStudentUsers = await prisma.user.count({ where: { role: 'STUDENT' } });
  const totalStudentProfiles = await prisma.student.count();
  const totalApplications = await prisma.application.count();
  
  console.log(`Total Users: ${totalUsers}`);
  console.log(`Student Users: ${totalStudentUsers}`);
  console.log(`Student Profiles: ${totalStudentProfiles}`);
  console.log(`Applications: ${totalApplications}`);
  
  await prisma.$disconnect();
  console.log('\n✅ Student check completed');
  
} catch (error) {
  console.error('❌ Error:', error.message);
  process.exit(1);
}