// check-degree-level.js
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

console.log(' CHECKING DEGREE LEVEL FIELD\n');

const testEmail = 'test+1@webciters.com';

try {
  await prisma.$connect();
  
  const student = await prisma.student.findUnique({
    where: { email: testEmail },
    select: {
      name: true,
      email: true,
      degreeLevel: true,
      university: true,
      field: true,
      program: true,
      gpa: true
    }
  });
  
  if (student) {
    console.log(' Student found:');
    console.log('   Name:', student.name);
    console.log('   Email:', student.email);
    console.log('   University:', student.university);
    console.log('   Field:', student.field);
    console.log('   Program:', student.program);
    console.log('   CGPA:', student.gpa);
    console.log('    Degree Level:', `"${student.degreeLevel}"`);
    console.log('    Degree Level type:', typeof student.degreeLevel);
    console.log('    Degree Level length:', student.degreeLevel?.length);
    console.log('    Is empty string?:', student.degreeLevel === '');
    console.log('    Is null?:', student.degreeLevel === null);
    console.log('    Is undefined?:', student.degreeLevel === undefined);
  } else {
    console.log(' Student not found');
  }
  
  await prisma.$disconnect();
  console.log('\n Check completed');
  
} catch (error) {
  console.error(' Error:', error);
  process.exit(1);
}