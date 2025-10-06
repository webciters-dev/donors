const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function cleanup() {
  try {
    // Delete user first (due to foreign key constraints)
    await prisma.user.deleteMany({
      where: { email: 'student.test@example.com' }
    });
    
    // Then delete student
    await prisma.student.deleteMany({
      where: { email: 'student.test@example.com' }
    });
    
    console.log('✅ Cleaned up existing test student');
  } catch (error) {
    console.error('❌ Cleanup error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

cleanup();