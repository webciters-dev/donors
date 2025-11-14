import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

(async () => {
  try {
    const apps = await prisma.application.findMany({
      include: {
        student: {
          select: {
            name: true,
            email: true,
            university: true,
            program: true
          }
        }
      },
      orderBy: {
        submittedAt: 'desc'
      }
    });
    
    console.log('All applications in database:');
    apps.forEach((app, i) => {
      console.log(`${i+1}. Application ID: ${app.id}`);
      console.log(`   Student: ${app.student?.name} (${app.student?.email})`);
      console.log(`   University: ${app.student?.university}`);
      console.log(`   Program: ${app.student?.program}`);
      console.log(`   Status: ${app.status}`);
      console.log(`   Term: ${app.term}`);
      console.log(`   Amount: ${app.amount} ${app.currency}`);
      console.log(`   Submitted: ${app.submittedAt}`);
      console.log(`   Created: ${app.createdAt}`);
      console.log('---');
    });
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
})();