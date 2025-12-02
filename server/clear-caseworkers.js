import { PrismaClient } from '@prisma/client';

async function clearCaseWorkers() {
  const prisma = new PrismaClient();
  
  try {
    console.log(' Starting case worker cleanup...');
    
    // First, get counts before deletion
    const subAdminCount = await prisma.user.count({ where: { role: 'SUB_ADMIN' } });
    const caseWorkerCount = await prisma.user.count({ where: { role: 'CASE_WORKER' } });
    const totalCount = subAdminCount + caseWorkerCount;
    
    console.log(' Current counts:');
    console.log(`   Sub Admins (legacy): ${subAdminCount}`);
    console.log(`   Case Workers: ${caseWorkerCount}`);
    console.log(`   Total: ${totalCount}`);
    
    if (totalCount === 0) {
      console.log(' No case workers found in database!');
      return;
    }
    
    console.log('\n️ Clearing case workers...');
    
    // Delete sub admin users (legacy case workers)
    const deletedSubAdmins = await prisma.user.deleteMany({
      where: { role: 'SUB_ADMIN' }
    });
    console.log(`    Deleted ${deletedSubAdmins.count} sub admins (legacy case workers)`);
    
    // Delete case worker users
    const deletedCaseWorkers = await prisma.user.deleteMany({
      where: { role: 'CASE_WORKER' }
    });
    console.log(`    Deleted ${deletedCaseWorkers.count} case workers`);
    
    console.log('\n Case worker cleanup complete!');
    console.log(' Final counts:');
    
    const finalSubAdminCount = await prisma.user.count({ where: { role: 'SUB_ADMIN' } });
    const finalCaseWorkerCount = await prisma.user.count({ where: { role: 'CASE_WORKER' } });
    const finalTotal = finalSubAdminCount + finalCaseWorkerCount;
    console.log(`   Sub Admins (legacy): ${finalSubAdminCount}`);
    console.log(`   Case Workers: ${finalCaseWorkerCount}`);
    console.log(`   Total: ${finalTotal}`);
    
    if (finalTotal === 0) {
      console.log(' All case workers successfully removed!');
    } else {
      console.log('️ Some case workers may remain - check manually');
    }
    
  } catch (error) {
    console.error(' Error during case worker cleanup:', error);
  } finally {
    await prisma.$disconnect();
  }
}

clearCaseWorkers();