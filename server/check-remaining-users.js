import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkRemainingUsers() {
  try {
    console.log('👥 Checking remaining users...');
    
    const users = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true
      }
    });
    
    console.log(`\n📋 Found ${users.length} remaining users:`);
    users.forEach((user, index) => {
      console.log(`${index + 1}. ${user.name || 'No name'} (${user.email}) - Role: ${user.role}`);
      console.log(`   ID: ${user.id} | Created: ${user.createdAt.toLocaleDateString()}`);
    });
    
    // Also check university count
    const universityCount = await prisma.university.count();
    console.log(`\n🏛️  Universities preserved: ${universityCount}`);
    
    // Check if there are any academic data
    const degreeLevelCount = await prisma.degreeLevel.count();
    const fieldCount = await prisma.field.count();
    const programCount = await prisma.program.count();
    
    console.log(`📚 Academic data preserved:`);
    console.log(`   Degree Levels: ${degreeLevelCount}`);
    console.log(`   Fields: ${fieldCount}`);
    console.log(`   Programs: ${programCount}`);
    
  } catch (error) {
    console.error('❌ Error checking users:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkRemainingUsers();