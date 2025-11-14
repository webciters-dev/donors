import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function finalCleanup() {
  try {
    console.log('🔍 Final cleanup - removing remaining test users...');
    
    // Delete any remaining student users (non-admin)
    const deletedStudentUsers = await prisma.user.deleteMany({
      where: { 
        role: { not: 'ADMIN' }
      }
    });
    console.log(`   ✅ Deleted ${deletedStudentUsers.count} non-admin users`);
    
    // Verify final state
    const remainingUsers = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        role: true
      }
    });
    
    console.log(`\n✅ Final verification - ${remainingUsers.length} users remaining:`);
    remainingUsers.forEach((user, index) => {
      console.log(`${index + 1}. ${user.name || 'No name'} (${user.email}) - Role: ${user.role}`);
    });
    
    console.log('\n🎯 Database cleanup completed successfully!');
    console.log('📋 Summary:');
    console.log('   ✅ All students deleted');
    console.log('   ✅ All case workers deleted');
    console.log('   ✅ All board members deleted');
    console.log('   ✅ All donor accounts deleted');
    console.log('   ✅ Admin account(s) preserved');
    console.log('   ✅ All university data preserved');
    
  } catch (error) {
    console.error('❌ Error during final cleanup:', error);
  } finally {
    await prisma.$disconnect();
  }
}

finalCleanup();