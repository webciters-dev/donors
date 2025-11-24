// Check all users in local database
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkUsers() {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true
      }
    });

    console.log(`\n📊 Total users in local database: ${users.length}\n`);
    
    if (users.length === 0) {
      console.log('❌ No users found in database');
    } else {
      users.forEach((user, index) => {
        console.log(`${index + 1}. ${user.role} - ${user.email}`);
        console.log(`   Name: ${user.name || 'Not set'}`);
        console.log(`   Created: ${user.createdAt}`);
        console.log('');
      });
    }
  } catch (error) {
    console.error('❌ Failed to check users:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

checkUsers();
