// debug-students.js - Check student records and their relationships
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function debugStudents() {
  try {
    console.log('🔍 Checking student records...');
    console.log('=====================================');
    
    // Get all users with student role
    const studentUsers = await prisma.user.findMany({
      where: { role: 'STUDENT' },
      include: {
        student: true
      },
      orderBy: { createdAt: 'desc' }
    });

    console.log(`Found ${studentUsers.length} STUDENT users:`);
    
    for (const user of studentUsers) {
      console.log(`\n👤 User: ${user.name || 'NULL'} (${user.email})`);
      console.log(`   User ID: ${user.id}`);
      console.log(`   Student Record: ${user.student ? 'EXISTS' : 'MISSING'}`);
      
      if (user.student) {
        console.log(`   Student ID: ${user.student.id}`);
        console.log(`   University: ${user.student.university}`);
        console.log(`   Program: ${user.student.program}`);
        console.log(`   Country: ${user.student.country}`);
      } else {
        console.log(`   ❌ No student profile found for user ${user.id}`);
      }
    }

    // Check for orphaned student records
    const allStudents = await prisma.student.findMany({
      include: {
        User: true
      }
    });

    console.log(`\n📊 Total student records: ${allStudents.length}`);
    const orphanedStudents = allStudents.filter(s => !s.User);
    
    if (orphanedStudents.length > 0) {
      console.log(`⚠️  Found ${orphanedStudents.length} orphaned student records:`);
      orphanedStudents.forEach(s => {
        console.log(`   - Student ID: ${s.id}, Name: ${s.name}, Email: ${s.email}`);
      });
    }
    
  } catch (error) {
    console.error('❌ Error debugging students:', error);
  } finally {
    await prisma.$disconnect();
  }
}

debugStudents();