// cleanup-users.js - Generic script to remove users by email
// Usage: node cleanup-users.js email1@domain.com email2@domain.com

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function cleanupUsers(emails) {
  if (!emails || emails.length === 0) {
    console.log('❌ No email addresses provided');
    console.log('Usage: node cleanup-users.js email1@domain.com email2@domain.com');
    return;
  }

  try {
    console.log('🗑️  Starting user cleanup...');
    
    for (const email of emails) {
      console.log(`\n🔍 Processing: ${email}`);
      
      const user = await prisma.user.findUnique({
        where: { email },
        include: {
          student: true,
          donor: true
        }
      });

      if (!user) {
        console.log(`❌ User ${email} not found in database`);
        continue;
      }

      // Clean up student data if exists
      if (user.student) {
        const studentId = user.student.id;
        console.log(`📚 Cleaning student data...`);
        
        // Delete in order of dependencies
        await prisma.fieldReview.deleteMany({ where: { studentId } });
        await prisma.message.deleteMany({ where: { studentId } });
        await prisma.document.deleteMany({ where: { studentId } });
        await prisma.sponsorship.deleteMany({ where: { studentId } });
        await prisma.disbursement.deleteMany({ where: { studentId } });
        await prisma.application.deleteMany({ where: { studentId } });
        await prisma.student.delete({ where: { id: studentId } });
      }

      // Clean up donor data if exists
      if (user.donor) {
        const donorId = user.donor.id;
        console.log(`💰 Cleaning donor data...`);
        
        await prisma.sponsorship.deleteMany({ where: { donorId } });
        await prisma.donor.delete({ where: { id: donorId } });
      }

      // Delete the user account
      await prisma.user.delete({ where: { email } });
      console.log(`✅ Successfully removed: ${email}`);
    }

    console.log('\n🎉 Cleanup completed successfully!');
    
  } catch (error) {
    console.error('❌ Error during cleanup:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Get email addresses from command line arguments
const emailsToCleanup = process.argv.slice(2);
cleanupUsers(emailsToCleanup);