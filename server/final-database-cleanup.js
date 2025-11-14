import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function finalCleanup() {
    try {
        console.log('🧹 Final database cleanup - keeping only admin and academic data...\n');

        // Delete all applications first (foreign key constraints)
        const deletedApplications = await prisma.application.deleteMany({});
        console.log(`✅ Deleted ${deletedApplications.count} applications`);

        // Delete all students
        const deletedStudents = await prisma.student.deleteMany({});
        console.log(`✅ Deleted ${deletedStudents.count} students`);

        // Delete all non-admin users
        const deletedUsers = await prisma.user.deleteMany({
            where: {
                role: {
                    not: 'ADMIN'
                }
            }
        });
        console.log(`✅ Deleted ${deletedUsers.count} non-admin users`);

        // Delete all donors
        const deletedDonors = await prisma.donor.deleteMany({});
        console.log(`✅ Deleted ${deletedDonors.count} donors`);

        // Delete all case workers
        const deletedCaseWorkers = await prisma.caseWorker.deleteMany({});
        console.log(`✅ Deleted ${deletedCaseWorkers.count} case workers`);

        // Delete all board members
        const deletedBoardMembers = await prisma.boardMember.deleteMany({});
        console.log(`✅ Deleted ${deletedBoardMembers.count} board members`);

        // Delete all sponsorships
        const deletedSponsorships = await prisma.sponsorship.deleteMany({});
        console.log(`✅ Deleted ${deletedSponsorships.count} sponsorships`);

        // Delete all interviews
        const deletedInterviews = await prisma.interview.deleteMany({});
        console.log(`✅ Deleted ${deletedInterviews.count} interviews`);

        // Delete all messages
        const deletedMessages = await prisma.message.deleteMany({});
        console.log(`✅ Deleted ${deletedMessages.count} messages`);

        // Delete all conversations
        const deletedConversations = await prisma.conversation.deleteMany({});
        console.log(`✅ Deleted ${deletedConversations.count} conversations`);

        // Delete all disbursements
        const deletedDisbursements = await prisma.disbursement.deleteMany({});
        console.log(`✅ Deleted ${deletedDisbursements.count} disbursements`);

        // Delete all documents
        const deletedDocuments = await prisma.document.deleteMany({});
        console.log(`✅ Deleted ${deletedDocuments.count} documents`);

        // Delete all field reviews
        const deletedFieldReviews = await prisma.fieldReview.deleteMany({});
        console.log(`✅ Deleted ${deletedFieldReviews.count} field reviews`);

        // Delete all progress updates
        const deletedProgressUpdates = await prisma.studentProgress.deleteMany({});
        console.log(`✅ Deleted ${deletedProgressUpdates.count} progress updates`);

        // Delete all progress reports
        const deletedProgressReports = await prisma.progressReport.deleteMany({});
        console.log(`✅ Deleted ${deletedProgressReports.count} progress reports`);

        console.log('\n🎯 Final database state:');
        
        // Final counts - what should remain
        const finalUsers = await prisma.user.count();
        const finalUniversities = await prisma.university.count();
        const finalDegreeLevels = await prisma.degreeLevel.count();
        const finalDegrees = await prisma.degree.count();
        const finalPrograms = await prisma.program.count();
        
        // What should be empty
        const finalStudents = await prisma.student.count();
        const finalApplications = await prisma.application.count();
        const finalDonors = await prisma.donor.count();
        const finalCaseWorkers = await prisma.caseWorker.count();
        const finalBoardMembers = await prisma.boardMember.count();
        const finalSponsorships = await prisma.sponsorship.count();
        
        console.log('\n✅ PRESERVED DATA (should have counts):');
        console.log(`👥 Admin Users: ${finalUsers}`);
        console.log(`🏛️  Universities: ${finalUniversities}`);
        console.log(`📚 Degree Levels: ${finalDegreeLevels}`);
        console.log(`🎯 Degrees: ${finalDegrees}`);
        console.log(`📖 Programs: ${finalPrograms}`);
        
        console.log('\n🗑️  CLEANED DATA (should be 0):');
        console.log(`🎓 Students: ${finalStudents}`);
        console.log(`📄 Applications: ${finalApplications}`);
        console.log(`💰 Donors: ${finalDonors}`);
        console.log(`👔 Case Workers: ${finalCaseWorkers}`);
        console.log(`🏢 Board Members: ${finalBoardMembers}`);
        console.log(`🤝 Sponsorships: ${finalSponsorships}`);

        console.log('\n✅ Database cleanup completed successfully!');
        console.log('📊 Statistics should now show: 0 students, 0 donors, preserved universities');

    } catch (error) {
        console.error('❌ Error in database cleanup:', error);
    } finally {
        await prisma.$disconnect();
    }
}

finalCleanup();