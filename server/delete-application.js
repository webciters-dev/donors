import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

(async () => {
  try {
    console.log('Deleting application ID: cmhyktezd000413thlg9e5ihh');
    
    const result = await prisma.application.delete({
      where: {
        id: 'cmhyktezd000413thlg9e5ihh'
      }
    });
    
    console.log('✅ Application deleted successfully!');
    console.log('   ID:', result.id);
    console.log('   Status was:', result.status);
    console.log('   Term was:', result.term);
    console.log('   Amount was:', result.amount, result.currency);
    
    // Verify remaining applications
    const remaining = await prisma.application.findMany({
      include: {
        student: {
          select: {
            name: true,
            email: true
          }
        }
      }
    });
    
    console.log('\nRemaining applications:');
    remaining.forEach((app, i) => {
      console.log(`${i+1}. ${app.student?.name} - ${app.status} - ${app.amount} ${app.currency} - ${app.term}`);
    });
    
  } catch (error) {
    console.error('❌ Error deleting application:', error.message);
  } finally {
    await prisma.$disconnect();
  }
})();