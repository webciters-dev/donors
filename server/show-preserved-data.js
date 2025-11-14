// show-preserved-data.js
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

console.log('📊 SHOWING ALL PRESERVED DATA IN DATABASE\n');

try {
  await prisma.$connect();
  
  // Show all users
  console.log('👥 USERS (6 total):');
  console.log('='.repeat(70));
  
  const users = await prisma.user.findMany({
    select: {
      id: true,
      email: true,
      role: true,
      name: true,
      createdAt: true,
      studentId: true,
      donorId: true
    },
    orderBy: { createdAt: 'asc' }
  });
  
  users.forEach((user, index) => {
    console.log(`${index + 1}. ${user.email}`);
    console.log(`   Role: ${user.role}`);
    console.log(`   Name: ${user.name || 'Not set'}`);
    console.log(`   Created: ${user.createdAt.toISOString().split('T')[0]}`);
    console.log(`   Student ID: ${user.studentId || 'None'}`);
    console.log(`   Donor ID: ${user.donorId || 'None'}`);
    console.log('');
  });
  
  // Show all students
  console.log('🎓 STUDENTS (1 total):');
  console.log('='.repeat(70));
  
  const students = await prisma.student.findMany({
    select: {
      id: true,
      name: true,
      email: true,
      gender: true,
      university: true,
      program: true,
      field: true,
      degreeLevel: true,
      country: true,
      city: true,
      gpa: true,
      createdAt: true,
      photoUrl: true
    },
    orderBy: { createdAt: 'asc' }
  });
  
  students.forEach((student, index) => {
    console.log(`${index + 1}. ${student.name} (${student.email})`);
    console.log(`   Gender: ${student.gender || 'Not set'}`);
    console.log(`   University: ${student.university || 'Not set'}`);
    console.log(`   Program: ${student.program || 'Not set'}`);
    console.log(`   Field: ${student.field || 'Not set'}`);
    console.log(`   Degree Level: ${student.degreeLevel || 'Not set'}`);
    console.log(`   Country: ${student.country || 'Not set'}`);
    console.log(`   City: ${student.city || 'Not set'}`);
    console.log(`   GPA: ${student.gpa || 'Not set'}`);
    console.log(`   Photo: ${student.photoUrl ? 'Yes' : 'No'}`);
    console.log(`   Created: ${student.createdAt.toISOString().split('T')[0]}`);
    console.log('');
  });
  
  // Show all donors
  console.log('💰 DONORS (3 total):');
  console.log('='.repeat(70));
  
  const donors = await prisma.donor.findMany({
    select: {
      id: true,
      name: true,
      email: true,
      organization: true,
      country: true,
      phone: true,
      totalFunded: true,
      createdAt: true
    },
    orderBy: { createdAt: 'asc' }
  });
  
  donors.forEach((donor, index) => {
    console.log(`${index + 1}. ${donor.name} (${donor.email})`);
    console.log(`   Organization: ${donor.organization || 'None'}`);
    console.log(`   Country: ${donor.country || 'Not set'}`);
    console.log(`   Phone: ${donor.phone || 'Not set'}`);
    console.log(`   Total Funded: $${donor.totalFunded}`);
    console.log(`   Created: ${donor.createdAt.toISOString().split('T')[0]}`);
    console.log('');
  });
  
  // Show summary counts
  console.log('📈 SUMMARY:');
  console.log('='.repeat(70));
  
  const counts = {
    users: await prisma.user.count(),
    students: await prisma.student.count(),
    donors: await prisma.donor.count(),
    applications: await prisma.application.count(),
    sponsorships: await prisma.sponsorship.count(),
    universities: await prisma.university.count(),
    boardMembers: await prisma.boardMember.count()
  };
  
  Object.entries(counts).forEach(([table, count]) => {
    const tableName = table.charAt(0).toUpperCase() + table.slice(1);
    console.log(`${tableName}: ${count}`);
  });
  
  await prisma.$disconnect();
  console.log('\n✅ Data display completed');
  
} catch (error) {
  console.error('❌ Error:', error.message);
  process.exit(1);
}