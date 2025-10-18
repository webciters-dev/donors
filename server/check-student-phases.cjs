const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkStudentPhases() {
  try {
    // Check Humaria's current phase and application status
    const student = await prisma.student.findFirst({
      where: { name: { contains: 'Humaria' } },
      include: { 
        applications: {
          orderBy: { submittedAt: 'desc' }
        }
      }
    });
    
    console.log('=== HUMARIA PHASE CHECK ===');
    if (student) {
      console.log('Student ID:', student.id);
      console.log('Student Phase:', student.studentPhase || 'NULL');
      console.log('Latest Application Status:', student.applications[0]?.status || 'No applications');
      console.log('Application ID:', student.applications[0]?.id);
      console.log('Application Amount:', student.applications[0]?.amount);
      console.log('Application Currency:', student.applications[0]?.currency);
    } else {
      console.log('Humaria not found');
    }
    
    // Check all approved students and their phases
    console.log('\n=== ALL APPROVED STUDENTS ===');
    const approvedApplications = await prisma.application.findMany({
      where: { status: 'APPROVED' },
      include: { student: true },
      take: 10
    });
    
    console.log(`Found ${approvedApplications.length} approved applications`);
    approvedApplications.forEach(app => {
      console.log(`Student: ${app.student.name} | Phase: ${app.student.studentPhase || 'NULL'} | App Status: ${app.status}`);
    });
    
    // Check if studentPhase field exists in schema
    console.log('\n=== CHECKING STUDENT SCHEMA ===');
    const sampleStudent = await prisma.student.findFirst();
    if (sampleStudent) {
      console.log('Sample student keys:', Object.keys(sampleStudent));
      console.log('Has studentPhase field:', 'studentPhase' in sampleStudent);
    }
    
    process.exit(0);
  } catch (e) {
    console.error('Error:', e.message);
    console.error('Stack:', e.stack);
    process.exit(1);
  }
}

checkStudentPhases();