// Check for missing student-user relationships
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function investigateMissingStudent() {
  console.log('Investigating Missing Student Record');
  console.log('==================================\n');
  
  try {
    // Check all users
    const allUsers = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
        student: {
          select: {
            id: true,
            name: true,
            studentPhase: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });
    
    console.log(' All Users:');
    allUsers.forEach(user => {
      const hasStudent = user.student ? ' Has Student' : ' No Student';
      console.log(`   - ${user.name} (${user.email}) - ${user.role} - ${hasStudent}`);
    });
    
    // Check for STUDENT role users without student records
    const studentUsers = allUsers.filter(u => u.role === 'STUDENT');
    const studentUsersWithoutRecords = studentUsers.filter(u => !u.student);
    
    console.log(`\n STUDENT Role Analysis:`);
    console.log(`   - Total STUDENT users: ${studentUsers.length}`);
    console.log(`   - STUDENT users without student records: ${studentUsersWithoutRecords.length}`);
    
    if (studentUsersWithoutRecords.length > 0) {
      console.log('\n STUDENT users missing student records:');
      studentUsersWithoutRecords.forEach(user => {
        console.log(`   - ${user.name} (${user.email}) - Created: ${user.createdAt.toISOString()}`);
      });
    }
    
    // Check current students count
    const studentCount = await prisma.student.count();
    const studentUserCount = await prisma.user.count({ where: { role: 'STUDENT' } });
    
    console.log(`\n Database Counts:`);
    console.log(`   - Student records: ${studentCount}`);
    console.log(`   - STUDENT users: ${studentUserCount}`);
    console.log(`   - Statistics totalStudents: ${studentUserCount} (should match)`);
    
    // If you just completed an application, there might be a STUDENT user account
    // that lost its corresponding student record during cleanup
    if (studentUserCount > studentCount) {
      console.log(`\n️  Mismatch detected!`);
      console.log(`   There are ${studentUserCount - studentCount} STUDENT users without student records`);
      console.log(`   This suggests your real application user account exists but lost its student record`);
    }
    
  } catch (error) {
    console.error(' Investigation failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

investigateMissingStudent();