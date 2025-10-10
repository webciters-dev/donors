// check-users.js - List all users in database
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
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    console.log('📊 Current users in database:');
    console.log('=====================================');
    
    if (users.length === 0) {
      console.log('❌ No users found in database');
    } else {
      users.forEach((user, index) => {
        console.log(`${index + 1}. ${user.name} (${user.email}) - ${user.role}`);
        console.log(`   ID: ${user.id}`);
        console.log(`   Created: ${user.createdAt.toISOString()}`);
        console.log('');
      });
    }
    
    console.log(`Total users: ${users.length}`);
    
  } catch (error) {
    console.error('❌ Error checking users:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkUsers();