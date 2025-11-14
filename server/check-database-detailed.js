import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkDatabaseDetailed() {
  console.log('🔍 Detailed Database Check...\n');

  try {
    // Check all users
    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        role: true,
        firstName: true,
        lastName: true,
        createdAt: true
      }
    });

    console.log(`👥 Users (${users.length}):`);
    users.forEach((user, index) => {
      console.log(`${index + 1}. ${user.firstName || 'No name'} (${user.email}) - Role: ${user.role}`);
      console.log(`   ID: ${user.id} | Created: ${user.createdAt.toLocaleDateString('en-GB')}`);
    });

    // Check all students
    const students = await prisma.student.findMany({
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        createdAt: true,
        status: true
      }
    });

    console.log(`\n🎓 Students (${students.length}):`);
    students.forEach((student, index) => {
      console.log(`${index + 1}. ${student.firstName || 'No name'} ${student.lastName || ''} (${student.email}) - Status: ${student.status}`);
      console.log(`   ID: ${student.id} | Created: ${student.createdAt.toLocaleDateString('en-GB')}`);
    });

    // Check applications
    const applications = await prisma.application.findMany({
      select: {
        id: true,
        studentId: true,
        status: true,
        createdAt: true
      }
    });

    console.log(`\n📋 Applications (${applications.length}):`);
    applications.forEach((application, index) => {
      console.log(`${index + 1}. Application ID: ${application.id} - Student: ${application.studentId} - Status: ${application.status}`);
      console.log(`   Created: ${application.createdAt.toLocaleDateString('en-GB')}`);
    });

    // Check case workers
    const caseWorkers = await prisma.caseWorker.findMany({
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        createdAt: true
      }
    });

    console.log(`\n👨‍💼 Case Workers (${caseWorkers.length}):`);
    caseWorkers.forEach((worker, index) => {
      console.log(`${index + 1}. ${worker.firstName || 'No name'} ${worker.lastName || ''} (${worker.email})`);
      console.log(`   ID: ${worker.id} | Created: ${worker.createdAt.toLocaleDateString('en-GB')}`);
    });

    // Check board members
    const boardMembers = await prisma.boardMember.findMany({
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        createdAt: true
      }
    });

    console.log(`\n🏛️ Board Members (${boardMembers.length}):`);
    boardMembers.forEach((member, index) => {
      console.log(`${index + 1}. ${member.firstName || 'No name'} ${member.lastName || ''} (${member.email})`);
      console.log(`   ID: ${member.id} | Created: ${member.createdAt.toLocaleDateString('en-GB')}`);
    });

    // Check universities (just count)
    const universityCount = await prisma.university.count();
    console.log(`\n🏫 Universities: ${universityCount}`);

  } catch (error) {
    console.error('❌ Error checking database:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

checkDatabaseDetailed();