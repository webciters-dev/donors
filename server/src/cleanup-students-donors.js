// server/src/cleanup-students-donors.js
// Script to clean up student and donor data while preserving admin/field officer accounts

import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';

dotenv.config();

const prisma = new PrismaClient();

async function cleanupStudentsAndDonors() {
  console.log('🧹 Starting cleanup of student and donor data...');

  try {
    await prisma.$transaction(async (tx) => {
      // 1. Delete in correct order due to foreign key constraints
      
      console.log('📄 Deleting field reviews...');
      await tx.fieldReview.deleteMany({});
      
      console.log('📄 Deleting documents...');
      await tx.document.deleteMany({});
      
      console.log('💬 Deleting messages...');
      await tx.message.deleteMany({});
      
      console.log('💰 Deleting disbursements...');
      await tx.disbursement.deleteMany({});
      
      console.log('🤝 Deleting sponsorships...');
      await tx.sponsorship.deleteMany({});
      
      console.log('📋 Deleting applications...');
      await tx.application.deleteMany({});
      
      console.log('👨‍🎓 Deleting students...');
      await tx.student.deleteMany({});
      
      console.log('❤️ Deleting donors...');
      await tx.donor.deleteMany({});
      
      console.log('👤 Deleting student and donor user accounts...');
      await tx.user.deleteMany({
        where: {
          role: {
            in: ['STUDENT', 'DONOR']
          }
        }
      });
      
      console.log('💱 Keeping FX rates (may be needed for new transactions)');
      // Keep FxRate records
      
      console.log('🔐 Keeping admin and field officer accounts');
      // Keep ADMIN and FIELD_OFFICER users
      
      console.log('🔑 Deleting password reset tokens for deleted users');
      // PasswordReset tokens for deleted users will be cleaned up automatically due to CASCADE
    });

    console.log('✅ Cleanup completed successfully!');
    console.log('');
    console.log('📊 Remaining data:');
    
    const remainingUsers = await prisma.user.count();
    const remainingAdmins = await prisma.user.count({ where: { role: 'ADMIN' } });
    const remainingOfficers = await prisma.user.count({ where: { role: 'FIELD_OFFICER' } });
    
    console.log(`   Users: ${remainingUsers} (${remainingAdmins} admins, ${remainingOfficers} officers)`);
    console.log(`   Students: ${await prisma.student.count()}`);
    console.log(`   Donors: ${await prisma.donor.count()}`);
    console.log(`   Applications: ${await prisma.application.count()}`);
    console.log(`   Sponsorships: ${await prisma.sponsorship.count()}`);
    
    console.log('');
    console.log('🚀 Ready for fresh student and donor registrations!');
    console.log('');
    console.log('Next steps:');
    console.log('1. Students can register and create applications');
    console.log('2. Admins can approve student applications');
    console.log('3. Donors can register and browse approved students');
    console.log('4. Donors can sponsor students through the portal');

  } catch (error) {
    console.error('❌ Cleanup failed:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the cleanup
cleanupStudentsAndDonors()
  .catch((e) => {
    console.error('❌ Script failed:', e);
    process.exit(1);
  });