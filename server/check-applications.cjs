const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkApplications() {
  try {
    const applications = await prisma.application.findMany({
      include: {
        student: {
          include: {
            User: true
          }
        }
      }
    });
    
    console.log(`Found ${applications.length} applications:`);
    applications.forEach(app => {
      console.log(`- App ID: ${app.id}`);
      console.log(`  Student: ${app.student.name} (${app.student.email})`);
      console.log(`  Status: ${app.status}`);
      console.log(`  Amount: ${app.currency || 'USD'} ${app.needPKR || app.needUSD}`);
      console.log(`  Submitted: ${app.submittedAt}`);
      console.log('---');
    });
    
    const users = await prisma.user.findMany({
      where: { role: { in: ['ADMIN', 'STUDENT'] } }
    });
    
    console.log(`\nFound ${users.length} users:`);
    users.forEach(user => {
      console.log(`- ${user.email} (${user.role})`);
    });
    
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

checkApplications();