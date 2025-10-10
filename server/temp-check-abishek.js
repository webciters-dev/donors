import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function checkAbishek() {
  try {
    const student = await prisma.student.findUnique({
      where: { id: 'cmgg82s5f0000jetmi4txodc7' },
      include: { applications: true }
    });
    
    console.log('=== ABISHEK SHARMA DATA ===');
    console.log('Student ID:', student.id);
    console.log('Name:', student.name);
    console.log('University:', student.university);
    console.log('Program:', student.program);
    console.log('Country:', student.country);
    console.log('needUSD:', student.needUSD);
    console.log('');
    console.log('Applications:', student.applications.length);
    if (student.applications.length > 0) {
      const app = student.applications[0];
      console.log('needUSD:', app.needUSD);
      console.log('needPKR:', app.needPKR);
      console.log('currency:', app.currency);
      console.log('amountOriginal:', app.amountOriginal);
      console.log('currencyOriginal:', app.currencyOriginal);
    }
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkAbishek();