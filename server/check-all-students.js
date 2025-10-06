// Check all students in database
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function checkAllStudents() {
  try {
    console.log('🔍 Checking all students in database...');
    
    const students = await prisma.student.findMany({
      include: {
        applications: true,
        messages: true,
        fieldReviews: true
      }
    });
    
    console.log(`\n📊 Found ${students.length} student(s) in database:`);
    
    students.forEach((student, index) => {
      console.log(`\n${index + 1}. ${student.name}`);
      console.log(`   Email: ${student.email}`);
      console.log(`   University: ${student.university}`);
      console.log(`   Program: ${student.program}`);
      console.log(`   Student ID: ${student.id}`);
      console.log(`   Applications: ${student.applications.length}`);
      console.log(`   Messages: ${student.messages.length}`);
      console.log(`   Field Reviews: ${student.fieldReviews.length}`);
    });
    
    // Check users table as well
    const users = await prisma.user.findMany({
      where: { role: 'STUDENT' }
    });
    
    console.log(`\n👥 Found ${users.length} STUDENT user account(s):`);
    users.forEach((user, index) => {
      console.log(`${index + 1}. ${user.email} (Student ID: ${user.studentId})`);
    });
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkAllStudents();