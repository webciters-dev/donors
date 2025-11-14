import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkDatabaseState() {
    try {
        console.log('🔍 Checking complete database state...\n');

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
        console.log(`👥 Users in database: ${users.length}`);
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
                firstName: true,
                lastName: true,
                status: true
            }
        });
        console.log(`🎓 Students in database: ${students.length}`);
        students.forEach((student, index) => {
            console.log(`${index + 1}. ${student.firstName} ${student.lastName} (${student.email}) - Status: ${student.status}`);
        });
        console.log();

        // Check Applications
        const applications = await prisma.studentApplication.findMany({
            select: {
                id: true,
                studentId: true,
                status: true
            }
        });
        console.log(`📄 Applications in database: ${applications.length}`);
        console.log();

        // Check Universities
        const universities = await prisma.university.count();
        console.log(`🏛️  Universities: ${universities}`);

        // Check Degree Levels
        const degreeLevels = await prisma.degreeLevel.count();
        console.log(`📚 Degree Levels: ${degreeLevels}`);

        // Check Degrees
        const degrees = await prisma.degree.count();
        console.log(`🎯 Degrees: ${degrees}`);

        // Check Programs
        const programs = await prisma.program.count();
        console.log(`📖 Programs: ${programs}`);

        // Check Donors
        const donors = await prisma.donor.count();
        console.log(`💰 Donors: ${donors}`);

        // Check Case Workers
        const caseWorkers = await prisma.caseWorker.count();
        console.log(`👔 Case Workers: ${caseWorkers}`);

        // Check Board Members
        const boardMembers = await prisma.boardMember.count();
        console.log(`🏢 Board Members: ${boardMembers}`);

        // Check Sponsorships
        const sponsorships = await prisma.sponsorship.count();
        console.log(`🤝 Sponsorships: ${sponsorships}`);

    } catch (error) {
        console.error('❌ Error checking database state:', error);
    } finally {
        await prisma.$disconnect();
    }
}

checkDatabaseState();