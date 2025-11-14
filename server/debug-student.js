import { PrismaClient } from '@prisma/client';

async function checkStudent() {
  const prisma = new PrismaClient();
  
  try {
    const student = await prisma.student.findFirst({
      where: { email: 'test+12@webciters.com' },
      select: { 
        id: true,
        name: true, 
        email: true, 
        degreeLevel: true, 
        field: true, 
        program: true, 
        university: true,
        country: true 
      }
    });
    
    console.log('=== DATABASE STUDENT DATA ===');
    console.log(JSON.stringify(student, null, 2));
    
    if (student) {
      console.log('\n=== FIELD ANALYSIS ===');
      console.log('degreeLevel:', `"${student.degreeLevel}"`, 'type:', typeof student.degreeLevel);
      console.log('field:', `"${student.field}"`, 'type:', typeof student.field);
      console.log('program:', `"${student.program}"`, 'type:', typeof student.program);
      console.log('university:', `"${student.university}"`, 'type:', typeof student.university);
    }
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkStudent();