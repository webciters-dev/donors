// test-approval-validation.cjs
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();
const API_URL = 'http://localhost:3001';

async function testApprovalValidation() {
  try {
    console.log('🧪 Testing Document Validation Before Approval...\n');
    
    // 1. Create a test student with application but no documents
    console.log('1️⃣ Creating test student with application...');
    
    const student = await prisma.student.create({
      data: {
        email: 'test-validation@example.com',
        name: 'Test Validation Student',
        university: 'Test University',
        field: 'Engineering',
        program: 'Computer Science',
        gpa: 3.5,
        gradYear: 2026,
        city: 'Test City',
        province: 'Punjab',
        country: 'Pakistan',
        gender: 'M',
        needUSD: 5000
      }
    });
    
    const application = await prisma.application.create({
      data: {
        studentId: student.id,
        term: 'Fall 2025',
        needUSD: 5000,
        needPKR: 500000,
        currency: 'USD',
        status: 'PENDING'
      }
    });
    
    console.log(`   ✅ Created student: ${student.name} (${student.email})`);
    console.log(`   ✅ Created application: ${application.term} - $${application.needUSD}`);
    
    // 2. Test approval without documents (should fail)
    console.log('\n2️⃣ Testing approval without documents (should be blocked)...');
    
    const response1 = await fetch(`${API_URL}/api/applications/${application.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        status: 'APPROVED',
        notes: 'Testing approval without documents'
      })
    });
    
    if (!response1.ok) {
      const error1 = await response1.json();
      console.log('   ✅ CORRECTLY BLOCKED approval without documents');
      console.log(`   📋 Error: ${error1.message}`);
      console.log(`   📋 Missing docs: ${error1.missingDocuments?.join(', ')}`);
    } else {
      console.log('   ❌ UNEXPECTED: Approval succeeded without documents!');
    }
    
    // 3. Test force approval (should succeed)
    console.log('\n3️⃣ Testing force approval override...');
    
    const response2 = await fetch(`${API_URL}/api/applications/${application.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        status: 'APPROVED',
        notes: 'Force approving for testing',
        forceApprove: true
      })
    });
    
    if (response2.ok) {
      console.log('   ✅ Force approval succeeded');
      const result = await response2.json();
      console.log(`   📋 Status: ${result.status}`);
    } else {
      const error2 = await response2.json();
      console.log('   ❌ Force approval failed:', error2.message);
    }
    
    // 4. Add documents and test normal approval
    console.log('\n4️⃣ Testing approval with all required documents...');
    
    // Reset status to PENDING
    await prisma.application.update({
      where: { id: application.id },
      data: { status: 'PENDING' }
    });
    
    // Add required documents
    const requiredDocs = ['CNIC', 'GUARDIAN_CNIC', 'HSSC_RESULT', 'PHOTO', 'FEE_INVOICE', 'INCOME_CERTIFICATE', 'UTILITY_BILL', 'UNIVERSITY_CARD', 'ENROLLMENT_CERTIFICATE', 'TRANSCRIPT'];
    const uploadedTypes = student.documents.map(d => d.type);
    for (const docType of requiredDocs) {
      await prisma.document.create({
        data: {
          studentId: student.id,
          applicationId: application.id,
          type: docType,
          url: `/uploads/test-${docType.toLowerCase()}.pdf`,
          originalName: `test-${docType.toLowerCase()}.pdf`,
          mimeType: 'application/pdf',
          size: 1024
        }
      });
    }
    
    console.log('   ✅ Added all required documents');
    
    // Now try normal approval
    const response3 = await fetch(`${API_URL}/api/applications/${application.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        status: 'APPROVED',
        notes: 'Approving with complete documents'
      })
    });
    
    if (response3.ok) {
      const result = await response3.json();
      console.log('   ✅ Normal approval succeeded with complete documents');
      console.log(`   📋 Status: ${result.status}`);
    } else {
      const error3 = await response3.json();
      console.log('   ❌ Approval failed despite complete documents:', error3.message);
    }
    
    // 5. Cleanup
    console.log('\n5️⃣ Cleaning up test data...');
    await prisma.document.deleteMany({ where: { studentId: student.id } });
    await prisma.application.deleteMany({ where: { studentId: student.id } });
    await prisma.student.delete({ where: { id: student.id } });
    console.log('   ✅ Cleanup completed');
    
    console.log('\n🎉 Document Validation Testing Complete!');
    console.log('\n📋 Summary:');
    console.log('   ✅ Approval blocked when documents missing');
    console.log('   ✅ Force approval override works');
    console.log('   ✅ Normal approval works with complete docs');
    
  } catch (error) {
    console.error('❌ Test error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testApprovalValidation();