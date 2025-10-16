import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function fixSaraCurrency() {
  try {
    // Get Sara's approved application
    const application = await prisma.application.findFirst({
      where: {
        student: {
          id: 'cmgkwiuqb0000eb8wm0dd2nfh' // Sara Khan
        },
        status: 'APPROVED'
      }
    });
    
    if (application) {
      console.log('📋 Current application data:');
      console.log('  ID:', application.id);
      console.log('  Currency:', application.currency);
      console.log('  University:', application.university);
      console.log('  needUSD:', application.needUSD);
      console.log('  needPKR:', application.needPKR);
      
      // Erasmus University Rotterdam is in Netherlands, which uses EUR
      // But for simplicity, since needUSD is set, let's use USD
      console.log('\n🔧 Updating application currency to USD...');
      
      const updated = await prisma.application.update({
        where: { id: application.id },
        data: {
          currency: 'USD'
        }
      });
      
      console.log('✅ Updated application currency to:', updated.currency);
      
    } else {
      console.log('❌ No approved application found for Sara');
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

fixSaraCurrency();