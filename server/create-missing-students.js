// create-missing-students.js - Create student records for users who don't have them
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function createMissingStudents() {
  try {
    console.log('🔧 Creating missing student records...');
    console.log('=====================================');
    
    // Find all STUDENT users without student records
    const usersWithoutStudents = await prisma.user.findMany({
      where: { 
        role: 'STUDENT',
        student: null
      }
    });

    console.log(`Found ${usersWithoutStudents.length} users without student records`);

    for (const user of usersWithoutStudents) {
      console.log(`\n👤 Creating student record for: ${user.name || user.email}`);
      
      // Create student record
      const student = await prisma.student.create({
        data: {
          name: user.name || "Student Name",
          email: user.email,
          gender: "M", // Default value
          university: "Not specified",
          field: "Not specified", 
          program: "Not specified",
          gpa: 0.0,
          gradYear: 2025,
          country: "Pakistan", // Default
          needUSD: 0,
          sponsored: false
        }
      });

      // Link user to student
      await prisma.user.update({
        where: { id: user.id },
        data: { studentId: student.id }
      });

      console.log(`✅ Created student record: ${student.id} for user: ${user.id}`);
    }

    console.log('\n🎉 All missing student records created!');
    
  } catch (error) {
    console.error('❌ Error creating student records:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createMissingStudents();