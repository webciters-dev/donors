const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkAdmin() {
  try {
    const admin = await prisma.user.findFirst({ where: { email: 'admin@awake.com' } });
    console.log('Admin user:', admin ? 'Found' : 'Not found');
    if (admin) {
      console.log('Email:', admin.email);
      console.log('Name:', admin.name || 'No name set');
      console.log('Role:', admin.role);
    }
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

checkAdmin();