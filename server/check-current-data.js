// check-current-data.js
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

console.log('🔍 Checking current database and its data...');

try {
  await prisma.$connect();
  
  // Get all users to see what we have
  const users = await prisma.user.findMany({
    select: {
      id: true,
      email: true,
      role: true,
      name: true,
      createdAt: true,
      studentId: true,
      donorId: true
    }
  });
  
  console.log('👥 All users in current database:');
  users.forEach((user, index) => {
    console.log(`${index + 1}. ${user.email} (${user.role}) - Created: ${user.createdAt.toISOString().split('T')[0]}`);
    if (user.studentId) console.log(`   -> Linked to student: ${user.studentId}`);
    if (user.donorId) console.log(`   -> Linked to donor: ${user.donorId}`);
  });
  
  // Get donors
  const donors = await prisma.donor.findMany({
    select: {
      id: true,
      name: true,
      email: true,
      organization: true,
      createdAt: true
    }
  });
  
  console.log('\n💰 All donors:');
  donors.forEach((donor, index) => {
    console.log(`${index + 1}. ${donor.name} (${donor.email}) - ${donor.organization || 'No org'}`);
  });

  // Get students
  const students = await prisma.student.findMany({
    select: {
      id: true,
      name: true,
      email: true,
      university: true,
      createdAt: true
    }
  });
  
  console.log('\n🎓 All students:');
  students.forEach((student, index) => {
    console.log(`${index + 1}. ${student.name} (${student.email}) - ${student.university}`);
  });

  // Get applications
  const applications = await prisma.application.findMany({
    select: {
      id: true,
      student: {
        select: {
          name: true,
          email: true
        }
      },
      status: true,
      amount: true,
      currency: true,
      submittedAt: true
    }
  });
  
  console.log('\n📝 All applications:');
  applications.forEach((app, index) => {
    console.log(`${index + 1}. ${app.student.name} - ${app.status} - ${app.amount} ${app.currency}`);
  });
  
  await prisma.$disconnect();
  console.log('\n✅ Database check completed');
} catch (error) {
  console.error('❌ Error:', error.message);
  process.exit(1);
}