import { PrismaClient } from '@prisma/client';

async function checkStudents() {
  const prisma = new PrismaClient();
  try {
    const students = await prisma.student.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        guardianName: true,
        guardian2Name: true,
        guardianPhone1: true,
        guardianPhone2: true,
        createdAt: true
      }
    });
    
    console.log(`Total students: ${students.length}`);
    students.forEach((s, i) => {
      console.log(`${i+1}. ${s.name || 'No name'} (${s.email || 'No email'})`);
      console.log(`   Guardian: ${s.guardianName || 'N/A'}`);
      console.log(`   Guardian2: ${s.guardian2Name || 'N/A'}`);
      console.log(`   Guardian Phone 1: ${s.guardianPhone1 || 'N/A'}`);
      console.log(`   Guardian Phone 2: ${s.guardianPhone2 || 'N/A'}`);
      console.log(`   Created: ${s.createdAt}`);
      console.log('');
    });
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkStudents();