import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkAndCleanDatabase() {
    try {
        console.log(' Checking complete database state...\n');

        // Check Users
        const users = await prisma.user.findMany({
            select: {
                id: true,
                name: true,
                email: true,
                role: true,
                createdAt: true
            }
        });
        console.log(` Users in database: ${users.length}`);
        users.forEach((user, index) => {
            console.log(`${index + 1}. ${user.name || 'No name'} (${user.email}) - Role: ${user.role}`);
            console.log(`   ID: ${user.id} | Created: ${user.createdAt.toLocaleDateString()}`);
        });
        console.log();

        // Check Students
        const students = await prisma.student.findMany({
            select: {
                id: true,
                email: true,
                name: true,
                studentPhase: true
            }
        });
        console.log(` Students in database: ${students.length}`);
        students.forEach((student, index) => {
            console.log(`${index + 1}. ${student.name} (${student.email}) - Phase: ${student.studentPhase}`);
        });
        console.log();

        // Check Applications
        const applications = await prisma.application.findMany({
            select: {
                id: true,
                studentId: true,
                status: true
            }
        });
        console.log(` Applications in database: ${applications.length}`);
        applications.forEach((app, index) => {
            console.log(`${index + 1}. Student ID: ${app.studentId} - Status: ${app.status}`);
        });
        console.log();

        // Check Student Applications
        const studentApplications = await prisma.studentApplication.findMany({
            select: {
                id: true,
                studentId: true,
                status: true
            }
        });
        console.log(` Student Applications in database: ${studentApplications.length}`);
        studentApplications.forEach((app, index) => {
            console.log(`${index + 1}. Student ID: ${app.studentId} - Status: ${app.status}`);
        });
        console.log();

        // Check Universities
        const universities = await prisma.university.count();
        console.log(`️  Universities: ${universities}`);

        // Check Degree Levels
        const degreeLevels = await prisma.degreeLevel.count();
        console.log(` Degree Levels: ${degreeLevels}`);

        // Check Degrees
        const degrees = await prisma.degree.count();
        console.log(` Degrees: ${degrees}`);

        // Check Programs
        const programs = await prisma.program.count();
        console.log(` Programs: ${programs}`);

        // Check Donors
        const donors = await prisma.donor.count();
        console.log(` Donors: ${donors}`);

        // Check Case Workers
        const caseWorkers = await prisma.caseWorker.count();
        console.log(` Case Workers: ${caseWorkers}`);

        // Check Board Members
        const boardMembers = await prisma.boardMember.count();
        console.log(` Board Members: ${boardMembers}`);

        // Check Sponsorships
        const sponsorships = await prisma.sponsorship.count();
        console.log(` Sponsorships: ${sponsorships}`);

        // Now clean up any unwanted data
        console.log('\n Starting cleanup of unwanted data...\n');

        // Delete all student applications
        const deletedStudentApplications = await prisma.studentApplication.deleteMany({});
        console.log(` Deleted ${deletedStudentApplications.count} student applications`);

        // Delete all applications
        const deletedApplications = await prisma.application.deleteMany({});
        console.log(` Deleted ${deletedApplications.count} applications`);

        // Delete all students
        const deletedStudents = await prisma.student.deleteMany({});
        console.log(` Deleted ${deletedStudents.count} students`);

        // Delete all non-admin users
        const deletedUsers = await prisma.user.deleteMany({
            where: {
                role: {
                    not: 'ADMIN'
                }
            }
        });
        console.log(` Deleted ${deletedUsers.count} non-admin users`);

        // Delete all donors
        const deletedDonors = await prisma.donor.deleteMany({});
        console.log(` Deleted ${deletedDonors.count} donors`);

        // Delete all case workers
        const deletedCaseWorkers = await prisma.caseWorker.deleteMany({});
        console.log(` Deleted ${deletedCaseWorkers.count} case workers`);

        // Delete all board members
        const deletedBoardMembers = await prisma.boardMember.deleteMany({});
        console.log(` Deleted ${deletedBoardMembers.count} board members`);

        // Delete all sponsorships
        const deletedSponsorships = await prisma.sponsorship.deleteMany({});
        console.log(` Deleted ${deletedSponsorships.count} sponsorships`);

        console.log('\n Final database state:');
        
        // Final counts
        const finalUsers = await prisma.user.count();
        const finalUniversities = await prisma.university.count();
        const finalDegreeLevels = await prisma.degreeLevel.count();
        const finalDegrees = await prisma.degree.count();
        const finalPrograms = await prisma.program.count();
        const finalStudents = await prisma.student.count();
        const finalApplications = await prisma.application.count();
        const finalDonors = await prisma.donor.count();
        
        console.log(` Admin Users: ${finalUsers}`);
        console.log(`️  Universities: ${finalUniversities}`);
        console.log(` Degree Levels: ${finalDegreeLevels}`);
        console.log(` Degrees: ${finalDegrees}`);
        console.log(` Programs: ${finalPrograms}`);
        console.log(` Students: ${finalStudents}`);
        console.log(` Applications: ${finalApplications}`);
        console.log(` Donors: ${finalDonors}`);

    } catch (error) {
        console.error(' Error in database operations:', error);
    } finally {
        await prisma.$disconnect();
    }
}

checkAndCleanDatabase();