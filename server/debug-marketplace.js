// debug-marketplace.js
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function debugMarketplace() {
  try {
    console.log('🔍 Debugging Marketplace Visibility Issue...\n');
    
    // 1. Check all students with applications
    console.log('1️⃣ Checking all students and their applications:');
    const allStudents = await prisma.student.findMany({
      include: {
        applications: true,
        documents: true
      }
    });
    
    console.log(`Total students in database: ${allStudents.length}\n`);
    
    allStudents.forEach((student, i) => {
      console.log(`${i+1}. ${student.name} (${student.email})`);
      console.log(`   Applications: ${student.applications.length}`);
      student.applications.forEach(app => {
        console.log(`     - Status: ${app.status}, Term: ${app.term}`);
      });
      console.log(`   Documents: ${student.documents.length} uploaded`);
      const approvedApps = student.applications.filter(app => app.status === 'APPROVED');
      if (approvedApps.length > 0) {
        console.log(`   ✅ HAS APPROVED APPLICATION(S)`);
      }
      console.log('');
    });
    
    // 2. Test the exact marketplace query
    console.log('2️⃣ Testing exact marketplace query (GET /api/students/approved):');
    const marketplaceStudents = await prisma.student.findMany({
      where: {
        applications: {
          some: { status: "APPROVED" },
        },
      },
      include: {
        applications: {
          where: { status: "APPROVED" },
          orderBy: { submittedAt: "desc" },
          take: 1,
        },
        sponsorships: {
          select: { amount: true },
        },
      },
    });
    
    console.log(`Students that should appear in marketplace: ${marketplaceStudents.length}`);
    
    if (marketplaceStudents.length === 0) {
      console.log('❌ NO STUDENTS FOUND FOR MARKETPLACE');
      console.log('This means no students have status = "APPROVED"');
    } else {
      marketplaceStudents.forEach((student, i) => {
        console.log(`${i+1}. ${student.name}`);
        console.log(`   Approved app: ${student.applications[0]?.term} - $${student.applications[0]?.needUSD}`);
      });
    }
    
    // 3. Check required documents for approved students
    console.log('\n3️⃣ Checking document completeness for approved students:');
    const requiredDocs = ['CNIC', 'GUARDIAN_CNIC', 'HSSC_RESULT', 'PHOTO', 'FEE_INVOICE', 'INCOME_CERTIFICATE', 'UTILITY_BILL', 'UNIVERSITY_CARD', 'ENROLLMENT_CERTIFICATE', 'TRANSCRIPT'];
    
    for (const student of marketplaceStudents) {
      const docs = await prisma.document.findMany({
        where: { studentId: student.id },
        select: { type: true }
      });
      
      const uploadedTypes = docs.map(d => d.type);
      const missing = requiredDocs.filter(req => !uploadedTypes.includes(req));
      
      console.log(`${student.name}:`);
      console.log(`   Uploaded: [${uploadedTypes.join(', ')}]`);
      if (missing.length > 0) {
        console.log(`   Missing: [${missing.join(', ')}] ⚠️`);
      } else {
        console.log(`   ✅ All required documents uploaded`);
      }
    }
    
  } catch (error) {
    console.error('❌ Error debugging marketplace:', error);
  } finally {
    await prisma.$disconnect();
  }
}

debugMarketplace();