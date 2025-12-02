import prisma from './src/prismaClient.js';

async function checkNeedUSD() {
  console.log(' Checking needUSD values...\n');
  
  const students = await prisma.student.findMany({
    include: {
      applications: {
        where: { status: 'APPROVED' },
        select: { id: true, needUSD: true, amount: true, currency: true, status: true, submittedAt: true }
      }
    }
  });
  
  students.forEach(s => {
    console.log(`${s.name}:`);
    console.log(`  Student needUSD field: ${s.needUSD}`);
    console.log(`  Applications (${s.applications.length}):`);
    s.applications.forEach((app, i) => {
      console.log(`    ${i + 1}. ID: ${app.id}`);
      console.log(`       needUSD: ${app.needUSD}`);
      console.log(`       amount: ${app.amount}`);
      console.log(`       currency: ${app.currency}`);
      console.log(`       status: ${app.status}`);
      console.log(`       submitted: ${app.submittedAt}`);
    });
    console.log('');
  });
  
  await prisma.$disconnect();
}

checkNeedUSD().catch(console.error);