import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function cleanupDatabase() {
  try {
    console.log('🔍 Starting comprehensive database cleanup...');
    
    // Check current database status
    const studentCount = await prisma.student.count();
    const caseWorkerCount = await prisma.user.count({
      where: { role: 'SUB_ADMIN' }
    });
    const boardMemberCount = await prisma.boardMember.count();
    const adminCount = await prisma.user.count({
      where: { role: 'ADMIN' }
    });
    const universityCount = await prisma.university.count();
    
    console.log('📊 Current database status:');
    console.log(`   Students: ${studentCount}`);
    console.log(`   Case Workers (SUB_ADMIN): ${caseWorkerCount}`);
    console.log(`   Board Members: ${boardMemberCount}`);
    console.log(`   Admin Users: ${adminCount} (will be preserved)`);
    console.log(`   Universities: ${universityCount} (will be preserved)`);
    
    // 1. Delete all related data first (foreign key constraints)
    console.log('\n🗑️  Step 1: Deleting related student data...');
    
    // Delete applications (which may have field reviews, messages, etc.)
    const deletedApplications = await prisma.application.deleteMany({});
    console.log(`   ✅ Deleted ${deletedApplications.count} applications`);
    
    // Delete field reviews
    const deletedFieldReviews = await prisma.fieldReview.deleteMany({});
    console.log(`   ✅ Deleted ${deletedFieldReviews.count} field reviews`);
    
    // Delete messages
    const deletedMessages = await prisma.message.deleteMany({});
    console.log(`   ✅ Deleted ${deletedMessages.count} messages`);
    
    // Delete conversations
    const deletedConversations = await prisma.conversation.deleteMany({});
    console.log(`   ✅ Deleted ${deletedConversations.count} conversations`);
    
    // Delete sponsorships
    const deletedSponsorships = await prisma.sponsorship.deleteMany({});
    console.log(`   ✅ Deleted ${deletedSponsorships.count} sponsorships`);
    
    // Delete disbursements
    const deletedDisbursements = await prisma.disbursement.deleteMany({});
    console.log(`   ✅ Deleted ${deletedDisbursements.count} disbursements`);
    
    // Delete documents
    const deletedDocuments = await prisma.document.deleteMany({});
    console.log(`   ✅ Deleted ${deletedDocuments.count} documents`);
    
    // Delete progress updates
    const deletedProgressUpdates = await prisma.studentProgress.deleteMany({});
    console.log(`   ✅ Deleted ${deletedProgressUpdates.count} progress updates`);
    
    // Delete progress reports
    const deletedProgressReports = await prisma.progressReport.deleteMany({});
    console.log(`   ✅ Deleted ${deletedProgressReports.count} progress reports`);
    
    // Delete interviews and related data
    const deletedInterviewDecisions = await prisma.interviewDecision.deleteMany({});
    console.log(`   ✅ Deleted ${deletedInterviewDecisions.count} interview decisions`);
    
    const deletedInterviewPanelMembers = await prisma.interviewPanelMember.deleteMany({});
    console.log(`   ✅ Deleted ${deletedInterviewPanelMembers.count} interview panel members`);
    
    const deletedInterviews = await prisma.interview.deleteMany({});
    console.log(`   ✅ Deleted ${deletedInterviews.count} interviews`);
    
    console.log('\n🗑️  Step 2: Deleting students...');
    
    // Delete all students
    const deletedStudents = await prisma.student.deleteMany({});
    console.log(`   ✅ Deleted ${deletedStudents.count} students`);
    
    console.log('\n🗑️  Step 3: Deleting case workers (SUB_ADMIN users)...');
    
    // Delete case workers (SUB_ADMIN role users)
    const deletedCaseWorkers = await prisma.user.deleteMany({
      where: { role: 'SUB_ADMIN' }
    });
    console.log(`   ✅ Deleted ${deletedCaseWorkers.count} case workers`);
    
    console.log('\n🗑️  Step 4: Deleting board members...');
    
    // Delete all board members
    const deletedBoardMembers = await prisma.boardMember.deleteMany({});
    console.log(`   ✅ Deleted ${deletedBoardMembers.count} board members`);
    
    console.log('\n🗑️  Step 5: Deleting donors and related data...');
    
    // Delete donors
    const deletedDonors = await prisma.donor.deleteMany({});
    console.log(`   ✅ Deleted ${deletedDonors.count} donors`);
    
    // Delete donor users
    const deletedDonorUsers = await prisma.user.deleteMany({
      where: { role: 'DONOR' }
    });
    console.log(`   ✅ Deleted ${deletedDonorUsers.count} donor users`);
    
    // Verify what remains
    const remainingStudents = await prisma.student.count();
    const remainingCaseWorkers = await prisma.user.count({ where: { role: 'SUB_ADMIN' } });
    const remainingBoardMembers = await prisma.boardMember.count();
    const remainingAdmins = await prisma.user.count({ where: { role: 'ADMIN' } });
    const remainingUniversities = await prisma.university.count();
    const remainingUsers = await prisma.user.count();
    
    console.log('\n✅ Cleanup completed successfully!');
    console.log('📊 Final database status:');
    console.log(`   Students: ${remainingStudents}`);
    console.log(`   Case Workers: ${remainingCaseWorkers}`);
    console.log(`   Board Members: ${remainingBoardMembers}`);
    console.log(`   Admin Users: ${remainingAdmins} (preserved)`);
    console.log(`   Universities: ${remainingUniversities} (preserved)`);
    console.log(`   Total Remaining Users: ${remainingUsers} (should only be admins)`);
    
    console.log('\n🎯 Database is now ready for fresh testing!');
    
  } catch (error) {
    console.error('❌ Error during database cleanup:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the cleanup
cleanupDatabase();