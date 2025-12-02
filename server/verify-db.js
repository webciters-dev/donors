import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function verify() {
  try {
    console.log(' Database verification:');
    console.log('========================');
    
    const users = await prisma.user.findMany({
      select: { email: true, role: true, name: true }
    });
    const appCount = await prisma.application.count();
    
    console.log('\\n Users (' + users.length + ' total):');
    users.forEach(user => {
      console.log('   ' + user.email + ' (' + user.role + ') - ' + (user.name || 'No name'));
    });
    
    console.log('\\n Applications: ' + appCount);
    
    console.log('\\n Database cleanup complete!');
    console.log(' Login with: admin@awake.com / Admin@123');
    
    await prisma.$disconnect();
  } catch (error) {
    console.error(' Error:', error.message);
    await prisma.$disconnect();
  }
}

verify();
