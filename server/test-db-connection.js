// Test database connection
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function testConnection() {
  try {
    const userCount = await prisma.user.count();
    console.log('✅ Database connection successful');
    console.log('User count:', userCount);
  } catch (error) {
    console.error('❌ Database connection failed:');
    console.error(error.message);
  } finally {
    await prisma.$disconnect();
  }
}

testConnection();