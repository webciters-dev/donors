// fix-degree-level.js
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

console.log('🔧 FIXING DEGREE LEVEL FOR STUDENT\n');

const studentEmail = 'test+1@webciters.com';
const correctDegreeLevel = "Bachelor's Degree"; // BS program = Bachelor's Degree

try {
  await prisma.$connect();
  
  console.log(`Updating degreeLevel to "${correctDegreeLevel}" for ${studentEmail}...`);
  
  const updatedStudent = await prisma.student.update({
    where: { email: studentEmail },
    data: { degreeLevel: correctDegreeLevel },
    select: {
      name: true,
      email: true,
      university: true,
      degreeLevel: true,
      field: true,
      program: true,
      gpa: true
    }
  });
  
  console.log('✅ Student updated successfully:');
  console.log('   Name:', updatedStudent.name);
  console.log('   University:', updatedStudent.university);
  console.log('   Field:', updatedStudent.field);
  console.log('   Program:', updatedStudent.program);
  console.log('   🎯 Degree Level:', `"${updatedStudent.degreeLevel}"`);
  console.log('   CGPA:', updatedStudent.gpa);
  
  await prisma.$disconnect();
  console.log('\n✅ Fix completed - try logging in again!');
  
} catch (error) {
  console.error('❌ Error:', error);
  process.exit(1);
}