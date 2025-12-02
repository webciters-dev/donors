// debug-student-api.js
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

console.log(' DEBUGGING STUDENT API ENDPOINT\n');

const testEmail = 'test+1@webciters.com'; // The "Another student" from screenshot

try {
  await prisma.$connect();
  
  // First, find the user
  const user = await prisma.user.findUnique({
    where: { email: testEmail },
    include: {
      student: true
    }
  });
  
  if (!user) {
    console.log(' User not found:', testEmail);
    process.exit(1);
  }
  
  console.log(' User found:');
  console.log('   Email:', user.email);
  console.log('   Student ID:', user.studentId);
  console.log('   Has student profile:', !!user.student);
  
  if (user.student) {
    console.log('\n Student Profile:');
    console.log('   Name:', user.student.name);
    console.log('   Email:', user.student.email);
    console.log('   Country:', user.student.country);
    console.log('   University:', user.student.university);
    console.log('   Degree Level:', user.student.degreeLevel);
    console.log('   Field:', user.student.field);
    console.log('   Program:', user.student.program);
    console.log('   CGPA:', user.student.gpa);
  }
  
  // Now test the actual API endpoint query
  console.log('\n Testing /api/students/me endpoint query:');
  
  const studentData = await prisma.student.findUnique({
    where: { id: user.studentId }
  });
  
  if (studentData) {
    console.log(' Student data found via API query:');
    console.log(JSON.stringify(studentData, null, 2));
  } else {
    console.log(' Student data NOT found via API query');
  }
  
  await prisma.$disconnect();
  console.log('\n Debug completed');
  
} catch (error) {
  console.error(' Error:', error);
  process.exit(1);
}