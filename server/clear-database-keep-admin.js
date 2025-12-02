// Clear Database Script - Keep Only Admin Account
// Run with: node clear-database-keep-admin.js

import prisma from './src/prismaClient.js';
import bcrypt from 'bcrypt';

async function clearDatabaseKeepAdmin() {
  try {
    console.log('️  Starting database cleanup...');
    
    // 1. Delete all sponsorships (has foreign keys)
    const deletedSponsorships = await prisma.sponsorship.deleteMany({});
    console.log(` Deleted ${deletedSponsorships.count} sponsorships`);
    
    // 2. Delete all progress reports and attachments
    const deletedProgressAttachments = await prisma.progressReportAttachment.deleteMany({});
    console.log(` Deleted ${deletedProgressAttachments.count} progress attachments`);
    
    const deletedProgressReports = await prisma.progressReport.deleteMany({});
    console.log(` Deleted ${deletedProgressReports.count} progress reports`);
    
    const deletedStudentProgress = await prisma.studentProgress.deleteMany({});
    console.log(` Deleted ${deletedStudentProgress.count} student progress records`);
    
    // 3. Delete all messages and conversations
    const deletedConversationMessages = await prisma.conversationMessage.deleteMany({});
    console.log(` Deleted ${deletedConversationMessages.count} conversation messages`);
    
    const deletedMessages = await prisma.message.deleteMany({});
    console.log(` Deleted ${deletedMessages.count} messages`);
    
    const deletedConversations = await prisma.conversation.deleteMany({});
    console.log(` Deleted ${deletedConversations.count} conversations`);
    
    // 4. Delete all disbursements and documents
    const deletedDisbursements = await prisma.disbursement.deleteMany({});
    console.log(` Deleted ${deletedDisbursements.count} disbursements`);
    
    const deletedDocuments = await prisma.document.deleteMany({});
    console.log(` Deleted ${deletedDocuments.count} documents`);
    
    const deletedFieldReviews = await prisma.fieldReview.deleteMany({});
    console.log(` Deleted ${deletedFieldReviews.count} field reviews`);
    
    // 5. Delete all applications
    const deletedApplications = await prisma.application.deleteMany({});
    console.log(` Deleted ${deletedApplications.count} applications`);
    
    // 6. Delete all students
    const deletedStudents = await prisma.student.deleteMany({});
    console.log(` Deleted ${deletedStudents.count} students`);
    
    // 7. Delete all donors
    const deletedDonors = await prisma.donor.deleteMany({});
    console.log(` Deleted ${deletedDonors.count} donors`);
    
    // 8. Clean up other tables
    const deletedPasswordResets = await prisma.passwordReset.deleteMany({});
    console.log(` Deleted ${deletedPasswordResets.count} password reset tokens`);
    
    // 9. Delete all users EXCEPT the main admin
    const deletedUsers = await prisma.user.deleteMany({
      where: {
        OR: [
          { email: { not: 'admin@awake.com' } },
          { role: { not: 'ADMIN' } }
        ]
      }
    });
    console.log(` Deleted ${deletedUsers.count} non-admin users`);
    
    // 10. Ensure admin account exists with correct credentials
    const hashedPassword = await bcrypt.hash('Admin@123', 10);
    
    const admin = await prisma.user.upsert({
      where: { email: 'admin@awake.com' },
      update: {
        passwordHash: hashedPassword,
        role: 'ADMIN',
        name: 'System Administrator'
      },
      create: {
        email: 'admin@awake.com',
        passwordHash: hashedPassword,
        role: 'ADMIN',
        name: 'System Administrator'
      }
    });
    
    console.log(' Admin account verified:', {
      id: admin.id,
      email: admin.email,
      role: admin.role,
      name: admin.name
    });
    
    // 11. Verify final state
    const remainingUsers = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        role: true,
        name: true
      }
    });
    
    console.log('\n Final database state:');
    console.log('Remaining users:', remainingUsers);
    
    const counts = await Promise.all([
      prisma.user.count(),
      prisma.student.count(),
      prisma.donor.count(),
      prisma.application.count(),
      prisma.sponsorship.count()
    ]);
    
    console.log('\n Record counts:');
    console.log(`- Users: ${counts[0]}`);
    console.log(`- Students: ${counts[1]}`);
    console.log(`- Donors: ${counts[2]}`);
    console.log(`- Applications: ${counts[3]}`);
    console.log(`- Sponsorships: ${counts[4]}`);
    
    console.log('\n Database cleanup completed successfully!');
    console.log(' Admin login: admin@awake.com / Admin@123');
    
  } catch (error) {
    console.error(' Error during database cleanup:', error);
  } finally {
    await prisma.$disconnect();
  }
}

clearDatabaseKeepAdmin();