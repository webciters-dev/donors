// check-db-direct.cjs
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkDatabase() {
  try {
    console.log('🔍 Direct Database Check...\n');
    
    // Get all students with applications
    const students = await prisma.student.findMany({
      include: {
        applications: true,
        documents: {
          select: {
            type: true,
            originalName: true
          }
        }
      }
    });
    
    console.log(`Total students: ${students.length}\n`);
    
    students.forEach((student, i) => {
      console.log(`${i+1}. ${student.name} (${student.email})`);
      console.log(`   Created: ${student.createdAt}`);
      console.log(`   University: ${student.university}`);
      
      if (student.applications.length > 0) {
        console.log(`   Applications (${student.applications.length}):`);
        student.applications.forEach((app, j) => {
          console.log(`     ${j+1}. Status: ${app.status}`);
          console.log(`        Term: ${app.term}`);
          console.log(`        Need: $${app.needUSD} USD / Rs.${app.needPKR}`);
          console.log(`        Submitted: ${app.submittedAt}`);
        });
      } else {
        console.log(`   No applications`);
      }
      
      if (student.documents.length > 0) {
        console.log(`   Documents (${student.documents.length}):`);
        student.documents.forEach(doc => {
          console.log(`     - ${doc.type}: ${doc.originalName}`);
        });
      } else {
        console.log(`   No documents uploaded`);
      }
      
      const requiredDocs = ['CNIC', 'GUARDIAN_CNIC', 'HSSC_RESULT', 'PHOTO', 'FEE_INVOICE', 'INCOME_CERTIFICATE', 'UTILITY_BILL', 'UNIVERSITY_CARD', 'ENROLLMENT_CERTIFICATE', 'TRANSCRIPT'];
      const uploadedTypes = student.documents.map(d => d.type);
      const missing = requiredDocs.filter(req => !uploadedTypes.includes(req));
      
      if (missing.length > 0) {
        console.log(`   ⚠️ Missing required docs: ${missing.join(', ')}`);
      } else {
        console.log(`   ✅ All required documents present`);
      }
      
      console.log('');
    });
    
    // Check approved applications specifically
    const approvedApps = await prisma.application.findMany({
      where: { status: 'APPROVED' },
      include: {
        student: {
          select: { name: true, email: true }
        }
      }
    });
    
    console.log(`\n📋 Approved Applications: ${approvedApps.length}`);
    approvedApps.forEach((app, i) => {
      console.log(`${i+1}. ${app.student.name} - ${app.term} - $${app.needUSD}`);
    });
    
  } catch (error) {
    console.error('❌ Database error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkDatabase();