import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function check() {
  try {
    const users = await prisma.user.count();
    const applications = await prisma.application.count();
    console.log('Current counts:');
    console.log('Users:', users);
    console.log('Applications:', applications);
    await prisma.$disconnect();
  } catch (error) {
    console.error('Error:', error.message);
    await prisma.$disconnect();
  }
}

check();
