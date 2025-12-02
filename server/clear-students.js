import { PrismaClient } from '@prisma/client';

async function clearStudents() {
  const prisma = new PrismaClient();
  
  try {
    console.log(' Starting database cleanup...');
    
    // First, get counts before deletion
    const studentCount = await prisma.student.count();
    const applicationCount = await prisma.application.count();
    const userCount = await prisma.user.count({ where: { role: 'STUDENT' } });
    
    console.log(' Current counts:');
    console.log(`   Students: ${studentCount}`);
    console.log(`   Applications: ${applicationCount}`);
    console.log(`   Student Users: ${userCount}`);
    
    if (studentCount === 0 && applicationCount === 0 && userCount === 0) {
      console.log(' Database is already clean!');
      return;
    }
    
    console.log('\n️ Clearing database...');
    
    // Delete in proper order to avoid foreign key constraints
    // 1. Delete applications first (references students)
    const deletedApplications = await prisma.application.deleteMany({});
    console.log(`    Deleted ${deletedApplications.count} applications`);
    
    // 2. Delete other related records
    const deletedMessages = await prisma.message.deleteMany({});
    console.log(`    Deleted ${deletedMessages.count} messages`);
    
    const deletedConversations = await prisma.conversation.deleteMany({});
    console.log(`    Deleted ${deletedConversations.count} conversations`);
    
    const deletedDisbursements = await prisma.disbursement.deleteMany({});
    console.log(`    Deleted ${deletedDisbursements.count} disbursements`);
    
    const deletedDocuments = await prisma.document.deleteMany({});
    console.log(`    Deleted ${deletedDocuments.count} documents`);
    
    const deletedFieldReviews = await prisma.fieldReview.deleteMany({});
    console.log(`    Deleted ${deletedFieldReviews.count} field reviews`);
    
    const deletedSponsorships = await prisma.sponsorship.deleteMany({});
    console.log(`    Deleted ${deletedSponsorships.count} sponsorships`);
    
    const deletedProgress = await prisma.studentProgress.deleteMany({});
    console.log(`    Deleted ${deletedProgress.count} progress records`);
    
    const deletedReports = await prisma.progressReport.deleteMany({});
    console.log(`    Deleted ${deletedReports.count} progress reports`);
    
    const deletedInterviews = await prisma.interview.deleteMany({});
    console.log(`    Deleted ${deletedInterviews.count} interviews`);
    
    // 3. Delete student users
    const deletedUsers = await prisma.user.deleteMany({
      where: { role: 'STUDENT' }
    });
    console.log(`    Deleted ${deletedUsers.count} student users`);
    
    // 4. Finally delete students
    const deletedStudents = await prisma.student.deleteMany({});
    console.log(`    Deleted ${deletedStudents.count} students`);
    
    console.log('\n Database cleanup complete!');
    console.log(' Final counts:');
    
    const finalStudentCount = await prisma.student.count();
    const finalApplicationCount = await prisma.application.count();
    const finalUserCount = await prisma.user.count({ where: { role: 'STUDENT' } });
    
    console.log(`   Students: ${finalStudentCount}`);
    console.log(`   Applications: ${finalApplicationCount}`);
    console.log(`   Student Users: ${finalUserCount}`);
    
    if (finalStudentCount === 0 && finalApplicationCount === 0 && finalUserCount === 0) {
      console.log(' Database successfully cleaned!');
    } else {
      console.log('️ Some records may remain - check manually');
    }
    
  } catch (error) {
    console.error(' Error during cleanup:', error);
  } finally {
    await prisma.$disconnect();
  }
}

clearStudents();