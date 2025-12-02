// Clean database - Remove donors, students, case workers, board members
// Preserve: Universities, Programs, Super Admin, Admins
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function cleanDatabase() {
  try {
    console.log(' Starting database cleanup...\n');

    // Step 1: Delete all conversations and messages
    console.log(' Deleting conversations and messages...');
    const deletedConversationMessages = await prisma.conversationMessage.deleteMany({});
    console.log(`    Deleted ${deletedConversationMessages.count} conversation messages`);
    
    const deletedConversations = await prisma.conversation.deleteMany({});
    console.log(`    Deleted ${deletedConversations.count} conversations`);
    
    const deletedMessages = await prisma.message.deleteMany({});
    console.log(`    Deleted ${deletedMessages.count} legacy messages`);

    // Step 2: Delete all sponsorships and disbursements
    console.log('\n Deleting sponsorships and disbursements...');
    const deletedDisbursements = await prisma.disbursement.deleteMany({});
    console.log(`    Deleted ${deletedDisbursements.count} disbursements`);
    
    const deletedSponsorships = await prisma.sponsorship.deleteMany({});
    console.log(`    Deleted ${deletedSponsorships.count} sponsorships`);

    // Step 3: Delete all interviews and board member data
    console.log('\n‍ Deleting interviews and board member data...');
    const deletedDecisions = await prisma.interviewDecision.deleteMany({});
    console.log(`    Deleted ${deletedDecisions.count} interview decisions`);
    
    const deletedPanelMembers = await prisma.interviewPanelMember.deleteMany({});
    console.log(`    Deleted ${deletedPanelMembers.count} panel members`);
    
    const deletedInterviews = await prisma.interview.deleteMany({});
    console.log(`    Deleted ${deletedInterviews.count} interviews`);
    
    const deletedBoardMembers = await prisma.boardMember.deleteMany({});
    console.log(`    Deleted ${deletedBoardMembers.count} board members`);

    // Step 4: Delete all field reviews
    console.log('\n️ Deleting field reviews...');
    const deletedFieldReviews = await prisma.fieldReview.deleteMany({});
    console.log(`    Deleted ${deletedFieldReviews.count} field reviews`);

    // Step 5: Delete all applications and documents
    console.log('\n Deleting applications and documents...');
    const deletedDocuments = await prisma.document.deleteMany({});
    console.log(`    Deleted ${deletedDocuments.count} documents`);
    
    const deletedApplications = await prisma.application.deleteMany({});
    console.log(`    Deleted ${deletedApplications.count} applications`);

    // Step 6: Delete all progress updates and reports
    console.log('\n Deleting progress updates...');
    const deletedProgressReports = await prisma.progressReport.deleteMany({});
    console.log(`    Deleted ${deletedProgressReports.count} progress reports`);
    
    const deletedProgressUpdates = await prisma.studentProgress.deleteMany({});
    console.log(`    Deleted ${deletedProgressUpdates.count} student progress updates`);

    // Step 7: Delete all students
    console.log('\n Deleting students...');
    const deletedStudents = await prisma.student.deleteMany({});
    console.log(`    Deleted ${deletedStudents.count} students`);

    // Step 8: Delete all donors
    console.log('\n Deleting donors...');
    const deletedDonors = await prisma.donor.deleteMany({});
    console.log(`    Deleted ${deletedDonors.count} donors`);

    // Step 9: Delete users with roles: DONOR, STUDENT, SUB_ADMIN, CASE_WORKER
    console.log('\n Deleting non-admin users...');
    const deletedUsers = await prisma.user.deleteMany({
      where: {
        role: {
          in: ['DONOR', 'STUDENT', 'SUB_ADMIN', 'CASE_WORKER']
        }
      }
    });
    console.log(`    Deleted ${deletedUsers.count} user accounts (donors, students, case workers)`);

    // Step 10: Show what remains
    console.log('\n Remaining data in database:');
    
    const remainingUsers = await prisma.user.count();
    const remainingAdmins = await prisma.user.count({ where: { role: 'ADMIN' } });
    const remainingSuperAdmins = await prisma.user.count({ where: { role: 'SUPER_ADMIN' } });
    const remainingUniversities = await prisma.university.count();
    const remainingPrograms = await prisma.universityProgram.count();
    const remainingFields = await prisma.universityField.count();
    const remainingDegreeLevels = await prisma.universityDegreeLevel.count();
    
    console.log(`    Users: ${remainingUsers} (${remainingSuperAdmins} Super Admin, ${remainingAdmins} Admin)`);
    console.log(`    Universities: ${remainingUniversities}`);
    console.log(`    Programs: ${remainingPrograms}`);
    console.log(`    Fields: ${remainingFields}`);
    console.log(`    Degree Levels: ${remainingDegreeLevels}`);

    // List remaining admin accounts
    console.log('\n Preserved Admin Accounts:');
    const adminAccounts = await prisma.user.findMany({
      where: {
        role: {
          in: ['ADMIN', 'SUPER_ADMIN']
        }
      },
      select: {
        email: true,
        role: true,
        name: true
      }
    });
    
    adminAccounts.forEach(admin => {
      console.log(`    ${admin.role}: ${admin.email} (${admin.name || 'No name'})`);
    });

    console.log('\n Database cleanup completed successfully!');
    console.log(' Summary: Removed all donors, students, case workers, and board members');
    console.log(' Preserved: Universities, Programs, Super Admin, and Admin accounts\n');

  } catch (error) {
    console.error('\n Error during cleanup:', error.message);
    console.error(error);
  } finally {
    await prisma.$disconnect();
  }
}

cleanDatabase();
