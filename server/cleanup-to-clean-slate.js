// cleanup-to-clean-slate.js
// This script removes ALL data except admin users for a fresh start

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🧹 Starting complete database cleanup...');
  console.log('⚠️  This will remove ALL data except admin users');
  
  try {
    // Delete in correct order to respect foreign key constraints
    console.log('🗑️ Deleting disbursements...');
    await prisma.disbursement.deleteMany();
    
    console.log('🗑️ Deleting sponsorships...');
    await prisma.sponsorship.deleteMany();
    
    console.log('🗑️ Deleting field reviews...');
    await prisma.fieldReview.deleteMany();
    
    console.log('🗑️ Deleting documents...');
    await prisma.document.deleteMany();
    
    console.log('🗑️ Deleting messages...');
    await prisma.message.deleteMany();
    
    console.log('🗑️ Deleting applications...');
    await prisma.application.deleteMany();
    
    console.log('🗑️ Deleting students...');
    await prisma.student.deleteMany();
    
    console.log('🗑️ Deleting donors...');
    await prisma.donor.deleteMany();
    
    // Delete non-admin users (keep only admin)
    console.log('🗑️ Deleting non-admin users...');
    const deletedUsers = await prisma.user.deleteMany({
      where: {
        role: {
          not: 'ADMIN'
        }
      }
    });
    
    console.log('✅ Cleanup completed successfully!');
    console.log('📊 Summary:');
    console.log('   - All students removed');
    console.log('   - All applications removed');
    console.log('   - All donors removed');
    console.log('   - All sponsorships removed');
    console.log('   - All disbursements removed');
    console.log('   - All field reviews removed');
    console.log('   - All documents removed');
    console.log('   - All messages removed');
    console.log(`   - ${deletedUsers.count} non-admin users removed`);
    console.log('   - ✅ Admin users preserved');
    console.log('');
    console.log('🎉 Database is now clean and ready for fresh data!');
    
    // Show remaining admin users
    const remainingAdmins = await prisma.user.findMany({
      where: { role: 'ADMIN' },
      select: { email: true, role: true }
    });
    
    console.log('👑 Remaining admin users:');
    remainingAdmins.forEach(admin => {
      console.log(`   - ${admin.email} (${admin.role})`);
    });
    
  } catch (error) {
    console.error('❌ Error during cleanup:', error);
    throw error;
  }
}

main()
  .catch((e) => {
    console.error('❌ Fatal error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });