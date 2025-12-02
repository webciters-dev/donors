import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function finalDatabaseCleanup() {
    try {
        console.log(' Final database cleanup - keeping only admin and university academic data...\n');

        // Clean in proper order to respect foreign key constraints

        // 1. Delete all applications first (references students)
        const deletedApplications = await prisma.application.deleteMany({});
        console.log(` Deleted ${deletedApplications.count} applications`);

        // 2. Delete all conversation messages
        const deletedConversationMessages = await prisma.conversationMessage.deleteMany({});
        console.log(` Deleted ${deletedConversationMessages.count} conversation messages`);

        // 3. Delete all conversations
        const deletedConversations = await prisma.conversation.deleteMany({});
        console.log(` Deleted ${deletedConversations.count} conversations`);

        // 4. Delete all messages
        const deletedMessages = await prisma.message.deleteMany({});
        console.log(` Deleted ${deletedMessages.count} messages`);

        // 5. Delete all sponsorships
        const deletedSponsorships = await prisma.sponsorship.deleteMany({});
        console.log(` Deleted ${deletedSponsorships.count} sponsorships`);

        // 6. Delete all disbursements
        const deletedDisbursements = await prisma.disbursement.deleteMany({});
        console.log(` Deleted ${deletedDisbursements.count} disbursements`);

        // 7. Delete all documents
        const deletedDocuments = await prisma.document.deleteMany({});
        console.log(` Deleted ${deletedDocuments.count} documents`);

        // 8. Delete all field reviews
        const deletedFieldReviews = await prisma.fieldReview.deleteMany({});
        console.log(` Deleted ${deletedFieldReviews.count} field reviews`);

        // 9. Delete all student progress
        const deletedStudentProgress = await prisma.studentProgress.deleteMany({});
        console.log(` Deleted ${deletedStudentProgress.count} student progress records`);

        // 10. Delete all progress report attachments
        const deletedProgressReportAttachments = await prisma.progressReportAttachment.deleteMany({});
        console.log(` Deleted ${deletedProgressReportAttachments.count} progress report attachments`);

        // 11. Delete all progress reports
        const deletedProgressReports = await prisma.progressReport.deleteMany({});
        console.log(` Deleted ${deletedProgressReports.count} progress reports`);

        // 12. Delete all interview decisions
        const deletedInterviewDecisions = await prisma.interviewDecision.deleteMany({});
        console.log(` Deleted ${deletedInterviewDecisions.count} interview decisions`);

        // 13. Delete all interview panel members
        const deletedInterviewPanelMembers = await prisma.interviewPanelMember.deleteMany({});
        console.log(` Deleted ${deletedInterviewPanelMembers.count} interview panel members`);

        // 14. Delete all interviews
        const deletedInterviews = await prisma.interview.deleteMany({});
        console.log(` Deleted ${deletedInterviews.count} interviews`);

        // 15. Delete all board members
        const deletedBoardMembers = await prisma.boardMember.deleteMany({});
        console.log(` Deleted ${deletedBoardMembers.count} board members`);

        // 16. Delete all students
        const deletedStudents = await prisma.student.deleteMany({});
        console.log(` Deleted ${deletedStudents.count} students`);

        // 17. Delete all donors
        const deletedDonors = await prisma.donor.deleteMany({});
        console.log(` Deleted ${deletedDonors.count} donors`);

        // 18. Delete all non-admin users
        const deletedUsers = await prisma.user.deleteMany({
            where: {
                role: {
                    not: 'ADMIN'
                }
            }
        });
        console.log(` Deleted ${deletedUsers.count} non-admin users`);

        // 19. Clean up password resets
        const deletedPasswordResets = await prisma.passwordReset.deleteMany({});
        console.log(` Deleted ${deletedPasswordResets.count} password reset requests`);

        console.log('\n Final database state:');
        
        // Check what remains - these should have data
        const finalUsers = await prisma.user.count();
        const finalUniversities = await prisma.university.count();
        const finalUniversityDegreeLevels = await prisma.universityDegreeLevel.count();
        const finalUniversityFields = await prisma.universityField.count();
        const finalUniversityPrograms = await prisma.universityProgram.count();
        
        // These should be empty now
        const finalStudents = await prisma.student.count();
        const finalApplications = await prisma.application.count();
        const finalDonors = await prisma.donor.count();
        const finalBoardMembers = await prisma.boardMember.count();
        const finalSponsorships = await prisma.sponsorship.count();
        const finalMessages = await prisma.message.count();
        const finalConversations = await prisma.conversation.count();
        
        console.log('\n PRESERVED DATA (should have counts):');
        console.log(` Admin Users: ${finalUsers}`);
        console.log(`️  Universities: ${finalUniversities}`);
        console.log(` University Degree Levels: ${finalUniversityDegreeLevels}`);
        console.log(` University Fields: ${finalUniversityFields}`);
        console.log(` University Programs: ${finalUniversityPrograms}`);
        
        console.log('\n️  CLEANED DATA (should be 0):');
        console.log(` Students: ${finalStudents}`);
        console.log(` Applications: ${finalApplications}`);
        console.log(` Donors: ${finalDonors}`);
        console.log(` Board Members: ${finalBoardMembers}`);
        console.log(` Sponsorships: ${finalSponsorships}`);
        console.log(` Messages: ${finalMessages}`);
        console.log(` Conversations: ${finalConversations}`);

        if (finalUsers === 1 && finalUniversities > 200 && finalStudents === 0 && finalDonors === 0) {
            console.log('\n SUCCESS: Database cleaned properly!');
            console.log(' Only admin user and university data remain');
            console.log(' Statistics should now show: 0 students, 0 donors, preserved universities');
        } else {
            console.log('\n️  Warning: Database state may not be as expected');
        }

    } catch (error) {
        console.error(' Error in database cleanup:', error);
    } finally {
        await prisma.$disconnect();
    }
}

finalDatabaseCleanup();