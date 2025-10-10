// remove-test-users.js - Remove specific test users from database
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function removeTestUsers() {
  const testEmails = [
    'test+4@webciters.com',
    'test+5@webciters.com', 
    'test+6@webciters.com'
  ];

  try {
    console.log('🗑️  Removing test users...');
    
    for (const email of testEmails) {
      console.log(`\nRemoving user: ${email}`);
      
      // Find the user first
      const user = await prisma.user.findUnique({
        where: { email },
        include: {
          student: {
            include: {
              applications: true,
              sponsorships: true,
              disbursements: true,
              messages: true,
              documents: true,
              fieldReviews: true
            }
          },
          donor: {
            include: {
              sponsorships: true
            }
          }
        }
      });

      if (!user) {
        console.log(`❌ User ${email} not found`);
        continue;
      }

      // If user has a student profile, clean up related data
      if (user.student) {
        const studentId = user.student.id;
        
        // Delete field reviews
        await prisma.fieldReview.deleteMany({
          where: { studentId }
        });
        
        // Delete messages
        await prisma.message.deleteMany({
          where: { studentId }
        });
        
        // Delete documents
        await prisma.document.deleteMany({
          where: { studentId }
        });
        
        // Delete sponsorships
        await prisma.sponsorship.deleteMany({
          where: { studentId }
        });
        
        // Delete disbursements
        await prisma.disbursement.deleteMany({
          where: { studentId }
        });
        
        // Delete applications
        await prisma.application.deleteMany({
          where: { studentId }
        });
        
        // Delete student record
        await prisma.student.delete({
          where: { id: studentId }
        });
        
        console.log(`✅ Deleted student profile and related data for ${email}`);
      }

      // If user has a donor profile, clean up related data
      if (user.donor) {
        const donorId = user.donor.id;
        
        // Delete sponsorships
        await prisma.sponsorship.deleteMany({
          where: { donorId }
        });
        
        // Delete donor record
        await prisma.donor.delete({
          where: { id: donorId }
        });
        
        console.log(`✅ Deleted donor profile and related data for ${email}`);
      }

      // Finally, delete the user
      await prisma.user.delete({
        where: { email }
      });
      
      console.log(`✅ Deleted user: ${email}`);
    }

    console.log('\n🎉 All test users removed successfully!');
    
  } catch (error) {
    console.error('❌ Error removing test users:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the cleanup
removeTestUsers();