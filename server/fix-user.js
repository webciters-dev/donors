// fix-user.js - Fix the test+4 user account
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function fixUser() {
  try {
    const updated = await prisma.user.update({
      where: { email: 'test+4@webciters.com' },
      data: { name: 'Sarah Khan' }
    });
    
    console.log('✅ User fixed successfully:', updated);
    
  } catch (error) {
    console.error('❌ Error fixing user:', error);
  } finally {
    await prisma.$disconnect();
  }
}

fixUser();